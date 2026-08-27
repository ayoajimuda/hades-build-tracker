// Duo boons. Requirement ids are resolved against the boon list.
import { duo_Boons } from '../js/duo_boons.js';
import { checkCommon, checkIcon, checkText, checkUnique, result } from './_shared.mjs';

export function parseDuos(boons = []) {
  const problems = [];
  const items = [];
  const boonIds = new Set(boons.map((b) => b.id));

  for (const raw of duo_Boons) {
    if (!checkCommon(raw, 'duo', problems)) continue;
    checkIcon(raw, 'duo', problems);
    checkText(raw, 'duo', problems);

    if (!raw.requires?.length) problems.push(`duo "${raw.title}": no requirements`);
    for (const r of raw.requires ?? []) {
      if (!r.any?.length) { problems.push(`duo "${raw.title}": empty group for ${r.god}`); continue; }
      if (boonIds.size)
        for (const id of r.any)
          if (!boonIds.has(id)) problems.push(`duo "${raw.title}": unknown boon "${id}"`);
    }

    const gods = raw.requires?.map((r) => r.god) ?? [];
    if (raw.gods && raw.gods.join() !== gods.join())
      problems.push(`duo "${raw.title}": gods ${raw.gods.join('+')} but requires ${gods.join('+')}`);

    items.push({ ...raw, kind: 'duo', gods, stats: raw.stats ?? [], notes: raw.notes ?? [] });
  }

  checkUnique(items, 'duos', problems);
  return result(items, problems);
}
