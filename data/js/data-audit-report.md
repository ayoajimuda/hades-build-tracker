# Data audit — 20 uploaded files

Run against every file, cross-checking each id reference to the file that defines it.

## Blocking

**`chaos_curses.js` does not import.** Lines 131 and 134 reference `curses`,
but the array is called `chaos_curses`. Any page importing this file gets a
`ReferenceError` at module load, not at call time — so the whole route dies.

```js
// current — throws
export const cursesById = new Map(curses.map((c) => [c.id, c]));
export const triggeredCurses = curses.filter((c) => c.trigger);

// fixed
export const cursesById = new Map(chaos_curses.map((c) => [c.id, c]));
export const triggeredCurses = chaos_curses.filter((c) => c.trigger);
```

## Aspect ids collide

Every aspect file restarts at `ASP01`, so **24 aspects share 4 ids**. And
`stygian_aspects.js` has a duplicate *within* the file — Aspect of Zagreus and
Aspect of Arthur are both `ASP01` (Arthur should be `ASP04`).

If you ever merge aspects into one array or key a lookup by id, they overwrite
each other silently. Suggested prefixes, matching the hammer scheme:

| file | prefix |
|---|---|
| `exagryph_aspects.js` | `ASPR01`–`ASPR04` |
| `coronacht_aspects.js` | `ASPB01`–`ASPB04` |
| `aegis_aspects.js` | `ASPD01`–`ASPD04` |
| `varatha_aspects.js` | `ASPP01`–`ASPP04` |
| `stygian_aspects.js` | `ASPS01`–`ASPS04` |
| `malphon_aspects.js` | `ASPF01`–`ASPF04` |

## Three aspect icons point at the wrong file

All in `aegis_aspects.js` — copy-paste from other weapons:

| aspect | current | should be |
|---|---|---|
| Aspect of Chaos | `Aspect_of_Achilles.webp` | `Aspect_of_Chaos.webp` |
| Aspect of Zeus | `Aspect_of_Hades.webp` | `Aspect_of_Zeus.webp` |
| Aspect of Beowulf | `Aspect_of_Guan_Yu.webp` | `Aspect_of_Beowulf.webp` |

The other five aspect files check out.

## Wiki markup left in three duo descriptions

```js
// DUO01 Curse of Longing
text: "Doom]] effects continuously strike Weak''' foes."
//  -> "Your Doom effects continuously strike Weak foes."

// DUO05 Low Tolerance
text: "Hangover]] effects can stack even more times against Weak''' foes."
//  -> "Your Hangover effects can stack even more times against Weak foes."

// DUO06 Sweet Nectar
text: "Poms of Power]]''' you find are more effective."
//  -> "Any Poms of Power you find are more effective."
```

All three came from `[[Status Curse|Doom]]`-style links where the opening
`[[` sat inside a `'''` bold span. The current parser handles this; these
entries predate the fix.

## Two find/replace accidents

Still valid English, so no linter or parser will catch them:

```js
// chaos_boons.js CHA05 Favor
text: "Chaos have +X% chance to be Rare or better."   // -> "Boons have"

// duo_boons.js DUO26 Exclusive Access
text: "Any Duo you find have superior effects."       // -> "Any Boons you find have"
```

Looks like a global `Boons` -> `Chaos` / `Duo` replace ran over the `text`
fields. Worth checking `effect[]` on CHA05 too — those read correctly, so only
`text` was hit.

## Passed

- All 28 duos' requirement ids resolve to real boons.
- All 12 legendary patch targets and their prerequisite ids resolve.
- All 82 hammer exclusions resolve, none cross a weapon.
- Every aspect named by a hammer (`aspectExclusive` / `aspectIncompatible`)
  exists in the matching aspect file.
- No duplicate ids among boons, chaos boons, or hammers.

## Cosmetic

**Export naming is inconsistent** — `shieldHammers` (camel), `chaos_boons`
(snake), `duo_Boons` (mixed). `duo_Boons` in particular is easy to mistype.

**File names don't match exports.** `aegis_upgrades.js` exports
`shieldHammers`; `exagryph_upgrades.js` exports `railHammers`. Both schemes
are defensible — Greek weapon names vs plain — but mixing them means you have
to open the file to know what it exports.

**24 hammer icons contain spaces**, e.g. `/img/Hammers/Bow Point-Blank Shot.webp`.
Legal in a URL but they need encoding, and they're inconsistent with the
underscore names used by the other 58. Worth normalising the files and paths.

**`featuredBuilds.js`** still has `name: 'Lightning_Strike'` with an underscore
in the Perfect Aim build — the only icon name in that file that matches no
known boon title.
