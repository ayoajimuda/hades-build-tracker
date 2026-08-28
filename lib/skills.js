// Rarity and rank handling.
//
// Boons cycle common -> rare -> epic -> heroic. Legendary is excluded: a
// legendary boon is legendary by definition, not a tier you climb to.
// Keepsakes use ranks 1-3. Everything else is fixed and does not cycle.

export const RARITIES = ['common', 'rare', 'epic', 'heroic'];

/**
 * Whether this record cycles rarity. Checks `kind` when present and falls
 * back to `god`, which only boons carry — so it works on raw data too.
 */
export function hasRarity(item) {
  if (!item || item.legendary) return false;
  if (item.kind && item.kind !== 'boon') return false;
  return Boolean(item.god);
}

/** Rarities this record can reach, in cycle order. Empty if it can't cycle. */
export function raritiesOf(item) {
  if (!hasRarity(item)) return [];
  const own = item.rarities?.filter((r) => RARITIES.includes(r));
  return own?.length ? own : RARITIES;
}

export function isRankBased(item) {
  return Array.isArray(item?.ranks);
}

/** Number of levels: 3 for keepsakes, N rarities for boons, 1 otherwise. */
export function maxLevel(item) {
  if (isRankBased(item)) return item.ranks.length;
  return raritiesOf(item).length || 1;
}

export function initialLevel(item) {
  if (isRankBased(item)) return { rank: 1 };
  const list = raritiesOf(item);
  return list.length ? { rarity: list[0] } : {};
}

/** Advance one level, wrapping. Returns the same level when there's nothing to cycle. */
export function cycleLevel(item, level) {
  if (isRankBased(item)) {
    const max = item.ranks.length;
    return max < 2 ? level : { rank: ((level?.rank ?? 1) % max) + 1 };
  }

  const list = raritiesOf(item);
  if (list.length < 2) return level;

  const i = list.indexOf(level?.rarity);
  return { rarity: list[(i + 1) % list.length] };
}

/** Display text at the current level, falling back to the base description. */
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