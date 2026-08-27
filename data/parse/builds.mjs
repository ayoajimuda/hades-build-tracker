// Featured builds — hand-authored, so the check is that every icon name
// matches something real.
import { featuredBuilds } from '../js/featuredBuilds.js';
import { result } from './_shared.mjs';

export function parseBuilds(known = []) {
  const problems = [];
  const titles = new Set(known.map((x) => x.title));
  const slugs = new Set();

  for (const b of featuredBuilds) {
    if (!b.slug) problems.push(`featured build "${b.name}": no slug`);
    if (slugs.has(b.slug)) problems.push(`featured builds: duplicate slug "${b.slug}"`);
    slugs.add(b.slug);

    for (const i of b.icons ?? []) {
      if (!i.src?.startsWith('/')) problems.push(`build "${b.name}": icon src not absolute`);
      if (titles.size && !titles.has(i.name))
        problems.push(`build "${b.name}": "${i.name}" matches no known item`);
    }
  }

  return result(featuredBuilds, problems);
}
