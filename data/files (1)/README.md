# Hades wiki parsers

Seven parsers that turn Hades wiki markup into JS data modules.

## Usage

Paste a wiki section into `wiki/<name>.wiki`, then:

```bash
node run.mjs              # parse everything
node run.mjs duo wares    # parse only these targets
```

Generated modules land in `out/`. Exit code is non-zero if any parser
reports a problem, so this works in CI.

## Targets

| target | source file(s) | output | items |
|---|---|---|---|
| `chaos` | `chaos.wiki` | `chaos-boons.js` | 12 |
| `curses` | `curses.wiki` | `curses.js` | 13 |
| `companions` | `companions.wiki` | `companions.js` | 6 |
| `hammers` | `hammer-{rail,bow,shield,spear,blade,fists}.wiki` | `hammers.js` | 82 |
| `duo` | `duo.wiki` | `duo-boons.js` | 28 |
| `legendary` | `legendary.wiki` | `legendary.js` | 12 |
| `wares` | `wares.wiki` | `wares.js` | 26 |

`duo` and `legendary` resolve boon names against the god boon dataset, so
that must exist first. They fail loudly if a name doesn't match.

## Output markers

- `!` a problem — an unresolved name, a missing file. Fix the source.
- `~` a notice — something odd in the wiki worth knowing, not an error.

## Adding a weapon or god

Hammers: drop `hammer-<weapon>.wiki` in place and add a row to `WEAPONS`
in `run.mjs`. Prefixes must stay unique or ids will collide across weapons.

## Layout

```
lib/wiki.mjs   shared markup stripping, table splitting, emitters
src/*.mjs      one parser per target, each exporting parse* and emit
run.mjs        runner and reporter
wiki/          pasted wiki source
out/           generated modules — copy into your app's data folder
```

## Notes on the source data

The wiki is inconsistent in ways the parsers absorb:

- Exclusions appear as both "Cannot be combined with X" and "Incompatible with X".
- Aspect names may be multi-word (`Guan Yu`) and phrased either way round.
- Colour templates sometimes use numbered params: `{{Green|1=5%}}`.
- `</br>` appears alongside `<br/>`.
- Several icons still point at pre-rename filenames.
- Duo boons are listed twice, once under each contributing god.
