// God boons + Chaos boons, with the legendary patch merged.
import { boons as godBoons } from '../js/boons.js';
import { chaos_boons } from '../js/chaos_boons.js';
import { legendaryPatch } from '../js/legendary_boons.js';
import { checkCommon, checkIcon, checkText, checkUnique, result } from './_shared.mjs';

export const RARITIES = ['common', 'rare', 'epic', 'heroic', 'legendary'];

export function parseBoons() {
  const problems = [];
  const items = [];

  for (const raw of [...godBoons, ...chaos_boons]) {
    if (!checkCommon(raw, 'boon', problems)) continue;
    checkIcon(raw, 'boon', problems);
    checkText(raw, 'boon', problems);

    const patch = legendaryPatch[raw.id];
    if (patch) {
      for (const g of patch.prerequisites ?? [])
        if (!g.any?.length) problems.push(`boon "${raw.title}": empty prerequisite group`);
    }

    // rarities drive the cycle; fall back to the full ladder when absent
    const rarities = raw.rarities ?? RARITIES;
    if (raw.effect && raw.effect.length !== rarities.length)
      problems.push(`boon "${raw.title}": ${raw.effect.length} effects for ${rarities.length} rarities`);

    items.push({
      ...raw,
      ...patch,
      kind: 'boon',
      rarities,
      legendary: Boolean(patch?.legendary || raw.legendary),
    });
  }

  checkUnique(items, 'boons', problems);
  return result(items, problems);
}
