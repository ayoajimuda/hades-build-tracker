// 5. Duo boons — listed once per contributing god, so deduplicated by title.
import { clean, iconOf, rowsOf, cellsOf, splitList, emitModule } from '../lib/wiki.mjs';

const GOD_CODES = {
  Aphrodite: 'APH', Ares: 'ARE', Artemis: 'ART', Athena: 'ATH', Demeter: 'DEM',
  Dionysus: 'DIO', Hermes: 'HER', Poseidon: 'POS', Zeus: 'ZEU', Chaos: 'CHA',
};

/** Wiki misspellings of boon names seen in the duo tables. */
const ALIASES = {
  "poseidon's' aid": "poseidon's aid",
  "dionysus's aid": "dionysus' aid",
};

export function parseDuoBoons(src, { boons, prefix = 'DUO' } = {}) {
  const byTitle = new Map(boons.map((b) => [b.title.toLowerCase(), b]));
  const resolve = (name) => {
    let key = name.toLowerCase().replace(/[.,]$/, '').trim();
    return byTitle.get(ALIASES[key] ?? key) ?? null;
  };

  const duos = [];
  const problems = [];
  let n = 0;

  for (const table of src.split('{|').slice(1)) {
    for (const row of rowsOf(table.split('\n|}')[0]).slice(1)) {
      const cells = cellsOf(row);
      if (cells.length < 3) continue;
      const [nameCell, effectCell, reqCell, noteCell] = cells;

      const icon = iconOf(nameCell);
      const title = clean(nameCell);
      if (!icon || !title) continue;
      if (duos.some((d) => d.title === title)) continue; // second listing

      const effectLines = effectCell.split('\n');
      const text = clean(effectLines[0]);
      const stats = effectLines.filter((l) => l.trim().startsWith('*'))
        .map((l) => clean(l.replace(/^\s*\*/, ''))).filter(Boolean);

      const requires = [];
      const extras = [];
      for (const line of reqCell.split('\n')) {
        const t = line.trim();
        if (!t.startsWith('*')) continue;
        const m = t.match(/^\*\s*'''\[\[(\w+)\]\]'''\s*:\s*([^]*)$/);
        if (!m) { extras.push(clean(t.replace(/^\*/, ''))); continue; }
        const any = [];
        for (const nm of splitList(m[2])) {
          const hit = resolve(nm);
          if (hit) any.push(hit.id);
          else problems.push(`${title}: unknown requirement "${nm}"`);
        }
        requires.push({ god: GOD_CODES[m[1]], any });
      }

      const notes = (noteCell ?? '').split('\n')
        .filter((l) => l.trim().startsWith('*'))
        .map((l) => clean(l.replace(/^\s*\*/, ''))).filter(Boolean);

      duos.push({
        id: `${prefix}${String(++n).padStart(2, '0')}`,
        title,
        kind: 'duo',
        gods: requires.map((r) => r.god),
        slot: null,
        text,
        stats: stats.length ? stats : undefined,
        requires,
        iconsrc: `/img/Boons/${icon}`,
        notes: [...extras, ...notes].length ? [...extras, ...notes] : undefined,
      });
    }
  }
  return { items: duos, problems };
}

export const emit = (items) => emitModule({
  header: '// Duo boons — generated from the wiki duo tables.\n' +
          '// Needs one qualifying boon from EACH god listed in `requires`.',
  name: 'duoBoons',
  items,
  extra: '\nexport const duosById = new Map(duoBoons.map((d) => [d.id, d]));\n\n' +
         '/** Duos unlocked by a set of owned boon ids. */\n' +
         'export function availableDuos(ownedIds) {\n' +
         '  const owned = new Set(ownedIds);\n' +
         '  return duoBoons.filter((d) =>\n' +
         '    d.requires.every((r) => r.any.some((id) => owned.has(id)))\n' +
         '  );\n}\n',
});
