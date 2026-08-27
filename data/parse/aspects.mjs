// Weapon aspects. Source files each restart at ASP01, so ids are re-keyed
// per weapon here; the original is kept as `sourceId`.
import { exagryph_aspects } from '../js/exagryph_aspects.js';
import { coronacht_aspects } from '../js/coronacht_aspects.js';
import { aegis_aspects } from '../js/aegis_aspects.js';
import { varatha_aspects } from '../js/varatha_aspects.js';
import { stygian_aspects } from '../js/stygian_aspects.js';
import { malphon_aspects } from '../js/malphon_aspects.js';
import { checkCommon, checkIcon, checkText, checkUnique, result } from './_shared.mjs';

export const ASPECT_FILES = [
  { weapon: 'rail',   prefix: 'ASPR', name: 'Adamant Rail',      list: exagryph_aspects },
  { weapon: 'bow',    prefix: 'ASPB', name: 'Heart-Seeking Bow', list: coronacht_aspects },
  { weapon: 'shield', prefix: 'ASPD', name: 'Shield of Chaos',   list: aegis_aspects },
  { weapon: 'spear',  prefix: 'ASPP', name: 'Eternal Spear',     list: varatha_aspects },
  { weapon: 'blade',  prefix: 'ASPS', name: 'Stygian Blade',     list: stygian_aspects },
  { weapon: 'fists',  prefix: 'ASPF', name: 'Twin Fists',        list: malphon_aspects },
];

export function parseAspects() {
  const problems = [];
  const items = [];

  for (const { weapon, prefix, name, list } of ASPECT_FILES) {
    if (!Array.isArray(list)) { problems.push(`aspects: ${weapon} list is not an array`); continue; }
    if (list.length !== 4) problems.push(`aspects: ${name} has ${list.length}, expected 4`);

    list.forEach((raw, i) => {
      if (!checkCommon(raw, 'aspect', problems)) return;
      checkIcon(raw, 'aspect', problems);
      checkText(raw, 'aspect', problems);

      // the icon filename should match the aspect name
      const stem = raw.iconsrc?.split('/').pop()?.replace(/\.\w+$/, '').replace(/_/g, ' ');
      if (stem && stem.toLowerCase() !== raw.title.toLowerCase())
        problems.push(`aspect "${raw.title}": icon points at "${stem}"`);

      items.push({
        ...raw,
        id: `${prefix}${String(i + 1).padStart(2, '0')}`,
        sourceId: raw.id,
        kind: 'aspect',
        weaponId: weapon,
        short: raw.title.replace(/^Aspect of /, ''),
      });
    });

    if (!list.some((a) => /Zagreus/.test(a.title ?? '')))
      problems.push(`aspects: ${name} has no Aspect of Zagreus`);
  }

  checkUnique(items, 'aspects', problems);
  return result(items, problems);
}
