#!/usr/bin/env node
// Runs every parser and writes the generated data modules to ./out.
//
//   node run.mjs            parse everything
//   node run.mjs chaos duo  parse only the named targets

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import * as chaosBoons from './src/chaos-boons.mjs';
import * as curses from './src/chaos-curses.mjs';
import * as companions from './src/companions.mjs';
import * as hammers from './src/hammers.mjs';
import * as duo from './src/duo-boons.mjs';
import * as legendary from './src/legendary-boons.mjs';
import * as wares from './src/wares.mjs';

const WIKI = './wiki';
const OUT = './out';
const read = (f) => readFileSync(join(WIKI, f), 'utf8');

// god boons come from the already-generated module; duos and legendaries
// resolve their requirement names against it
const { boons: godBoons } = await import('../wiki/boons.pretty.js');

const WEAPONS = [
  ['rail', 'HAMR'], ['bow', 'HAMB'], ['shield', 'HAMD'],
  ['spear', 'HAMP'], ['blade', 'HAMS'], ['fists', 'HAMF'],
];

const TARGETS = {
  chaos: () => {
    const r = chaosBoons.parseChaosBoons(read('chaos.wiki'));
    return { ...r, file: 'chaos-boons.js', source: chaosBoons.emit(r.items) };
  },
  curses: () => {
    const r = curses.parseCurses(read('curses.wiki'));
    return { ...r, file: 'curses.js', source: curses.emit(r.items) };
  },
  companions: () => {
    const r = companions.parseCompanions(read('companions.wiki'));
    return { ...r, file: 'companions.js', source: companions.emit(r.items) };
  },
  hammers: () => {
    let items = [], problems = [], notices = [];
    for (const [weapon, prefix] of WEAPONS) {
      const f = `hammer-${weapon}.wiki`;
      if (!existsSync(join(WIKI, f))) { problems.push(`missing ${f}`); continue; }
      const r = hammers.parseHammers(read(f), { weapon, prefix });
      items = items.concat(r.items);
      problems = problems.concat(r.problems);
      notices = notices.concat(r.notices);
    }
    return { items, problems, notices, dir: 'hammers',
             files: hammers.emitSplit(items) };
  },
  duo: () => {
    const r = duo.parseDuoBoons(read('duo.wiki'), { boons: godBoons });
    return { ...r, file: 'duo-boons.js', source: duo.emit(r.items) };
  },
  legendary: () => {
    const all = [...godBoons, ...loadChaos()];
    const r = legendary.parseLegendary(read('legendary.wiki'), { boons: all });
    return { ...r, file: 'legendary.js', source: legendary.emit(r.items) };
  },
  wares: () => {
    const r = wares.parseWares(read('wares.wiki'));
    return { ...r, file: 'wares.js', source: wares.emit(r.items) };
  },
};

function loadChaos() {
  return chaosBoons.parseChaosBoons(read('chaos.wiki')).items;
}

const requested = process.argv.slice(2);
const names = requested.length ? requested : Object.keys(TARGETS);

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

let failed = 0;
console.log('');
for (const name of names) {
  const target = TARGETS[name];
  if (!target) { console.log(`  ?  ${name} — unknown target`); failed++; continue; }

  const { items, problems = [], notices = [], file, source, dir, files } = target();

  let written;
  if (files) {
    const d = join(OUT, dir);
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
    for (const f of files) writeFileSync(join(d, f.file), f.source);
    written = `out/${dir}/ (${files.length} files)`;
  } else {
    writeFileSync(join(OUT, file), source);
    written = `out/${file}`;
  }

  const status = problems.length ? '!' : 'ok';
  console.log(`  ${status.padEnd(3)}${name.padEnd(12)} ${String(items.length).padStart(3)} items  ->  ${written}`);
  problems.forEach((p) => { console.log(`      ! ${p}`); failed++; });
  notices.forEach((x) => console.log(`      ~ ${x}`));
}
console.log(`\n${failed ? `${failed} problem(s)` : 'no problems'}\n`);
process.exit(failed ? 1 : 0);
