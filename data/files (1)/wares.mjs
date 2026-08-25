// 7. Wares — Charon's shop consumables.
import { clean, iconOf, rowsOf, cellsOf, emitModule } from '../lib/wiki.mjs';

/** "15 Obols" -> { obols: 15 }. Blood prices and formulas keep their text. */
function parsePrice(raw) {
  const text = clean(raw);
  const flat = text.match(/^(\d+)\s*Obols$/i);
  if (flat) return { obols: Number(flat[1]), text };
  const blood = text.match(/^([\d\u2013]+)\s*Health$/i);
  if (blood) return { health: blood[1], text };
  return { variable: true, text };
}

/** "6 Encounters" -> { amount: 6, unit: 'encounters' } */
function parseDuration(raw) {
  const text = clean(raw);
  const low = text.toLowerCase();
  if (low === 'instant') return { unit: 'instant', text };
  if (low.startsWith('until')) return { unit: 'until', text };
  const m = text.match(/^(\d+)\s*(Encounters?|Chambers?)/i);
  if (m) return { amount: Number(m[1]), unit: m[2].toLowerCase().replace(/s$/, '') + 's', text };
  return { unit: 'unknown', text };
}

export function parseWares(src, { prefix = 'WAR' } = {}) {
  const wares = [];
  const problems = [];
  const notices = [];
  let n = 0;

  for (const row of rowsOf(src)) {
    const cells = cellsOf(row);
    if (cells.length < 4) continue;
    const [nameCell, descCell, priceCell, durCell] = cells;

    const icon = iconOf(nameCell);
    const title = clean(nameCell);
    if (!icon || !title) continue;

    let text = clean(descCell);
    const incomplete = /\(WIP\)/i.test(text);
    if (incomplete) text = text.replace(/\s*\(WIP\)\s*/i, '').trim();

    const duration = parseDuration(durCell);
    if (duration.unit === 'unknown') problems.push(`${title}: unparsed duration "${duration.text}"`);

    wares.push({
      id: `${prefix}${String(++n).padStart(2, '0')}`,
      title,
      kind: 'ware',
      text,
      price: parsePrice(priceCell),
      duration,
      incomplete: incomplete || undefined,
      iconsrc: `/img/Wares/${icon}`,
    });
  }

  // shared icon files are a wiki bug worth surfacing
  const seen = new Map();
  for (const w of wares) {
    const key = w.iconsrc.toLowerCase().replace(/[_ ]/g, '');
    if (seen.has(key)) notices.push(`${w.title} shares an icon with ${seen.get(key)}`);
    else seen.set(key, w.title);
  }

  return { items: wares, problems, notices };
}

export const emit = (items) => emitModule({
  header: "// Wares — generated from the wiki Well of Charon table.\n" +
          '// Consumables bought with Obols (Price of Midas costs Health instead).',
  name: 'wares',
  items,
  extra: '\nexport const waresById = new Map(wares.map((w) => [w.id, w]));\n\n' +
         '/** Wares with a flat Obol price, cheapest first. */\n' +
         'export const waresByPrice = wares\n' +
         '  .filter((w) => w.price.obols != null)\n' +
         '  .sort((a, b) => a.price.obols - b.price.obols);\n',
});
