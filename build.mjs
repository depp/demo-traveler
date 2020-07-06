import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

import chalk from 'chalk';
import chokidar from 'chokidar';
import express from 'express';
import regpack from './RegPack/regPack.js';
const { packer } = regpack;
import send from 'send';
import terser from 'terser';
import WebSocket from 'ws';
import yargs from 'yargs';

// Maximum size of packed source.
const sizeLimit = 1024;

// Create a directory, unless it already exists.
async function mkdirExistOk(path) {
  try {
    const st = await stat(path);
    if (st.isDirectory()) {
      return;
    }
  } catch (e) {
    if (e.code != 'ENOENT') {
      throw e;
    }
  }
  await mkdir(path);
}

// Project root directory.
const rootDir = dirname(fileURLToPath(import.meta.url));

// Convert a project-relative path to an absolute path.
function path(...name) {
  return join(rootDir, ...name);
}

// Escape text so it can appear in an HTML text node.
function escapeTextHTML(text) {
  return text.replace(/&<>/g, (t) => {
    switch (t) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      default:
        throw new Error(`Unexpected text ${JSON.stringify(t)}`);
    }
  });
}

// Evaluate a template containing "{{variable}}" substitutions.
function evalTemplate(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    const value = variables.get(name);
    if (value == null) {
      throw new Error(
        `Template has undefined variable: ${JSON.stringify(name)}`,
      );
    }
    return value;
  });
}

function buildHTML(source, shim, title) {
  return evalTemplate(
    shim,
    new Map([
      ['title_html', escapeTextHTML(title)],
      ['title_js', JSON.stringify(title)],
      ['code', source],
    ]),
  );
}

function* runPacker(source, options) {
  for (const method of packer.runPacker(source, options)) {
    const uncompressed = method.contents;
    yield { uncompressed, compressed: uncompressed };
    const { result } = method;
    for (let i = result.length - 1; i >= 0; i--) {
      yield { uncompressed, compressed: result[i][1] };
    }
  }
}

function compressSource(source) {
  const parseOpts = { ecma: 2018 };
  // Extract the title from the source code.
  let title = null;
  const getTitle = new terser.TreeTransformer(function before(node) {
    if (node instanceof terser.AST_Toplevel) {
      const body = [];
      for (let node2 of node.body) {
        if (node2 instanceof terser.AST_Definitions) {
          const definitions = [];
          let changed = false;
          for (const def of node2.definitions) {
            const { name, value } = def;
            if (
              (name instanceof terser.AST_SymbolConst ||
                name instanceof terser.AST_SymbolLet ||
                name instanceof terser.AST_SymbolVar) &&
              name.name == 'title'
            ) {
              if (title != null) {
                throw new Error('Multiple titles');
              }
              if (!(value instanceof terser.AST_String)) {
                throw new Error('Title is not string');
              }
              title = value.value;
              changed = true;
            } else {
              definitions.push(def);
            }
          }
          if (changed) {
            if (definitions.length != 0) {
              node2 = new terser.AST_Definitions({
                start: node2.start,
                end: node2.end,
                definitions,
              });
            } else {
              node2 = null;
            }
          }
        }
        if (node2 != null) {
          body.push(node2);
        }
      }
      return new terser.AST_Toplevel({
        start: node.start,
        end: node.end,
        body,
      });
    }
  });
  let code = terser.parse(source, parseOpts).transform(getTitle);
  if (title == null) {
    throw new Error('No title defined');
  }
  // Minify.
  ({ code } = terser.minify(code, {
    compress: true,
    mangle: {
      toplevel: true,
    },
  }));
  // Strip top-level variable declarations.
  // Any "let x = y;"" is replaced with "x = y;".
  // Any "let x;" is deleted.
  const stripvar = new terser.TreeTransformer(function before(node) {
    if (node instanceof terser.AST_Toplevel) {
      const body = [];
      for (const node2 of node.body) {
        if (node2 instanceof terser.AST_Definitions) {
          for (const def of node2.definitions) {
            const { name, value } = def;
            if (value != null) {
              if (!(name instanceof terser.AST_SymbolLet)) {
                throw new Error('expected SymbolLet');
              }
              body.push(
                new terser.AST_SimpleStatement({
                  start: def.start,
                  end: def.end,
                  body: new terser.AST_Assign({
                    start: def.start,
                    end: def.end,
                    left: new terser.AST_SymbolRef({
                      start: name.start,
                      end: name.end,
                      name: name.name,
                    }),
                    right: value,
                    operator: '=',
                  }),
                }),
              );
            }
          }
        } else {
          body.push(node2);
        }
      }
      node = new terser.AST_Toplevel(node);
      node.body = body;
      return node;
    }
  }, null);
  code = terser
    .parse(code, { ecma: 2018 })
    .transform(stripvar)
    .print_to_string();
  // Remove trailing semicolon from output.
  if (code.endsWith(';')) {
    code = code.substring(0, code.length - 1);
  }
  // Run RegPack and pick smallest output.
  let best = null;
  for (const packed of runPacker(code, {})) {
    const buf = Buffer.from(packed.compressed, 'utf8');
    if (best == null || buf.length < best.buf.length) {
      best = { buf, ...packed };
    }
  }
  return { title, ...best };
}

