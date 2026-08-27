// Charon's shop wares. Consumables bought with Obols — except Price of Midas,
// which costs Health, and three whose price is a formula against what you buy.
import { well_of_charon } from '../js/well_of_charon.js';
import { checkCommon, checkIcon, checkText, checkUnique, result } from './_shared.mjs';

const DURATION_UNITS = ['encounters', 'chambers', 'instant', 'until'];

export function parseWares() {
  const problems = [];
  const items = [];

  for (const raw of well_of_charon) {
    if (!checkCommon(raw, 'ware', problems)) continue;
    checkIcon(raw, 'ware', problems);
    checkText(raw, 'ware', problems);

    // price: exactly one of obols / health / variable
    const p = raw.price;
    if (!p) problems.push(`ware "${raw.title}": no price`);
    else {
      const kinds = ['obols', 'health', 'variable'].filter((k) => p[k] != null);
      if (kinds.length === 0) problems.push(`ware "${raw.title}": price has no obols, health or variable`);
      if (kinds.length > 1) problems.push(`ware "${raw.title}": price is both ${kinds.join(' and ')}`);
      if (p.obols != null && !(p.obols > 0)) problems.push(`ware "${raw.title}": non-positive price`);
      if (!p.text) problems.push(`ware "${raw.title}": price has no display text`);
    }

    // duration: unit must be known, and timed ones need an amount
    const d = raw.duration;
    if (!d) problems.push(`ware "${raw.title}": no duration`);
    else {
      if (!DURATION_UNITS.includes(d.unit))
        problems.push(`ware "${raw.title}": unknown duration unit "${d.unit}"`);
      const timed = d.unit === 'encounters' || d.unit === 'chambers';
      if (timed && !(d.amount > 0))
        problems.push(`ware "${raw.title}": ${d.unit} duration with no amount`);
      if (!timed && d.amount != null)
        problems.push(`ware "${raw.title}": ${d.unit} duration should not carry an amount`);
      // the wiki's display text and the parsed amount must agree
      if (timed && d.text && !d.text.startsWith(String(d.amount)))
        problems.push(`ware "${raw.title}": duration text "${d.text}" disagrees with amount ${d.amount}`);
    }

    items.push({
      ...raw,
      kind: 'ware',
      slot: null,
      instant: raw.duration?.unit === 'instant',
      notes: raw.notes ?? [],
    });
  }

  checkUnique(items, 'wares', problems);

  // two wares pointing at the same art is a real bug, not a style choice
  const seen = new Map();
  for (const w of items) {
    if (!w.iconsrc) continue;
    const key = w.iconsrc.toLowerCase();
    if (seen.has(key)) problems.push(`ware "${w.title}": shares an icon with "${seen.get(key)}"`);
    else seen.set(key, w.title);
  }

  return result(items, problems);
}
