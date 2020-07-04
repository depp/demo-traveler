import { mkdir, readFile, stat, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Title of the demo.
const title = 'Traveler';

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

function buildHTML(source, shim) {
  return evalTemplate(
    shim,
    new Map([
      ['title_html', escapeTextHTML(title)],
      ['title_js', JSON.stringify(title)],
      ['code', source],
    ]),
  );
}

function compressSource(source) {
  return source.trim();
}

async function build() {
  const [source, shim] = await Promise.all([
    readFile(path('src.js'), 'utf8'),
    readFile(path('shim.html'), 'utf8'),
  ]);
  const compressed = compressSource(source);
  const demoData = Buffer.from(compressed, 'utf8');
  const html = buildHTML(compressed, shim);
  await Promise.all([
    writeFile(path('build', 'demo.js'), demoData),
    writeFile(path('build', 'demo.html'), html, 'utf8'),
  ]);
}

async function main() {
  try {
    const buildDir = path('build');
    await mkdirExistOk(buildDir);
    await build();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
