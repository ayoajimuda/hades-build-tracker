// lib/skills.js
export const RARITIES = ['common', 'rare', 'epic', 'heroic'];

/** Only boons carry a rarity. Duos and legendaries are fixed. */
export function hasRarity(item) {
  return item?.kind === 'boon' && !item.legendary;
}

export function raritiesOf(item) {
  if (!hasRarity(item)) return [];
  const own = item.rarities?.filter((r) => RARITIES.includes(r));
  return own?.length ? own : RARITIES;
}

export function isRankBased(item) {
  return Array.isArray(item?.ranks);
}

export function maxLevel(item) {
  if (isRankBased(item)) return item.ranks.length;
  return raritiesOf(item).length;
}

export function initialLevel(item) {
  if (isRankBased(item)) return { rank: 1 };
  const list = raritiesOf(item);
  return list.length ? { rarity: list[0] } : {};
}

export function cycleLevel(item, level) {
  if (isRankBased(item)) {
    const max = item.ranks.length;
    return max < 2 ? level : { rank: ((level?.rank ?? 1) % max) + 1 };
  }

  const list = raritiesOf(item);
  if (list.length < 2) return level;              // not a boon, or capped
  const i = list.indexOf(level?.rarity);
  return { rarity: list[(i + 1) % list.length] };
}

export function effectText(item, level) {
  if (!item) return '';

  if (isRankBased(item)) {
    return item.ranks[(level?.rank ?? 1) - 1] ?? item.text ?? '';
  }

  if (item.effect?.length) {
    const list = raritiesOf(item);
    const i = list.indexOf(level?.rarity);
    return item.effect[i >= 0 ? i : 0] ?? item.text ?? '';
  }

  return item.text ?? item.description ?? '';
}