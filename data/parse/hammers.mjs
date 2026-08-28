// Daedalus Hammer upgrades, one source file per weapon.
import { exagryph_hammers } from '../js/exagryph_upgrades.js';
import { coronacht_hammers } from '../js/coronacht_upgrades.js';
import { aegis_hammers } from '../js/aegis_upgrades.js';
import { varatha_hammers } from '../js/varatha_upgrades.js';
import { stygian_hammers } from '../js/stygian_upgrades.js';   // NOTE: exported name is missing a 'y'
import { malphon_hammers } from '../js/malphon_upgrades.js';
import { checkCommon, checkIcon, checkText, checkUnique, result } from './_shared.mjs';

export const WEAPON_FILES = [
  { weapon: 'rail',   list: exagryph_hammers },
  { weapon: 'bow',    list: coronacht_hammers },
  { weapon: 'shield', list: aegis_hammers },
  { weapon: 'spear',  list: varatha_hammers },
  { weapon: 'blade',  list: stygian_hammers },
  { weapon: 'fists',  list: malphon_hammers },
];

export function parseHammers() {
  const problems = [];
  const items = [];

  for (const { weapon, list } of WEAPON_FILES) {
    if (!Array.isArray(list)) { problems.push(`hammers: ${weapon} list is not an array`); continue; }
    for (const raw of list) {
      if (!checkCommon(raw, 'hammer', problems)) continue;
      checkIcon(raw, 'hammer', problems);
      checkText(raw, 'hammer', problems);
      if (raw.weapon !== weapon)
        problems.push(`hammer "${raw.title}": weapon "${raw.weapon}" but lives in the ${weapon} file`);
      items.push({
        ...raw,
        kind: 'hammer',
        weaponId: weapon,
        excludes: raw.excludes ?? [],
        softConflicts: raw.softConflicts ?? [],
        aspectIncompatible: raw.aspectIncompatible ?? [],
        notes: raw.notes ?? [],
      });
    }
  }

  checkUnique(items, 'hammers', problems);

  // exclusions must resolve, stay in-weapon, and be reciprocated
  const byId = new Map(items.map((h) => [h.id, h]));
  for (const h of items) {
    for (const x of h.excludes) {
      const other = byId.get(x);
      if (!other) { problems.push(`hammer "${h.title}": unknown exclusion "${x}"`); continue; }
      if (other.weapon !== h.weapon)
        problems.push(`hammer "${h.title}": excludes cross-weapon "${other.title}"`);
      if (!other.excludes.includes(h.id))
        problems.push(`hammer "${h.title}": excludes "${other.title}" one-sidedly — should be a softConflict`);
    }
  }

  return result(items, problems);
}
