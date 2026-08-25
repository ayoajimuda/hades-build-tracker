// 3. Companions — legendary keepsakes that occupy the keepsake slot.
import { clean, iconOf, rowsOf, emitModule } from '../lib/wiki.mjs';

export function parseCompanions(src, { prefix = 'COM' } = {}) {
  const companions = [];
  const problems = [];
  let n = 0;

  for (const row of rowsOf(src)) {
    const icon = iconOf(row);
    const title = row.match(/\[\[Companion [^\]|]+\|'''([^']+)'''\]\]/);
    if (!icon || !title) continue;

    // the linked NPC after the name cell is the source
    const after = row.slice(row.indexOf(title[0]) + title[0].length);
    const source = after.match(/\[\[([A-Z][^\]|]*)\]\]/);

    const start = row.indexOf("Your '''Summon'''");
    if (start === -1) { problems.push(`${clean(title[1])}: no summon description`); continue; }
    const block = row.slice(start).split('\n');

    const text = clean(block[0]);
    const drops = block.filter((l) => l.trim().startsWith('*'))
      .map((l) => clean(l.replace(/^\s*\*/, ''))).filter(Boolean);
    const restriction = row.match(/\u26a0\ufe0f''([^]*?)''<\/big>/);
    const dmg = text.match(/deals? (\d+) damage/);

    companions.push({
      id: `${prefix}${String(++n).padStart(2, '0')}`,
      title: clean(title[1]),
      kind: 'companion',
      slot: 'keepsake',
      source: source ? clean(source[1]) : null,
      text,
      damage: dmg ? Number(dmg[1]) : null,
      drops: drops.length ? drops : undefined,
      restriction: restriction ? clean(restriction[1]) : undefined,
      iconsrc: `/img/Companions/${icon}`,
    });
  }
  return { items: companions, problems };
}

export const emit = (items) => emitModule({
  header: '// Companions — generated from the wiki companion table.\n' +
          '// A companion occupies the KEEPSAKE slot: equipping one means no keepsake.',
  name: 'companions',
  items,
  extra: '\nexport const companionsById = new Map(companions.map((c) => [c.id, c]));\n\n' +
         '/** Companions that cannot be used in certain encounters. */\n' +
         'export const restrictedCompanions = companions.filter((c) => c.restriction);\n',
});
