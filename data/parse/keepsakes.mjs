// Keepsakes and companions — both fill the keepsake slot.
import { keepsakes as rawKeepsakes } from '../js/keepsakes.js';
import { companions as rawCompanions } from '../js/companions.js';
import { checkCommon, checkIcon, checkText, checkUnique, result } from './_shared.mjs';

export function parseKeepsakes() {
  const problems = [];
  const items = [];

  for (const raw of rawKeepsakes) {
    if (!checkCommon(raw, 'keepsake', problems)) continue;
    checkIcon(raw, 'keepsake', problems);
    checkText(raw, 'keepsake', problems);

    if (raw.ranks && raw.ranks.length !== 3)
      problems.push(`keepsake "${raw.title}": ${raw.ranks.length} ranks, expected 3`);
    if (!raw.ranks && !raw.olympian)
      problems.push(`keepsake "${raw.title}": no ranks and not flagged olympian`);

    items.push({ ...raw, kind: 'keepsake', slot: 'keepsake' });
  }

  for (const raw of rawCompanions) {
    if (!checkCommon(raw, 'companion', problems)) continue;
    checkIcon(raw, 'companion', problems);
    checkText(raw, 'companion', problems);
    items.push({ ...raw, kind: 'companion', slot: 'keepsake' });
  }

  checkUnique(items, 'keepsake slot', problems);
  return result(items, problems);
}
