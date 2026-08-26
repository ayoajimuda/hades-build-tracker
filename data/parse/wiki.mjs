// Shared helpers for parsing Hades wiki markup.
// Every parser in this folder imports from here.

/** {{Heart}} and friends -> readable words. */
export const TEMPLATES = {
  Heart: 'Health',
  HealthUp: 'Max Health',
  Healing: 'Health',
  Ammo: 'Ammo',
  Obol: 'Obols',
  Gemstones: 'Gemstones',
  Darkness: 'Darkness',
};

/** Colour/rarity templates whose inner label is the value we want. */
const LABEL_TEMPLATES = 'Green|Red|Rare|Epic|Heroic|Legendary|Common';

/**
 * Strip wiki markup down to plain text.
 * Handles: colour templates (incl. numbered params like {{Green|1=5%}}),
 * value templates, piped and bare links, bold/italic, <br> and the </br> typo.
 */
export function clean(s) {
  if (!s) return '';
  return String(s)
    .replace(new RegExp(`\\{\\{(?:${LABEL_TEMPLATES})\\s*\\|\\s*(?:\\d+=)?\\s*([^}]*?)\\s*\\}\\}`, 'gi'), '$1')
    .replace(/\{\{(\w+)\}\}/g, (_, t) => TEMPLATES[t] ?? TEMPLATES[cap(t)] ?? t)
    .replace(/<nowiki\s*\/?>/gi, '')
    .replace(/\[\[File:([^|\]]+)[^\]]*\]\]/g, '')
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<\/?(?:br|sub|big)\s*\/?>/gi, ' ')
    .replace(/'''(.+?)'''/g, '$1')
    .replace(/''(.+?)''/g, '$1')
    .replace(/'''/g, '')
    .replace(/\u26a0\ufe0f/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;%])/g, '$1')
    .replace(/(\d)\s*-\s*(\d)/g, '$1\u2013$2')
    .trim();
}

const cap = (t) => t[0].toUpperCase() + t.slice(1);

/** First [[File:...]] name in a chunk, or null. */
export function iconOf(chunk) {
  const m = String(chunk).match(/\[\[File:([^|\]]+)/);
  return m ? m[1].trim() : null;
}

/** Split a wiki table body into row chunks, tolerating a leading "|-". */
export function rowsOf(src) {
  return String(src)
    .replace(/^\s*\|-\s*\n/, '')
    .split(/\n\|-\s*\n/)
    .map((r) => r.replace(/\n\|\}[\s\S]*$/, ''))
    .filter((r) => r.trim());
}

/**
 * Split a row into cells. Cells start with "|" at line-start; continuation
 * lines belong to the previous cell. Leading cell attributes are stripped.
 */
export function cellsOf(row) {
  const cells = [];
  for (const line of String(row).split('\n')) {
    if (!line.trim()) continue;
    if (/^\s*\|/.test(line)) {
      cells.push([line.replace(/^\s*\|\s*(?:[\w-]+="[^"]*"\s*)+\|/, '|').replace(/^\s*\|/, '')]);
    } else if (cells.length) {
      cells[cells.length - 1].push(line);
    }
  }
  return cells.map((c) => c.join('\n'));
}

/** Bullet lines ("* ...") within a chunk, cleaned. */
export function bulletsOf(chunk) {
  return String(chunk ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('*'))
    .map((l) => clean(l.replace(/^\*+/, '')))
    .filter(Boolean);
}

/** Split a comma / "or" / "and" separated list of names. */
export function splitList(s) {
  return clean(s)
    .split(/\s*(?:,|\bor\b|\band\b|\/)\s*/i)
    .map((x) => x.replace(/^the\s+/i, '').replace(/[.,]$/, '').trim())
    .filter(Boolean);
}

/** Read the value of a "| key = value" field from a template block. */
export function fieldOf(block, key) {
  const m = String(block).match(
    new RegExp(`^\\|\\s*${key}\\s*=\\s*([^]*?)(?=\\n\\||\\n\\}\\})`, 'm')
  );
  return m ? m[1].trim() : null;
}

/** Serialise an object to readable JS source. */
export function toSource(obj, indent = '  ') {
  const inner = indent + '  ';
  const parts = Object.entries(obj)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${inner}${k}: ${valueSource(v, inner)}`);
  return `${indent}{\n${parts.join(',\n')},\n${indent}}`;
}

function valueSource(v, indent) {
  if (v === null) return 'null';
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    if (v.every((x) => typeof x === 'string' && x.length < 30)) {
      return `[${v.map((x) => JSON.stringify(x)).join(', ')}]`;
    }
    const inner = indent + '  ';
    return `[\n${v.map((x) => inner + valueSource(x, inner)).join(',\n')},\n${indent}]`;
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return JSON.stringify(v);
}

/** Standard file header + named export of an array. */
export function emitModule({ header, name, items, extra = '' }) {
  return (
    `${header}\n\nexport const ${name} = [\n` +
    items.map((i) => toSource(i)).join(',\n') +
    `,\n];\n${extra}`
  );
}
