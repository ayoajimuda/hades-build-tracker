// 6. Legendary boons — a PATCH keyed by existing boon id, not new records.
import { clean, iconOf, rowsOf, cellsOf, splitList, bulletsOf } from '../lib/wiki.mjs';

const GOD_CODES = {
  Aphrodite: 'APH', Ares: 'ARE', Artemis: 'ART', Athena: 'ATH', Demeter: 'DEM',
  Dionysus: 'DIO', Hermes: 'HER', Poseidon: 'POS', Zeus: 'ZEU', Chaos: 'CHA',
};

/** Prerequisites that aren't boons — keepsakes and catch-alls. */
const NON_BOON = /equipped$|^any chaos boon$/i;

/** "Requires 2 of the following" -> { count, mode } */
function parseHeader(line) {
  const t = clean(line).toLowerCase();
  const count = /\b(two|2)\b/.test(t) ? 2 : 1;
  const mode = /of each/.test(t) ? 'each' : 'any';
  return { count, mode };
}

export function parseLegendary(src, { boons } = {}) {
  const byTitle = new Map(boons.map((b) => [b.title.toLowerCase(), b]));
  const patches = [];
  const problems = [];

  for (const row of rowsOf(src)) {
    const cells = cellsOf(row);
    if (cells.length < 4) continue;
    const [nameCell, effectCell, godCell, prereqCell, noteCell] = cells;

    const title = clean(nameCell);
    const boon = byTitle.get(title.toLowerCase());
    if (!boon) { problems.push(`not in boon dataset: ${title}`); continue; }

    const lines = prereqCell.split('\n').filter((l) => l.trim());
    const header = lines.find((l) => !l.trim().startsWith('*')) ?? 'Requires:';
    const { count, mode } = parseHeader(header);
    const bullets = lines.filter((l) => l.trim().startsWith('*'));

    const prerequisites = [];
    const items = [];
    const collect = (bullet) => {
      const ids = [];
      for (const nm of splitList(bullet.replace(/^\s*\*/, ''))) {
        if (NON_BOON.test(nm)) { items.push(nm); continue; }
        const hit = byTitle.get(nm.toLowerCase());
        if (hit) ids.push(hit.id);
        else problems.push(`${title}: unknown prerequisite "${nm}"`);
      }
      return ids;
    };

    if (mode === 'each') {
      for (const b of bullets) {
        const any = collect(b);
        if (any.length) prerequisites.push({ count: 1, any });
      }
    } else {
      const any = bullets.flatMap(collect);
      if (any.length) prerequisites.push({ count, any });
    }

    patches.push({
      id: boon.id,
      title,
      god: GOD_CODES[clean(godCell)],
      icon: iconOf(nameCell),
      stats: bulletsOf(effectCell),
      prerequisites,
      prerequisiteItems: items,
      notes: bulletsOf(noteCell),
    });
  }
  return { items: patches, problems };
}

export function emit(patches) {
  const body = patches.map((p) => {
    const parts = ['legendary: true'];
    if (p.stats.length) parts.push(`stats: [${p.stats.map((s) => JSON.stringify(s)).join(', ')}]`);
    parts.push(`prerequisites: [\n${p.prerequisites
      .map((g) => `      { count: ${g.count}, any: [${g.any.map((i) => `'${i}'`).join(', ')}] },`)
      .join('\n')}\n    ]`);
    if (p.prerequisiteItems.length)
      parts.push(`prerequisiteItems: [${p.prerequisiteItems.map((i) => JSON.stringify(i)).join(', ')}]`);
    if (p.notes.length)
      parts.push(`notes: [\n      ${p.notes.map((x) => JSON.stringify(x)).join(',\n      ')},\n    ]`);
    return `  '${p.id}': {  // ${p.title}\n    ${parts.join(',\n    ')},\n  },`;
  }).join('\n');

  return `// Legendary boons — generated from the wiki legendary table.
// These boons ALREADY EXIST in the god/chaos data; this is a patch that adds
// the legendary flag, stat values, and prerequisites.

export const legendaryPatch = {
${body}
};

/** Merge the patch into a boon list, returning a new array. */
export function withLegendary(boons) {
  return boons.map((b) => (legendaryPatch[b.id] ? { ...b, ...legendaryPatch[b.id] } : b));
}

/**
 * Whether owned boons satisfy a legendary's prerequisites.
 * Does not consider prerequisiteItems (keepsakes) — check those separately.
 */
export function meetsPrerequisites(id, ownedIds) {
  const entry = legendaryPatch[id];
  if (!entry) return false;
  const owned = new Set(ownedIds);
  return entry.prerequisites.every(
    (g) => g.any.filter((x) => owned.has(x)).length >= g.count
  );
}
`;
}
