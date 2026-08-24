export const RARITIES = ['common', 'rare', 'epic', 'heroic', 'legendary'];
// note: original had 'heroric' — if data.json uses that spelling, match it here

let cache = null;

export async function loadSkillData() {
  if (cache) return cache;
  const res = await fetch('/data.json');
  const raw = await res.json();

  // raw[0] = category names, raw[1..] = arrays of skill objects
  const [names, ...categories] = raw;
  cache = {
    categories: categories.map((skills, i) => ({ name: names[i], skills })),
    byId: new Map(categories.flat().map((s) => [s.id, s])),
  };
  return cache;
}

export function isRankBased(id) {
  return ['MIR', 'HEA'].includes(id.slice(0, 3));
}

export function maxLevel(skill) {
  return Math.max(skill.effect?.length ?? 0, 1);
}

/** Default level state for a skill placed on the board. */
export function initialLevel(skill) {
  return isRankBased(skill.id) ? { rank: 1 } : { rarity: 'common' };
}

/** Cycle rarity or rank forward, wrapping. Returns a new level object. */
export function cycleLevel(skill, level) {
  const max = maxLevel(skill);
  if (max < 2) return level;

  if (isRankBased(skill.id)) {
    return { rank: (level.rank % max) + 1 };
  }
  const i = RARITIES.indexOf(level.rarity);
  return { rarity: RARITIES[(i + 1) % max] };
}

/** Index into skill.effect[] for the current level. */
export function effectIndex(skill, level) {
  if (maxLevel(skill) === 1) return 0;
  if (level.rank != null) return level.rank - 1;
  return RARITIES.indexOf(level.rarity);
}