import { readFileSync, writeFileSync } from 'node:fs';

const GOD_CODES = {
  Aphrodite: 'APH', Ares: 'ARE', Artemis: 'ART', Athena: 'ATH',
  Demeter: 'DEM', Dionysus: 'DIO', Hermes: 'HER', Poseidon: 'POS',
  Zeus: 'ZEU', Chaos: 'CHA',
};

const SLOTLESS_GODS = new Set(['HER']);

const FORCE_PASSIVE = new Set([
  'Urge to Kill', 'Hydraulic Might', 'Blown Kiss',
  'Glacial Glare', 'Rip Current',
]);

const TEMPLATES = {
  Heart: 'Health', Ammo: 'Ammo', Gemstones: 'Gemstones',
  Darkness: 'Darkness', Obol: 'Obols',
};
const FILE_WORDS = { 'HealthUp.webp': 'Health', 'Ammo.webp': 'Ammo' };

function clean(s) {
  return s
    .replace(/\[\[File:([^|\]]+)[^\]]*\]\]/g, (_, f) => FILE_WORDS[f.trim()] ?? '')
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\{\{(\w+)\}\}/g, (_, t) => TEMPLATES[t] ?? t)
    .replace(/'''(.+?)'''/g, '$1')
    .replace(/''(.+?)''/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,])/g, '$1')
    .trim();
}

function deriveSlot(title, text, god) {
  if (SLOTLESS_GODS.has(god) || FORCE_PASSIVE.has(title)) return null;
  const m = text.match(/^Your (Attack|Special|Cast|Dash|Call)\b/);
  if (!m) return null;
  const hits = text.slice(0, 60).match(/\b(Attack|Special|Cast|Dash|Call)\b/g) ?? [];
  if (new Set(hits).size > 1) return null;
  return m[1].toLowerCase();
}

const src = readFileSync(new URL('./boons.wiki', import.meta.url), 'utf8');

const boons = [];

// one chunk per wiki table
for (const table of src.split('{|').slice(1)) {
  const capt = table.match(/\|\+\s*(\w+) Boons/);
  if (!capt) continue;
  const god = GOD_CODES[capt[1]];
  if (!god) {
    console.warn(`unknown god: ${capt[1]}`);
    continue;
  }

  const body = table.split('|}')[0];
  const rows = body.split(/\n\|-\s*\n/).slice(1); // drop caption/header chunk
  let n = 0;

  for (const row of rows) {
    const lines = row.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());

    const iconLine = lines.find((l) => /^\|\[\[File:/.test(l));
    const titleLine = lines.find((l) => /^'''.+'''/.test(l));
    if (!iconLine || !titleLine) {
      console.warn(`[${god}] skipped row: ${lines[0]?.slice(0, 40)}`);
      continue;
    }

    const iconFile = iconLine.match(/\[\[File:([^|\]]+)/)[1].trim();
    const title = clean(titleLine.match(/'''(.+?)'''/)[1]);

    // effect cell = everything from the first "|" line that isn't the icon
    const start = lines.findIndex((l) => l.startsWith('|') && l !== iconLine);
    if (start === -1) {
      console.warn(`[${god}] no effect cell for ${title}`);
      continue;
    }
    const raw = lines.slice(start).join(' ').replace(/^\|/, '');
    const [main, ...rest] = raw.split(/\s\*\s/);

    const text = clean(main);
    const notes = rest.map(clean).filter(Boolean);

    boons.push({
      id: `${god}${String(++n).padStart(2, '0')}`,
      title,
      text,
      god,
      slot: deriveSlot(title, text, god),
      iconsrc: `/img/Boons/${iconFile}`,
      tags: [god],
      ...(notes.length ? { notes } : {}),
    });
  }
}

writeFileSync(
  new URL('./boons.js', import.meta.url),
  '// Generated from the Hades wiki boon tables. Do not edit by hand.\n\n' +
    'export const boons = [\n' +
    boons.map((b) => '  ' + JSON.stringify(b) + ',').join('\n') +
    '\n];\n\nexport const boonsById = new Map(boons.map((b) => [b.id, b]));\n'
);

console.log(`parsed ${boons.length} boons\n`);
for (const g of new Set(boons.map((b) => b.god))) {
  const rows = boons.filter((b) => b.god === g);
  const slots = rows.filter((b) => b.slot);
  console.log(
    `${g}: ${rows.length} boons, ${slots.length} slotted -> ` +
      slots.map((b) => `${b.slot}=${b.title}`).join(', ')
  );
}
