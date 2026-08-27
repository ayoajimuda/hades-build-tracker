// Shared helpers for the per-file parsers.
//
// Each parser takes the raw export from data/js/*.js and returns
// { items, problems }. `problems` is always an array — never throws — so one
// malformed record can't take down a page.

/** Fields every record should carry. */
export function checkCommon(x, label, problems) {
  if (!x || typeof x !== 'object') { problems.push(`${label}: not an object`); return false; }
  if (!x.id) problems.push(`${label}: missing id`);
  if (!x.title) problems.push(`${label}: missing title (${x.id})`);
  return Boolean(x.id);
}

/** Icon paths must be absolute, extensionless-safe, and free of spaces. */
export function checkIcon(x, label, problems) {
  const p = x.iconsrc;
  if (!p) { problems.push(`${label} "${x.title}": no iconsrc`); return; }
  if (!p.startsWith('/')) problems.push(`${label} "${x.title}": icon not absolute (${p})`);
  if (/[ '"]/.test(p)) problems.push(`${label} "${x.title}": icon path has spaces or quotes (${p})`);
  if (!/\.(webp|png|jpg|jpeg|svg)$/i.test(p)) problems.push(`${label} "${x.title}": icon has no extension (${p})`);
}

/** Wiki markup that should never survive into the data. */
const MARKUP = /\]\]|\[\[|'''|\{\{|<br|&[a-z]+;/;

export function checkText(x, label, problems, fields = ['text', 'description']) {
  for (const f of fields)
    if (x[f] && MARKUP.test(x[f]))
      problems.push(`${label} "${x.title}": wiki markup in ${f}`);
}

/** Flag duplicate ids within one collection. */
export function checkUnique(items, label, problems) {
  const seen = new Map();
  for (const x of items) {
    if (seen.has(x.id)) problems.push(`${label}: duplicate id "${x.id}" (${seen.get(x.id)} / ${x.title})`);
    else seen.set(x.id, x.title);
  }
}

/** Every parser returns this shape. */
export function result(items, problems) {
  return { items, problems, ok: problems.length === 0 };
}
