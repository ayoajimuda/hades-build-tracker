// Chaos curses.
import { chaos_curses } from '../js/chaos_curses.js';
import { checkCommon, checkIcon, checkText, checkUnique, result } from './_shared.mjs';

const TRIGGERS = ['attack', 'special', 'cast', 'dash', 'call'];

export function parseCurses() {
  const problems = [];
  const items = [];

  for (const raw of chaos_curses) {
    if (!checkCommon(raw, 'curse', problems)) continue;
    checkIcon(raw, 'curse', problems);
    checkText(raw, 'curse', problems);

    const d = raw.duration;
    if (!d) problems.push(`curse "${raw.title}": no duration`);
    else {
      if (!['encounters', 'chambers'].includes(d.unit))
        problems.push(`curse "${raw.title}": odd duration unit "${d.unit}"`);
      if (d.min > d.max) problems.push(`curse "${raw.title}": duration min > max`);
    }

    if (raw.trigger && !TRIGGERS.includes(raw.trigger))
      problems.push(`curse "${raw.title}": unknown trigger "${raw.trigger}"`);

    items.push({ ...raw, kind: 'curse', notes: raw.notes ?? [] });
  }

  checkUnique(items, 'curses', problems);
  return result(items, problems);
}
