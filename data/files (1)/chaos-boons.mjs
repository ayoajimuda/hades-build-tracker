// 1. Chaos boons — {{Boon table row}} templates with per-rarity value columns.
import { clean, fieldOf, emitModule } from '../lib/wiki.mjs';

export const RARITY_KEYS = ['common', 'rare', 'epic', 'heroic', 'legendary'];

/**
 * Substitute a rarity's value into the description's +X / X% placeholder.
 * Collapses the double "%" and repeated unit words the wiki produces.
 */
function applyValue(description, value) {
  if (!value || value === 'N/A') return null;
  if (!/\+?X%?/.test(description)) return description;
  return description
    .replace(/\+?X%?%?/, value)
    .replace(/%%/g, '%')
    .replace(/\b(\w+)\s+\1\b/g, '$1')
    .replace(/\s+([.,])/g, '$1')
    .trim();
}

export function parseChaosBoons(src, { god = 'CHA', prefix = 'CHA' } = {}) {
  const rows = src.match(/\{\{Boon table row[^]*?\n\}\}/g) ?? [];
  const boons = [];
  const problems = [];
  let n = 0;

  for (const row of rows) {
    const legendary = /^\{\{Boon table row legendary/.test(row);
    const name = fieldOf(row, 'name');
    const rawDesc = fieldOf(row, 'description');
    if (!name || !rawDesc) { problems.push('row missing name or description'); continue; }

    const text = clean(rawDesc);
    const rarities = [];
    const effect = [];

    for (const key of RARITY_KEYS) {
      const raw = fieldOf(row, key);
      if (!raw) continue;
      const line = applyValue(text, clean(raw));
      if (!line) continue;
      rarities.push(key);
      effect.push(line);
    }

    // legendary rows carry no scaling table
    if (legendary && effect.length === 0) { rarities.push('legendary'); effect.push(text); }
    if (rarities.length === 0) problems.push(`${clean(name)}: no rarity values`);

    const notes = fieldOf(row, 'notes');
    boons.push({
      id: `${prefix}${String(++n).padStart(2, '0')}`,
      title: clean(name),
      god,
      slot: null,
      legendary: legendary || undefined,
      text,
      rarities,
      effect,
      iconsrc: `/img/Boons/${clean(name)}_I.png`,
      tags: [god],
      notes: notes ? [clean(notes)] : undefined,
    });
  }
  return { items: boons, problems };
}

export const emit = (items) => emitModule({
  header: '// Chaos boons — generated from the wiki "Boon table row" templates.\n' +
          '// `effect[i]` is the full text at `rarities[i]`. Chaos boons never fill a slot.',
  name: 'chaosBoons',
  items,
  extra: '\nexport const chaosBoonsById = new Map(chaosBoons.map((b) => [b.id, b]));\n',
});
