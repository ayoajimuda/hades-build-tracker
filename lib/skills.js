export const RARITIES = ['common', 'rare', 'epic', 'heroic'];

/** Levels a boon can reach. Falls back to all rarities until per-rarity data exists. */
export function raritiesOf(item) {
  return item?.rarities ?? RARITIES;
}

/** Whether this record scales by rank rather than rarity. */
export function isRankBased(item) {
  return Array.isArray(item?.ranks);
}

/** How many levels a record has — 3 for keepsakes, N rarities otherwise. */
export function maxLevel(item) {
  return isRankBased(item) ? item.ranks.length : raritiesOf(item).length;
}

/** The level a record starts at when first added to a build. */
export function initialLevel(item) {
  if (isRankBased(item)) return { rank: 1 };
  return { rarity: raritiesOf(item)[0] };
}

/** Advance to the next level, wrapping. Returns a new level object. */
export function cycleLevel(item, level) {
  const max = maxLevel(item);
  if (max < 2) return level;

  if (isRankBased(item)) {
    return { rank: ((level?.rank ?? 1) % max) + 1 };
  }

  const list = raritiesOf(item);
  const i = list.indexOf(level?.rarity);
  return { rarity: list[(i + 1) % list.length] };
}

/**
 * The text to display at the current level.
 * Falls back to the record's base text when it carries no per-level strings —
 * which is the case for god boons, hammers, wares and aspects.
 */
export function effectText(item, level) {
  if (!item) return '';

  if (isRankBased(item)) {
    return item.ranks[(level?.rank ?? 1) - 1] ?? item.text ?? '';
  }

  if (item.effect?.length) {
    const i = raritiesOf(item).indexOf(level?.rarity);
    return item.effect[i >= 0 ? i : 0] ?? item.text ?? '';
  }

  return item.text ?? item.description ?? '';
}