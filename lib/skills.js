export const RARITIES = ['common', 'rare', 'epic', 'heroic'];

/** Levels a boon can reach. Falls back to all rarities until per-rarity data exists. */
export function maxLevel(boon) {
  return boon.effect?.length || RARITIES.length;
}

export function initialLevel() {
  return { rarity: 'common' };
}

export function cycleLevel(boon, level) {
  const max = maxLevel(boon);
  const i = RARITIES.indexOf(level.rarity);
  return { rarity: RARITIES[(i + 1) % max] };
}

/** Effect text for the current level, or the base text if there's no per-rarity data. */
export function effectText(boon, level) {
  if (!boon.effect?.length) return boon.text;
  return boon.effect[Math.min(RARITIES.indexOf(level.rarity), boon.effect.length - 1)];
}