// 4. Hammer upgrades — one wiki table per weapon.
import { clean, iconOf, rowsOf, cellsOf, emitModule } from '../lib/wiki.mjs';

export const WEAPON_NAMES = {
  rail: 'Adamant Rail', bow: 'Heart-Seeking Bow', shield: 'Shield of Chaos',
  spear: 'Eternal Spear', blade: 'Stygian Blade', fists: 'Twin Fists',
};

/**
 * Which ability an upgrade modifies. Order matters: the more specific
 * weapon abilities must be tested before the generic Attack/Special.
 */
function classify(text) {
  const rules = [
    [/Dash-Upper/i, 'dash-upper'],
    [/Dash-Strike/i, 'dash-strike'],
    [/Bull Rush/i, 'bull-rush'],
    [/Spin Attack/i, 'spin-attack'],
    [/\bThrust\b/i, 'thrust'],
    [/\bSpecial\b/, 'special'],
    [/Power Shot|Igneus Eden|Hellfire|\bAttack\b/i, 'attack'],
  ];
  for (const [re, value] of rules) if (re.test(text)) return value;
  return null;
}

export function parseHammers(src, { weapon, prefix }) {
  const out = [];
  const problems = [];
  const notices = [];
  let n = 0;

  for (const row of rowsOf(src)) {
    const cells = cellsOf(row);
    if (cells.length < 2) continue;
    const [nameCell, descCell, noteCell] = cells;

    const icon = iconOf(nameCell);
    const title = clean(nameCell);
    if (!icon || !title) continue;

    const text = clean(descCell);
    const excludeTitles = [];
    const aspectIncompatible = [];
    const notes = [];
    let aspectExclusive = null;

    for (const b of (noteCell ?? '').split('\n')
      .map((l) => l.trim()).filter((l) => l.startsWith('*'))
      .map((l) => clean(l.replace(/^\*+/, ''))).filter(Boolean)) {
      let m;
      // both phrasings, and multi-word aspect names like "Guan Yu"
      if ((m = b.match(/^Aspect of ([\w' ]+?)[\s-]+Exclusive\.?$/i))
        || (m = b.match(/^Exclusive to (?:the )?Aspect of ([\w' ]+?)\.?$/i))) {
        aspectExclusive = m[1].trim();
        continue;
      }
      if ((m = b.match(/^(?:Cannot be combined with|Incompatible with)\s+(.+?)\.?$/i))) {
        for (const raw of m[1].split(/\s*(?:,|\bor\b|\band\b)\s*/i)) {
          const t = raw.replace(/^the\s+/i, '').replace(/[.,]$/, '').trim();
          if (!t) continue;
          const asp = t.match(/^Aspect of ([\w' -]+?)$/i);
          if (asp) aspectIncompatible.push(asp[1]);
          else excludeTitles.push(t);
        }
        continue;
      }
      notes.push(b);
    }

    out.push({
      id: `${prefix}${String(++n).padStart(2, '0')}`,
      title, kind: 'hammer', weapon, affects: classify(text), text,
      excludeTitles, aspectExclusive, aspectIncompatible, notes,
      iconsrc: `/img/Hammers/${icon.replace(/\.(png|jpg|jpeg)$/i, '.webp')}`,
    });
  }

  const byTitle = new Map(out.map((h) => [h.title.toLowerCase(), h]));
  for (const h of out) {
    h.excludes = [];
    for (const t of h.excludeTitles) {
      const hit = byTitle.get(t.toLowerCase());
      if (hit) { h.excludes.push(hit.id); continue; }
      // trailing prose after a comma, e.g. "..., forcing a hit delay"
      if (/\s/.test(t) && /^[a-z]/.test(t)) { h.notes.push(t); continue; }
      problems.push(`${h.title}: unknown exclusion "${t}"`);
    }
  }

  // A hard exclusion must be claimed by BOTH upgrades. One-sided claims become
  // soft conflicts: the pair is legal but interacts badly.
  for (const h of out) h.softConflicts = [];
  for (const h of out) {
    const hard = [];
    for (const id of h.excludes) {
      const other = out.find((x) => x.id === id);
      if (other.excludes.includes(h.id)) hard.push(id);
      else {
        h.softConflicts.push(id);
        notices.push(`soft conflict: ${h.title} + ${other.title} (one-sided)`);
      }
    }
    h.excludes = hard;
  }

  for (const h of out) delete h.excludeTitles;
  return { items: out, problems, notices };
}

const ORDER = ['rail', 'bow', 'shield', 'spear', 'blade', 'fists'];

const publicShape = (h) => ({
  id: h.id, title: h.title, kind: h.kind, weapon: h.weapon, affects: h.affects,
  text: h.text, excludes: h.excludes, softConflicts: h.softConflicts,
  aspectExclusive: h.aspectExclusive ?? undefined,
  aspectIncompatible: h.aspectIncompatible?.length ? h.aspectIncompatible : undefined,
  notes: h.notes.length ? h.notes : undefined,
  iconsrc: h.iconsrc,
});

const exportName = (id) => `${id}Hammers`;

function aspectsOf(items, weapon) {
  return [...new Set(items.filter((h) => h.weapon === weapon)
    .flatMap((h) => [h.aspectExclusive, ...(h.aspectIncompatible ?? [])])
    .filter(Boolean))].sort();
}

/**
 * Emit one module per weapon plus an index.
 * Returns [{ file, source }, ...] — exclusions never cross weapons, so each
 * weapon file is self-contained data and the index holds the shared helpers.
 */
export function emitSplit(items) {
  const present = ORDER.filter((w) => items.some((h) => h.weapon === w));
  const files = [];

  for (const weapon of present) {
    const list = items.filter((h) => h.weapon === weapon).map(publicShape);
    const aspects = aspectsOf(items, weapon);
    files.push({
      file: `${weapon}.js`,
      source: emitModule({
        header:
          `// ${WEAPON_NAMES[weapon]} — Daedalus Hammer upgrades.\n` +
          `// Generated from the wiki; edit the parser, not this file.\n` +
          (aspects.length ? `// Aspects that change the pool: ${aspects.join(', ')}.` : ''),
        name: exportName(weapon),
        items: list,
      }),
    });
  }

  const meta = present.map((w) =>
    `  { id: '${w}', name: ${JSON.stringify(WEAPON_NAMES[w] ?? w)}, aspects: [${aspectsOf(items, w).map((a) => JSON.stringify(a)).join(', ')}] },`
  ).join('\n');

  files.push({
    file: 'index.js',
    source: `// Daedalus Hammer upgrades, one module per weapon.
//
//   import { hammersFor } from '@/data/hammers';
//   import { railHammers } from '@/data/hammers/rail';   // single weapon
//
// \`excludes\` is a hard block (both upgrades state it). \`softConflicts\` is
// one-sided: legal, but the pair interacts badly. Exclusions never cross weapons.

${present.map((w) => `import { ${exportName(w)} } from './${w}.js';`).join('\n')}

${present.map((w) => `export { ${exportName(w)} } from './${w}.js';`).join('\n')}

export const WEAPONS = [
${meta}
];

/** Upgrades grouped by weapon id. */
export const hammersByWeapon = {
${present.map((w) => `  ${w}: ${exportName(w)},`).join('\n')}
};

/** Every upgrade across all weapons. */
export const hammers = [${present.map(exportName).join(', ')}].flat();

export const hammersById = new Map(hammers.map((h) => [h.id, h]));

/** Upgrades offered for a weapon, given the equipped aspect (null = base). */
export function hammersFor(weapon, aspect = null) {
  return (hammersByWeapon[weapon] ?? []).filter((h) => {
    if (h.aspectExclusive) return h.aspectExclusive === aspect;
    if (h.aspectIncompatible?.includes(aspect)) return false;
    return true;
  });
}

/** Whether an upgrade can join an already-chosen set. */
export function canCombine(id, chosenIds) {
  const h = hammersById.get(id);
  if (!h || chosenIds.includes(id)) return false;
  return !chosenIds.some(
    (c) => h.excludes.includes(c) || hammersById.get(c)?.excludes.includes(id)
  );
}

/** Warnings for legal-but-awkward pairings. */
export function conflictWarnings(id, chosenIds) {
  const h = hammersById.get(id);
  if (!h) return [];
  return chosenIds
    .filter((c) => h.softConflicts.includes(c) || hammersById.get(c)?.softConflicts.includes(id))
    .map((c) => \`\${h.title} interacts poorly with \${hammersById.get(c).title}\`);
}
`,
  });

  return files;
}
