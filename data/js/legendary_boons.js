// Legendary boon data, keyed by the boon id it augments.
// These boons ALREADY EXIST in boons.js - this patch adds the legendary flag,
// stat values, and prerequisites rather than defining new records.

export const legendaryPatch = {
  'APH15': {  // Unhealthy Fixation
    legendary: true,
    stats: ["Charm Duration: 4 Sec."],
    prerequisites: [
      { count: 1, any: ['APH05', 'APH03', 'APH01', 'APH02', 'APH04'] },
      { count: 1, any: ['APH11', 'APH12', 'APH13'] },
    ],
  },
  'ARE15': {  // Vicious Cycle
    legendary: true,
    stats: ["Damage Increase per Hit: +2"],
    prerequisites: [
      { count: 1, any: ['ARE11', 'ARE12'] },
    ],
  },
  'ART14': {  // Fully Loaded
    legendary: true,
    stats: ["Max Ammo: +2"],
    prerequisites: [
      { count: 2, any: ['ART13', 'ART07', 'ART08'] },
    ],
  },
  'ATH15': {  // Divine Protection
    legendary: true,
    stats: ["Barrier Cooldown: 20 Sec."],
    prerequisites: [
      { count: 1, any: ['ATH12'] },
    ],
    notes: [
      "Attacks that are successfully blocked do not remove the barrier.",
    ],
  },
  'DEM15': {  // Winter Harvest
    legendary: true,
    stats: ["Shatter Area Damage: 50"],
    prerequisites: [
      { count: 2, any: ['DEM13', 'DEM09', 'DEM12'] },
    ],
  },
  'DIO15': {  // Black Out
    legendary: true,
    stats: ["Fog Combo Damage: 60%"],
    prerequisites: [
      { count: 1, any: ['DIO06', 'DIO02', 'DIO01', 'DIO05'] },
      { count: 1, any: ['DIO03', 'DIO04'] },
    ],
  },
  'HER15': {  // Greater Recall
    legendary: true,
    prerequisites: [
      { count: 1, any: ['HER03', 'HER11'] },
    ],
    prerequisiteItems: ["Lambent Plume equipped"],
    notes: [
      "Mirror talent Infernal Soul must be active.",
    ],
  },
  'HER16': {  // Bad News
    legendary: true,
    stats: ["First shot damage: +50%"],
    prerequisites: [
      { count: 1, any: ['HER14'] },
    ],
    prerequisiteItems: ["Lambent Plume equipped"],
    notes: [
      "Mirror talent Stygian Soul must be active.",
      "Due to a glitch, this Boon instead provides a global 50% boost to all damage dealt to enemies without Ammo on them, not just Cast.",
    ],
  },
  'POS17': {  // Second Wave
    legendary: true,
    prerequisites: [
      { count: 1, any: ['POS03', 'POS06', 'POS02', 'POS01', 'POS05'] },
      { count: 1, any: ['POS13', 'POS07'] },
    ],
    notes: [
      "Second Knockback Delay: 0.7 Sec.",
      "Will only proc with Boon-enabled knock-away. Will not proc on shield attack, sword lunge, etc.",
    ],
  },
  'POS16': {  // Huge Catch
    legendary: true,
    prerequisites: [
      { count: 2, any: ['POS09', 'POS10'] },
    ],
    prerequisiteItems: ["Conch Shell equipped"],
    notes: [
      "Fish Spawn Chance: +20%",
      "This boon also removes the Chambers Since Last Fishing Point spawn requirement.",
      "Your first encounter with this boon will be scripted to appear in the first chamber as the only choice, ignoring prerequisites. This happens only once.",
    ],
  },
  'ZEU15': {  // Splitting Bolt
    legendary: true,
    stats: ["Lightning Damage: 40"],
    prerequisites: [
      { count: 1, any: ['ZEU09', 'ZEU11', 'ZEU10'] },
    ],
    notes: [
      "The additional burst is a slow moving spark.",
      "Spark Speed: 500",
      "Bounces: 5",
      "Bounce Range: 520",
    ],
  },
  'CHA12': {  // Defiance
    legendary: true,
    prerequisites: [

    ],
    prerequisiteItems: ["Any Chaos Boon"],
    notes: [
      "This gives Zagreus +1 additional slot of Death Defiance, which is only lost after his eventual death",
      "This Death Defiance is used before the regular Death Defiances, unlike the Lucky Tooth which is used last",
      "Upon depleting, the Defiance slot can be replenished with Kiss of Styx normally",
    ],
  },
};

/** Apply the patch to a boon list, returning a new array. */
export function withLegendary(boons) {
  return boons.map((b) => (legendaryPatch[b.id] ? { ...b, ...legendaryPatch[b.id] } : b));
}

/**
 * Whether a set of owned boon ids satisfies a legendary's prerequisites.
 * Ignores prerequisiteItems (keepsakes / mirror talents) - check those separately.
 */
export function meetsPrerequisites(id, ownedIds) {
  const entry = legendaryPatch[id];
  if (!entry) return false;
  const owned = new Set(ownedIds);
  return entry.prerequisites.every(
    (g) => g.any.filter((x) => owned.has(x)).length >= g.count
  );
}