function printStats(result) {
  const { source } = result;
  const size = source.length;
  process.stderr.write(`Size: ${size} bytes\n`);
  if (size > sizeLimit) {
    const frac = (size - sizeLimit) / sizeLimit;
    process.stderr.write(
      chalk.redBright('Over limit.') +
        ` Over by: ${(100 * frac).toFixed(1)}%\n`,
    );
  } else {
    const frac = (sizeLimit - size) / sizeLimit;
    process.stderr.write(
      chalk.greenBright('Under limit.') +
        ` Space remaining: ${(100 * frac).toFixed(1)}%\n`,
    );
  }
}

async function build() {
  const [source, shim] = await Promise.all([
    readFile(path('src.js'), 'utf8'),
    readFile(path('shim.html'), 'utf8'),
  ]);
  const { title, uncompressed, compressed, buf } = compressSource(source);
  const html = buildHTML(compressed, shim, title);
  await Promise.all([
    writeFile(path('build', 'uncompressed.js'), uncompressed, 'utf8'),
    writeFile(path('build', 'demo.js'), buf),
    writeFile(path('build', 'demo.html'), html, 'utf8'),
  ]);
  return {
    source: buf,
    html,
  };
}

async function watch(callback) {
  let markDirty = null;
  chokidar.watch([path('src.js'), path('shim.html')]).on('all', () => {
    if (markDirty != null) {
      setTimeout(markDirty, 100);
      markDirty = null;
    }
  });
  while (true) {
    await new Promise((r) => {
      markDirty = r;
    });
    try {
      callback(await build(), null);
    } catch (e) {
      callback(null, e);
    }
  }
}

async function buildCommand(args) {
  const { _, quiet, printSize } = yargs
    .options({
      'quiet': {
        type: 'boolean',
        desc: 'Suppress output other than warnings and errors',
      },
      'print-size': {
        type: 'boolean',
        desc: 'Print JavaScript size to stdout',
      },
    })
    .strict()
    .parse(args);
  if (_.length != 0) {
    die(`Unexpected argument: ${JSON.stringify(_[0])}`);
  }
  const result = await build();
  if (printSize) {
    process.stdout.write(`${result.source.length}\n`);
  }
  if (!quiet) {
    printStats(await build());
  }
}

function watchCommand() {
  return watch((result, e) => {
    if (e != null) {
      console.error(e);
    } else {
      printStats(result);
    }
  });
}

function equalObj(x, y) {
  for (const k in x) {
    if (!(k in y) || x[k] !== y[k]) {
      return false;
    }
  }
  for (const k in y) {
    if (!(k in x)) {
      return false;
    }
  }
  return true;
}

async function serveCommand(args) {
  const { _, host, port } = yargs
    .options({
      'port': { type: 'number', default: 7000, desc: 'Serve on this port' },
      'host': {
        type: 'string',
        default: 'localhost',
        desc: 'Serve on this host',
      },
    })
    .strict()
    .parse(args);
  if (_.length != 0) {
    die(`Unexpected argument: ${JSON.stringify(_[0])}`);
  }
  const app = express();
  function staticFile(url, relPath) {
    const fullPath = path(relPath);
    app.get(url, function handler(req, res) {
      res.setHeader('Cache-Control', 'no-cache');
      send(req, fullPath, {
        cacheControl: false,
      }).pipe(res);
    });
  }
  staticFile('/', 'frame.html');
  staticFile('/reload.js', 'reload.js');
  staticFile('/style.css', 'style.css');
  app.get('/demo.html', function (req, res) {
    res.setHeader('Cache-Control', 'no-cache');
    const data = html;
    if (data == null) {
      res.status(500).send('<h1>Not ready</h1>');
    } else {
      res.status(200).send(data);
    }
  });
  let status = { state: 'dirty' };
  let html = null;
  function setStatus(newStatus) {
    if (equalObj(status, newStatus)) {
      return;
    }
    status = newStatus;
    for (const ws of sockets) {
      ws.send(JSON.stringify(['status', newStatus]));
    }
  }
  function setHTML(newHTML) {
    if (html === newHTML) {
      return;
    }
    html = newHTML;
    for (const ws of sockets) {
      ws.send(JSON.stringify(['changed']));
    }
  }
  const server = http.createServer(app);
  const sockets = [];
  function removeSocket(ws) {
    const index = sockets.find((e) => ws === e);
    if (index !== -1) {
      sockets.splice(index, 1);
    }
  }
  function handleWebSocket(ws) {
    sockets.push(ws);
    ws.on('close', () => removeSocket(ws));
    ws.send(JSON.stringify(['status', status]));
  }
  const wss = new WebSocket.Server({ server });
  wss.on('connection', handleWebSocket);
  await new Promise((resolve) => {
    server.listen(port, host, () => {
      process.stderr.write(`Listening on http://${host}:${port}/\n`);
      resolve();
    });
  });
  await watch((result, err) => {
    if (err != null) {
      console.error(err);
      setStatus({ state: 'error', message: err.message });
    } else {
      const { source, html } = result;
      setStatus({ state: 'ok', size: source.length, sizeLimit });
      setHTML(html);
    }
  });
}

function die(msg) {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
}

function usage() {
  process.stdout.write('Usage: node build.mjs {build|serve} [option...]\n');
}

const commands = new Map([
  ['build', buildCommand],
  ['watch', watchCommand],
  ['serve', serveCommand],
]);

async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.length == 0) {
      usage();
      return;
    }
    const [cmdName, ...cmdArgs] = args;
    const cmdFunc = commands.get(cmdName);
    if (cmdFunc == null) {
      die(`Unknown command: ${JSON.stringify(cmdName)}`);
    }
    await mkdirExistOk(path('build'));
    await cmdFunc(cmdArgs);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
