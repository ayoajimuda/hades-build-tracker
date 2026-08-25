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
      iconsrc: `/img/Hammers/${icon}`,
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

export function emit(items, weaponIds) {
  const meta = weaponIds.map((id) => ({
    id,
    name: WEAPON_NAMES[id] ?? id,
    aspects: [...new Set(items.filter((h) => h.weapon === id)
      .flatMap((h) => [h.aspectExclusive, ...(h.aspectIncompatible ?? [])])
      .filter(Boolean))].sort(),
  }));

  const clean_ = (h) => ({
    id: h.id, title: h.title, kind: h.kind, weapon: h.weapon, affects: h.affects,
    text: h.text, excludes: h.excludes, softConflicts: h.softConflicts,
    aspectExclusive: h.aspectExclusive ?? undefined,
    aspectIncompatible: h.aspectIncompatible.length ? h.aspectIncompatible : undefined,
    notes: h.notes.length ? h.notes : undefined,
    iconsrc: h.iconsrc,
  });

  const grouped = meta.map((w) =>
    `  // ${w.name}\n` +
    emitModule({ header: '', name: '_', items: items.filter((h) => h.weapon === w.id).map(clean_) })
      .replace(/^\n\nexport const _ = \[\n/, '').replace(/,\n\];\n$/, ',')
  ).join('\n\n');

  return `// Daedalus Hammer upgrades — generated from the six weapon upgrade tables.
// \`excludes\` is a hard block (both sides agree). \`softConflicts\` is one-sided:
// legal, but the pair interacts badly. Exclusions never cross weapons.

export const WEAPONS = [
${meta.map((w) => `  { id: '${w.id}', name: ${JSON.stringify(w.name)}, aspects: [${w.aspects.map((a) => JSON.stringify(a)).join(', ')}] },`).join('\n')}
];

export const hammers = [
${grouped}
];

export const hammersById = new Map(hammers.map((h) => [h.id, h]));

/** Upgrades grouped by weapon id. */
export const hammersByWeapon = Object.fromEntries(
  WEAPONS.map((w) => [w.id, hammers.filter((h) => h.weapon === w.id)])
);

/** Upgrades offered for a weapon, given the equipped aspect (null = base). */
export function hammersFor(weapon, aspect = null) {
  return hammers.filter((h) => {
    if (h.weapon !== weapon) return false;
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
`;
}
