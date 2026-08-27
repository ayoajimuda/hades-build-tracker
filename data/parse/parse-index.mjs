// Runs every parser and composes the result.
//
//   import { load } from './parse/index.mjs';
//   const { data, problems } = load();
//
// Order matters: boons first, since duos and builds validate against them.

import { parseBoons } from './boons.mjs';
import { parseHammers } from './hammers.mjs';
import { parseAspects } from './aspects.mjs';
import { parseDuos } from './duos.mjs';
import { parseCurses } from './curses.mjs';
import { parseKeepsakes } from './keepsakes.mjs';
import { parseBuilds } from './builds.mjs';
import { parseWares } from './wares.mjs';

export function load() {
  const problems = [];
  const tag = (label, r) => { problems.push(...r.problems.map((p) => `[${label}] ${p}`)); return r.items; };

  const boons = tag('boons', parseBoons());
  const hammers = tag('hammers', parseHammers());
  const aspects = tag('aspects', parseAspects());
  const duos = tag('duos', parseDuos(boons));
  const curses = tag('curses', parseCurses());
  const keepsakeSlot = tag('keepsakes', parseKeepsakes());
  const wares = tag('wares', parseWares());
  const builds = tag('builds', parseBuilds([...boons, ...hammers, ...aspects]));

  // cross-file: aspects named by hammers must exist on that weapon
  const shortsByWeapon = {};
  for (const a of aspects) (shortsByWeapon[a.weaponId] ??= new Set()).add(a.short);
  for (const h of hammers)
    for (const name of [h.aspectExclusive, ...(h.aspectIncompatible ?? [])].filter(Boolean))
      if (!shortsByWeapon[h.weapon]?.has(name))
        problems.push(`[cross] hammer "${h.title}": aspect "${name}" not found on ${h.weapon}`);

  const keepsakes = keepsakeSlot.filter((x) => x.kind === 'keepsake');
  const companions = keepsakeSlot.filter((x) => x.kind === 'companion');

  const all = [...boons, ...hammers, ...aspects, ...duos, ...curses, ...keepsakeSlot, ...wares];
  const byId = new Map(all.map((x) => [x.id, x]));
  if (byId.size !== all.length) problems.push(`[cross] ${all.length - byId.size} id collision(s) across collections`);

  return {
    data: { boons, hammers, aspects, duos, curses, keepsakes, companions, keepsakeSlot, wares, builds, byId },
    problems,
    ok: problems.length === 0,
  };
}
