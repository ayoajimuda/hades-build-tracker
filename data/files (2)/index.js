// Daedalus Hammer upgrades, one module per weapon.
//
//   import { hammersFor } from '@/data/hammers';
//   import { railHammers } from '@/data/hammers/rail';   // single weapon
//
// `excludes` is a hard block (both upgrades state it). `softConflicts` is
// one-sided: legal, but the pair interacts badly. Exclusions never cross weapons.

import { railHammers } from './rail.js';
import { bowHammers } from './bow.js';
import { shieldHammers } from './shield.js';
import { spearHammers } from './spear.js';
import { bladeHammers } from './blade.js';
import { fistsHammers } from './fists.js';

export { railHammers } from './rail.js';
export { bowHammers } from './bow.js';
export { shieldHammers } from './shield.js';
export { spearHammers } from './spear.js';
export { bladeHammers } from './blade.js';
export { fistsHammers } from './fists.js';

export const WEAPONS = [
  { id: 'rail', name: "Adamant Rail", aspects: ["Lucifer"] },
  { id: 'bow', name: "Heart-Seeking Bow", aspects: ["Chiron", "Rama"] },
  { id: 'shield', name: "Shield of Chaos", aspects: ["Beowulf", "Chaos", "Zeus"] },
  { id: 'spear', name: "Eternal Spear", aspects: ["Achilles", "Guan Yu", "Hades"] },
  { id: 'blade', name: "Stygian Blade", aspects: ["Arthur"] },
  { id: 'fists', name: "Twin Fists", aspects: ["Demeter", "Gilgamesh", "Talos"] },
];

/** Upgrades grouped by weapon id. */
export const hammersByWeapon = {
  rail: railHammers,
  bow: bowHammers,
  shield: shieldHammers,
  spear: spearHammers,
  blade: bladeHammers,
  fists: fistsHammers,
};

/** Every upgrade across all weapons. */
export const hammers = [railHammers, bowHammers, shieldHammers, spearHammers, bladeHammers, fistsHammers].flat();

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
    .map((c) => `${h.title} interacts poorly with ${hammersById.get(c).title}`);
}
