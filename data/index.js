// App entry point for game data.
//
//   import { boons, hammersFor, availableDuos, byId } from '@/data';
//
// Everything comes through parse/, which normalises the raw files in js/ and
// reports anything malformed. In development, problems are logged once.

import { load } from './parse/index.mjs';

const { data, problems } = load();

if (process.env.NODE_ENV !== 'production' && problems.length) {
  console.warn(`[data] ${problems.length} problem(s):\n` + problems.map((p) => '  ' + p).join('\n'));
}

export const {
  boons, hammers, aspects, duos, curses,
  keepsakes, companions, keepsakeSlot, wares, builds,
} = data;

export const dataProblems = problems;

export const WEAPONS = [
  { id: 'rail',   name: 'Adamant Rail' },
  { id: 'bow',    name: 'Heart-Seeking Bow' },
  { id: 'shield', name: 'Shield of Chaos' },
  { id: 'spear',  name: 'Eternal Spear' },
  { id: 'blade',  name: 'Stygian Blade' },
  { id: 'fists',  name: 'Twin Fists' },
];

export const hammersByWeapon = Object.fromEntries(
  WEAPONS.map((w) => [w.id, hammers.filter((h) => h.weapon === w.id)])
);

export const aspectsByWeapon = Object.fromEntries(
  WEAPONS.map((w) => [w.id, aspects.filter((a) => a.weaponId === w.id)])
);

export const waresByPrice = wares
  .filter((w) => w.price?.obols != null)
  .sort((a, b) => a.price.obols - b.price.obols);

/** Look up any record by id, across every collection. */
export const byId = (id) => data.byId.get(id) ?? null;
export const byIds = (ids) => ids.map(byId).filter(Boolean);

export function byIdStrict(id) {
  const hit = data.byId.get(id) ?? null;
  if (!hit && process.env.NODE_ENV !== 'production') {
    console.warn(`[data] unknown id "${id}" — stale saved build?`);
  }
  return hit;
}

/** Everything that can fill a core slot. */
export function forSlot(slot) {
  return slot === 'keepsake' ? keepsakeSlot : boons.filter((b) => b.slot === slot);
}

/** Upgrades offered for a weapon, given the equipped aspect's short name. */
export function hammersFor(weaponId, aspectShort = null) {
  return (hammersByWeapon[weaponId] ?? []).filter((h) => {
    if (h.aspectExclusive) return h.aspectExclusive === aspectShort;
    if (h.aspectIncompatible?.includes(aspectShort)) return false;
    return true;
  });
}

/** Whether a hammer can join an already-chosen set. */
export function canCombine(id, chosenIds = []) {
  const h = byId(id);
  if (!h || h.kind !== 'hammer') return false;
  if (chosenIds.includes(id)) return false;
  return !chosenIds.some((c) => {
    const other = byId(c);
    return h.excludes?.includes(c) || other?.excludes?.includes(id);
  });
}

/** Legal-but-awkward hammer pairings. */
export function conflictWarnings(id, chosenIds) {
  const h = byId(id);
  if (!h?.softConflicts) return [];
  return chosenIds
    .filter((c) => h.softConflicts.includes(c) || byId(c)?.softConflicts?.includes(id))
    .map((c) => `${h.title} interacts poorly with ${byId(c).title}`);
}

/** Duos unlocked by a set of owned boon ids. */
export function availableDuos(ownedIds) {
  const owned = new Set(ownedIds);
  return duos.filter((d) => d.requires.every((r) => r.any.some((x) => owned.has(x))));
}

/** Duos one boon short, and what would complete them. */
export function nearMissDuos(ownedIds) {
  const owned = new Set(ownedIds);
  return duos
    .map((d) => {
      const missing = d.requires.filter((r) => !r.any.some((x) => owned.has(x)));
      return missing.length === 1
        ? { duo: d, god: missing[0].god, needsOneOf: missing[0].any }
        : null;
    })
    .filter(Boolean);
}

/** Legendaries whose prerequisites the owned set satisfies. */
export function availableLegendaries(ownedIds) {
  const owned = new Set(ownedIds);
  return boons.filter(
    (b) => b.legendary && b.prerequisites?.length &&
      b.prerequisites.every((g) => g.any.filter((x) => owned.has(x)).length >= g.count)
  );
}

/** Active curses that punish an action the build actually uses. */
export function curseConflicts(slots, activeCurseIds) {
  const active = new Set(activeCurseIds);
  return curses
    .filter((c) => c.trigger && active.has(c.id) && slots[c.trigger])
    .map((c) => `${c.title} punishes your ${c.trigger}`);
}

if (typeof window !== 'undefined') {
  window.__data = { byId, boons };
}