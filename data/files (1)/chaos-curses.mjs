// 2. Chaos curses — same template as Chaos boons, but no rarity columns.
import { clean, fieldOf, emitModule } from '../lib/wiki.mjs';

/** "For the next 3–4 encounters" -> { min, max, unit } */
function parseDuration(text) {
  const m = text.match(/next (\d+)\u2013(\d+) (encounters|chambers)/i);
  return m ? { min: Number(m[1]), max: Number(m[2]), unit: m[3].toLowerCase() } : null;
}

/** Which player action triggers the curse's self-damage, if any. */
function parseTrigger(text) {
  const m = text.match(/each time you (Attack|Special|Cast|Dash)/i);
  return m ? m[1].toLowerCase() : null;
}

export function parseCurses(src, { prefix = 'CUR' } = {}) {
  const rows = src.match(/\{\{Boon table row[^]*?\n\}\}/g) ?? [];
  const curses = [];
  const problems = [];
  let n = 0;

  for (const row of rows) {
    const name = fieldOf(row, 'name');
    const rawDesc = fieldOf(row, 'description');
    if (!name || !rawDesc) { problems.push('row missing name or description'); continue; }

    const text = clean(rawDesc);
    const duration = parseDuration(text);
    if (!duration) problems.push(`${clean(name)}: no duration found`);

    const notes = fieldOf(row, 'notes');
    curses.push({
      id: `${prefix}${String(++n).padStart(2, '0')}`,
      title: clean(name),
      kind: 'curse',
      text,
      duration,
      trigger: parseTrigger(text),
      iconsrc: `/img/Curses/${clean(name)}_I.png`,
      notes: notes ? [clean(notes)] : undefined,
    });
  }
  return { items: curses, problems };
}

export const emit = (items) => emitModule({
  header: '// Chaos curses — generated from the wiki curse table.\n' +
          '// A Chaos boon is offered with a curse attached: endure it, then keep the boon.',
  name: 'curses',
  items,
  extra: '\nexport const cursesById = new Map(curses.map((c) => [c.id, c]));\n\n' +
         '/** Curses that punish a specific action — cross-check against filled slots. */\n' +
         'export const triggeredCurses = curses.filter((c) => c.trigger);\n',
});
