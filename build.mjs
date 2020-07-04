import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const title = 'Traveler';

const rootDir = dirname(fileURLToPath(import.meta.url));
function path(name) {
  return join(rootDir, name);
}

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

async function main() {
  try {
    const [source, shim] = await Promise.all([
      readFile(path('src.js'), 'utf8'),
      readFile(path('shim.html'), 'utf8'),
    ]);
    const text = evalTemplate(
      shim,
      new Map([
        ['title_html', escapeTextHTML(title)],
        ['title_js', JSON.stringify(title)],
        ['code', source],
      ]),
    );
    process.stdout.write(text);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
