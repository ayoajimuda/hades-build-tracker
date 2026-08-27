#!/usr/bin/env node
// Run every parser and report. Exits non-zero on problems, so it works in CI.
//
//   node data/check.mjs
import { load } from './parse/index.mjs';

const { data, problems } = load();

for (const [k, v] of Object.entries(data))
  if (Array.isArray(v)) console.log(`  ${String(v.length).padStart(4)}  ${k}`);

if (!problems.length) {
  console.log('\nno problems\n');
  process.exit(0);
}
console.log(`\n${problems.length} problem(s):`);
problems.forEach((p) => console.log('  ! ' + p));
console.log();
process.exit(1);
