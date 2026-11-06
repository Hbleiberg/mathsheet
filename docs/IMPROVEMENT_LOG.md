# MathSheet Improvement Log

The memory of the continuous-improvement loop (`/improveloop`). **Read this first every session**, the
way the skill says (bounded: the handoff, the top Candidates, the headings). One concern per iteration,
one commit per iteration. Prioritization: P1 (data loss, broken generate/print/PDF, wrong answers on a
key, a name reaching HTML unescaped) > P2 (silently wrong output, print/PDF divergence, a11y blockers)
> P3 (performance, dead UI, confusing copy, consistency) > P4 (polish). Tie-breakers: (1) the printed
sheet a student holds, (2) a teacher's saved roster, (3) dual-audience (Jewish day school + secular
classroom) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P3 | index.html | with 2–5 copies a long description runs under "Worksheet 3 of 5", and a key's "(Key 3 of 5)" is cut by its box (160 of 500 Grade 5 keys; S6: one copy is enough for Division Level 4's key, "— Grade 5" under the branding tag); approved S4 (gate 6): shrink the description's font to fit, as for long names | found S4
- [ ] P3 | index.html, math-minute.html, math-facts.html | `escapeHtml` / `esc()` never escapes the apostrophe on any page (the step replaces `'` with `\u0027`, itself): emit `&#x27;` as CLAUDE.md shows; no exploitable sink today (user values land in text nodes or double-quoted attributes), but the smoke's XSS arm cannot see the gap | found S1
- [ ] P3 | index.html | Fractions: 27 % of subtraction problems are x − x = 0 and 27 % of additions total exactly 1 (both fractions drawn from 1…d−1 independently; d = 2 always gives ½ ± ½): approved S6 (gate 2): subtraction takes away a smaller fraction, addition unchanged | found S6
- [ ] P3 | index.html | the Fraction / Decimal Operations checkboxes sit above their labels, not beside them (`.mwg-ops-grid label{display:flex}` loses to the injected `.mwg-student-grid label{display:block;font-weight:bold}`, appended after the static sheet; the Mixed grid's labels survive by `!important`): give the ops labels the same, in the Mixed panel's fraction / decimal groups too | found S10
- [ ] P3 | index.html, math-minute.html, math-facts.html | offline Save PDF notice, approved S2 (gate 2): replace "PDF library not loaded yet. Please try again in a moment." with "The PDF tools could not be downloaded. Check your connection and try again." (the smoke's offline arm matches /PDF/) | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | PDF JPEG quality 0.92 → 0.8, approved S2 (~20 % smaller, no visible difference at 300 dpi, measured S1); CLAUDE.md's PDF step 4 changes with it; prove with `--cdn` bytes before/after and a zoomed raster | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | "Generate Advanced Code" opens its panel after the results and the error box, below every generated sheet (3,400 px down after 3 sheets), and scrolls there: put the panel under the button row | found S5
- [ ] P4 | index.html | an Advanced entry asking more than 30 of a one-line type ("rounding, 60") prints 30 under an honest header with no message (the form offers only 30); approved S11 (gate 2): keep the sheet and add a skipped-style note, "Entry 14: rounding prints at most 30 problems (60 asked)" | found S11
- [ ] P4 | math-minute.html, index.html | a level or grade typed with a stray character is read as another level with no message (`parseInt`: "1O" → Level 1, "7.5" → Level 7; index's grade "2.5" → 2): accept digits only, the messages already name the range | found S11
- [ ] P4 | index.html | Save PDF lays the stacked grids at `minmax(…, 1fr)` while print fixes rows-6…12 (rows-3/4/5 are not fixed in index's print block at all): PDF problems sit 5–6 px lower; give the clone print's rows as b8d2304 did on the standard pages | found S4
- [ ] P4 | index.html | restored fraction/decimal entries still render their ops panel twice (`updateOpsPanel`'s defaults, then `renderOpsPanel` with the saved ops — synchronous since S1): pass the saved ops into `updateOpsPanel` | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the fixed 200 ms `setTimeout` before `window.print` is ~200 ms of every Generate & Print and settles nothing (a rAF + `setTimeout(0)` shape measured −120 to −185 ms on index.html); CLAUDE.md documents the 200 ms as the print-flow convention, so the change updates that sentence too | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the PDF stage (`position:absolute; top:0; z-index:-1000`) is on screen: its bottom ~108 px sit in the desktop viewport and the clones flicker there for the whole export; move it off-screen (e.g. `top:-10000px`) and re-prove the PDF bytes | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the 50 ms timer between PDF pages is ~21 % of a 150-page export since S3 (7.5 s of ~35 s); a bare `requestAnimationFrame` swap failed the verifier's paint probe, so the shape needs a wait that still lets the clone paint (a double rAF, measured) | found S1
- [ ] P4 | index.html | a corrupt saved roster (`mwgRosterData_v2` unparsable) falls back to the defaults silently and the bad value is never cleared, so every load repeats the fallback; clear it and say so once (copy → gate 2) | found S1
- [ ] P4 | index.html | `renderMixedCheckboxes` attaches one change listener per checkbox (~36 per render) instead of one delegated handler on the box | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the read-only textarea in the "Generate Advanced Code" modal has no accessible name (the only unnamed field the S0 baseline found): a `<label for>` or `aria-label` | found S0
- [ ] P4 | index.html, math-minute.html, math-facts.html | Generate Advanced Code emits separators raw: a `;` in a name ("Levi; Dana") splits the line (one part skipped, "Dana" printed), and a comma in a Number ("12, B", S8) reads as part of the name ("Noa, 12" / "B") with no error; the replacement is a gate-2 question | found S2
- [ ] P4 | index.html | Mixed keys in rows-10 / rows-12 and written-across Mixed keys keep the old division drawing (own bar, answer inside it): the quotient over the sheet's bar needs ~24 px those rows lack (it overprinted the problem above by 3–11 px, S8); a short-row shape (smaller quotient, problem lowered) is gate 6 | found S8
- [ ] P4 | index.html | Integers print negatives with a hyphen ("-7 − (-3) =", 74 % of problems; the key too) beside the U+2212 operator: use U+2212 for the sign | found S6
- [ ] P4 | index.html | the long-division divisor sits 3 px below the dividend's baseline (`.mwg-division-divisor` padding-top 8px), as the twins' did before 2b678e1: padding-top 5px, the shape approved S10 | found S10
- [ ] P4 | index.html | Rounding reads "Round 347 to nearest tens" (→ "to the nearest ten") and 3.9 % ask a number below the place ("Round 7 to nearest hundreds" → 0): copy is gate 2, the range pedagogy | found S6
- [ ] P4 | index.html | Scientific-notation keys write "4.5 x 10^4" (ASCII x, caret) beside the sheet's "× 10" with a superscript: render the key with × and `<sup>` | found S6
- [ ] P4 | index.html | descriptions vs generators: "Addition Level 2 (sums 10-20)" never sums past 18 (addends 1–9), "Level 5 (3-digit + any)" and Subtraction 5 never take a 1-digit number; gate 2 | found S6
- [ ] P4 | math-facts.html, math-minute.html | dead CSS: `#student-form-title` (no such element) and the `.modal-*` rules (~75 lines; the Advanced Code panel is an inline div): remove | found S5

- [ ] P4 | index.html | the per-operation decimal types' key answers drop a trailing zero (`parseFloat`: "4.50 + 7.00 = 11.5") while the Decimals type now shows the places on every number (11fd4ee): `toFixed(pl)` for those answers too | found S11
## Feature seeds (micro-features: one page, ≤ ~150 lines, no dependency; selection is gate 1)

- [ ] seed | math-minute.html | "Time / Score" strip in the header (toggle): `Time: ____  Score: ____ / N`, N from the level's count | from S0
- [ ] seed | index.html, math-minute.html, math-facts.html | `dir="auto"` on the name inputs and the printed name, so Hebrew names keep their punctuation and alignment | from S0
- [ ] seed | index.html, math-minute.html, math-facts.html | a "Date: ________" line in the header (toggle, off by default) | from S0
- [ ] seed | index.html, math-minute.html, math-facts.html | Ctrl/⌘+Enter generates & prints, named in the button's title | from S0
- [ ] seed | math-minute.html, math-facts.html | "Paste names" quick-fill: a small textarea that fills the Standard roster's names one per line (a spreadsheet or Google Classroom column) without touching levels | from S0
- [ ] seed | math-facts.html | "Compact answer key": one key per distinct fact code instead of one per student, when the toggle is set | from S0
- [ ] seed | math-minute.html, math-facts.html | "Blank practice sheets": N unnamed copies of one level in one click (a substitute's drawer) | from S0
- [ ] seed | math-minute.html ↔ math-facts.html | "Import roster from the other page" (read the sibling's localStorage key: names and numbers only, levels left blank) — the one allowed two-page handshake | from S0
- [ ] seed | math-minute.html | "Mixed from two levels" per student: pick two levels, deal half the sheet from each | from S0
- [ ] seed | index.html, math-minute.html, math-facts.html | "Large print": 20 problems in a 5 × 4 grid at a bigger font for younger students or an IEP (likely over 150 lines on index.html — split by page) | from S0
- [ ] seed | index.html, math-minute.html, math-facts.html | named saved rosters (Class A / Class B / …) — over 150 lines; split into the storage shape (a list under the same key, migrated from the single payload) and then the picker UI | from S0

## Page seeds (new generators — the maintainer's call, never built inside the loop)

- [ ] page | gematria.html | Hebrew letter values ↔ numbers (אבג numerals, Hebrew dates, sums), with a Roman-numerals toggle for the secular classroom | from S0
- [ ] page | number-bonds.html | number bonds and fact-family triangles (part-part-whole), K–2 | from S0
- [ ] page | multiplication-chart.html | blank and partially filled 12 × 12 charts, with a "hide these rows" option | from S0
- [ ] page | telling-time.html | clock faces to read and to draw, to the hour / half / five minutes | from S0
- [ ] page | money.html | coin counting and making change (US coins; a shekel/agorot toggle) | from S0
- [ ] page | place-value.html | expanded form, rounding, comparing numbers, grades 2–4 | from S0
- [ ] page | omer.html | Counting the Omer number practice (days ↔ weeks and days), seasonal | from S0

## Awaiting the maintainer (an action or an answer only the maintainer can give; a session that resolves one moves it to Done)

- [ ] index.html convergence session (answered S1 — "converge, including the font, in one dedicated session"): a single maintainer-approved session, not loop iterations, restyles `index.html` to `math-facts.html`'s standard (Arial UI, unprefixed classes, a static `<style>`, no `injectStyles()` — a 7.1 KB duplicate whose `.mwg-delete-link:hover` colour already drifted), with before/after screenshots for approval first; F logs divergences only | since S1
- [ ] micro-feature: skipped at gate 1 four sessions running (S8–S11, fixes chosen each time), so the loop stops asking each session; the Feature seeds stay listed, and the maintainer names one (or asks for the question back) when a session should build it | since S11

## In progress

_(empty — never leave the tree mid-change)_

## Done (last 5 sessions; older rows move to the archive)

- [x] S11 | 2026-11-06 | 2abc2e3 | index.html, math-minute.html, math-facts.html | skipped-entry reports number the entries a teacher pasted, not the raw `;` chunks (a newline after `;` made an empty one: the 6th line read "Entry 10", S2); the same loop on all three pages | S11-robustness (paste arm) reports 4, 5, 6, 7 for the 4th–7th entries on each page where HEAD said 7, 9, 11, 13 (15, 26 on index); smoke
- [x] S11 | 2026-11-06 | 11fd4ee | index.html, scripts/loop/probes/ | the Decimals type shows the level's places on every number, sheet and key ("45.0 + 7.0 = 52.0", "3.50 + 12.25 = 15.75"; 9 % lost a zero or the point, S6; approved S11, gate 6) | S6-math-audit's new places check: 12,000 of 12,000 numbers at grades 5 and 6, keys included; HEAD fails 1,579 problems; Mixed@6 green; the S5, S7, S8, S10 index probes replay the change; smoke
- [x] S11 | 2026-11-06 | ad0ed78 | math-minute.html, scripts/loop/probes/S7-facts-audit.mjs | a zero factor stands below as well as on top (7 × 0 and 0 × 7) on Levels 11, 13–15 and Mixed, as every other fact is dealt both ways (S7; approved S10, gate 6) | S7-facts-audit green on 21 levels with the family following, fails Levels 11 and 13 on HEAD; seeded, Levels 1–10, 12, 16–20 byte-identical; Level 11 11 on top / 20 below (19 / 0); S8-minute-print; smoke
- [x] S11 | 2026-11-06 | — | scripts/loop/probes/, docs/IMPROVEMENT_LOG.md | pass E on all three pages (615 selector combinations, bad and 500-entry pastes, storage denied / full, 13 bad payloads, every control): clean but for the known numbering (fixed); a lenient level parse and the silent 30 cap found; the rounding probe's reference re-pointed (bd961ee); gates: micro-feature → skip; Decimals → full places; 30 cap → say so | S11-robustness green, `--control` fails each page; loop-findings S11

- [x] S10 | 2026-11-05 | 291903c | index.html, math-minute.html, math-facts.html, scripts/loop/probes/ | Save PDF reads "Making your PDF: page k of N..." per page, in view, and refuses a second click (button disabled until "PDF saved!" or a notice; approved S3, the S1 guard); the same diff on the twins | S10-pdf-progress (cdnjs), all pages: 8 of 8 counted, disabled mid-export, one pipeline for two clicks; offline and no-student paths re-enable; `--ref HEAD` fails 12; smoke --cdn
- [x] S10 | 2026-11-05 | a32d3fa | index.html, scripts/loop/probes/ | Rounding problems print on one line (a nowrap span; the blank gives way, 286 → 203–256 px; approved S4, gate 6); Mixed 5–8 too | S10-rounding-one-line: 0 of 244 wrap (122 before), last row 780 px (816), other sheets byte-identical; control fails 2; S5-key-rows12, S7-bracket-names, S8-index-key-division replay the span and stay green; S6-math-audit
- [x] S10 | 2026-11-05 | 2b678e1 | math-minute.html, math-facts.html, scripts/loop/probes/S10-divisor-baseline.mjs | the long-division divisor shares the dividend's baseline (padding-top 8 → 5 px; approved S10, gate 6) | 860 brackets 0.00 px apart (3.00 before), every bracket where HEAD puts it; control fails 2; S5-key-division, S5-sign-gap, S8-minute-print, smoke
- [x] S10 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md, CLAUDE.md | pass C on index.html (UI at 1280 / 800 in five states, 29 type rows with keys under print): the ops-panel labels found, the rest known or by design; gates: micro-feature → skipped; Level 4 label → leave (struck); zero both ways → approved; divisor → align (shipped) | ledger, loop-findings S10

- [x] S9 | 2026-11-05 | f98327b | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S9-name-fit.mjs | a long student name shrinks to fit its printed line (to 11 px, then "…"; gate 6, S2), on its usual baseline; names that fit unchanged | S9-name-fit, all pages, sheets and keys, with and without the Number: 0 overflow, baselines 0.00 px from an 18 px name in print, fitting sheets byte-identical; control fails 12; real PDF; +11 ms at 300 sheets
- [x] S9 | 2026-11-05 | ae14c70 | index.html, scripts/loop/probes/S9-index-pdf.mjs | Save PDF draws print's box (padding 0.25in 0.3in, border none): the screen sheet's 1px #bbb border framed every PDF page and narrowed the header 2.4 px (S8's twin fix, 6bebbdb) | S9-index-pdf, a real cdnjs PDF of 8 sheet types with keys against print: 0 of 16 pages framed (16 before), header ink within 1 px (2); control fails; smoke --cdn
- [x] S9 | 2026-11-05 | 936850d | math-minute.html, scripts/loop/probes/S7-facts-audit.mjs | the "hard" levels drop their easiest facts (gate 2: "drop only the easiest"): Level 12 deals 3–9 × 6–9 (no ×1, ×2), Level 17 quotients 2–9; labels kept | S7-facts-audit green with the new decks, fails 3 on the old page (2,807 problems outside); the other 19 levels byte-identical (seeded); S8-minute-print
- [x] S9 | 2026-11-05 | 2a5a054 | CLAUDE.md | the advanced-input recipe said "require name" while the standard keeps Student Name optional: it now says the name may be empty | doc only
- [x] S9 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | pass A on math-facts.html (clean) bought C on math-minute.html (clean but for known items); gates: micro-feature → skipped for the hard levels; hard levels → drop only the easiest (shipped); "Easy X" → keep X (struck) | ledger, loop-findings S9

- [x] S8 | 2026-11-05 | 6bebbdb | math-minute.html, math-facts.html, CLAUDE.md, scripts/loop/probes/S8-minute-pdf.mjs | Save PDF draws print's box (padding 0.25in 0.3in, no border): the screen sheet's 1px #bbb border framed every PDF page and narrowed the header 2.4 px, so the Level 4 key's description wrapped in the PDF only (its problems 7–9 px low) | real cdnjs PDF, 42 pages: 0 framed (42 before), every cell at print's place (87 px off before); clone vs print 0.0 px on both pages; smoke --cdn
- [x] S8 | 2026-11-05 | d3ef5c6 | index.html, scripts/loop/probes/ | fraction keys write whole and mixed numbers in lowest terms (1/1 → 1, 0/1 → 0, 4/3 → 1 1/3; gate 2, S3); S6-math-audit reads them and holds keys to that form, S5-key-rows12 and S7-bracket-names replay it | audit green over 378,000 problems, its control fails 3; worksheets byte-identical, 72 of 240 key answers rewritten at equal value
- [x] S8 | 2026-11-05 | 8e46ade | index.html, scripts/loop/probes/S8-index-key-division.mjs | the key's division is the sheet's own problem, quotient in red over the bar ("49 r1"; gate 6, S5); Mixed keys in rows-10 / 12 and written across keep the old drawing (no room above the bar) | probe: 582 cells 0.00 px from the sheet, quotients ≥ 14 px clear; short / across keys and every sheet byte-identical; control fails 2; real PDF
- [x] S8 | 2026-11-05 | f0ba0e8 | math-facts.html, scripts/loop/probes/S7-facts-audit.mjs | "+10 (Teens Rule)" deals 10 + 9 = 19 (gate 2, S7); every other level and the Mixed pools keep sums to 18 | S7-facts-audit green (+10 max 19; mix+ 64 facts, max 18), fails 2 on the old page; control fails 7; 70 other levels byte-identical
- [x] S8 | 2026-11-05 | — | scripts/loop/probes/S8-minute-print.mjs, docs/IMPROVEMENT_LOG.md | pass B on math-minute.html: print clean (378 sheets in 3 configurations; Letter and A4 one page a sheet), Save PDF framed (fixed), round trip and saved payload fine; gate: micro-feature → skipped for two approved index fixes | S8-minute-print green, its control fails 3

- [x] S7 | 2026-11-05 | cfa5cd6 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S7-skipped-list.mjs | the "Some entries were skipped" box stands above the sheets and a Generate that skipped an entry lands on it (it sat 16,560 px down after 20 sheets, below the scroll target) | probe at 1280 / 390 px on each page: in view, above the first sheet, still before the results after print; 18 checks fail on the old pages; smoke
- [x] S7 | 2026-11-05 | f48b8db | index.html, scripts/loop/probes/S7-bracket-names.mjs | Advanced Input checks the names inside brackets: an unknown operation or a type the grade lacks skips the entry with "invalid type for grade G: <name>"; a stray "|" is ignored | probe: 6 bad entries skipped and named, 7 valid brackets byte-identical to the old page (seeded); control fails 2; roster-subset, S5-mixed-ops, S6-math-audit, smoke
- [x] S7 | 2026-11-05 | 8c9bfd3 | math-facts.html, CLAUDE.md, scripts/loop/probes/S6-header-line.mjs | micro-feature (gate 1): the optional "Header line" on math-facts, line for line math-minute's (S6); the probe takes `--page` | probe on math-facts: blank byte-identical to f48b8db, 8 of 8 carry it escaped, print 1056×816 with 46+ px paper left, PDF clones within 1.0 px, old payload loads; control fails; settings and sheet screenshots
- [x] S7 | 2026-11-05 | — | scripts/loop/probes/S7-facts-audit.mjs, docs/IMPROVEMENT_LOG.md | pass G on math-facts, then math-minute (clean, so it bought the second): 674,000 problems, every key right, every deck dealt as documented; gates: micro-feature → header line on math-facts (shipped); Teens Rule → include 10 + 9 (approved Candidate) | probe green on both pages; `--control` fails 7 checks on each

## Metrics

### Per-session log (one line per session; last 20)

- S11 | 2026-11-06 | pass E, the suite (615 selector combinations through the forms, malformed and 500-entry pastes, storage denied / full, 13 bad payload shapes, every control, on all three pages) | fixes 3 (the three-page entry numbering, index's Decimals places, math-minute's zero both ways; a 4th slot unused, only math-facts had a touch left; on branch claude/clever-davinci-hhh4iz, not main) | smoke 3/3 green + `--cdn`; probes green | index.html and math-minute.html ended on their caps
- S10 | 2026-11-05 | pass C on index.html (UI at 1280 / 800 in five states; 29 type rows, sheet and key, under print) | fixes 3 (the three-page PDF progress and guard, index's Rounding, the twins' divisor; a 4th slot unused, every approved item left needing a capped page; on branch claude/clever-davinci-hhh4iz, not main) | smoke 3/3 green + `--cdn`; probes green | every page ended on its cap
- S9 | 2026-11-05 | pass A on math-facts.html (load, Generate to 300 sheets at 1× and cpu4, form, restore, memory, Save PDF to 150 pages: clean), then C on math-minute.html (UI at 1280 / 800, every level's sheet and key: clean but for known items) | fixes 4 (the approved name shrink on all pages, index's PDF frame, the hard levels, a CLAUDE.md line; on branch claude/clever-davinci-hhh4iz, not main) | smoke 3/3 green + `--cdn`; probes green | index.html and math-minute.html ended on their caps
- S8 | 2026-11-05 | pass B on math-minute.html (378 sheets printed in 3 configurations, Letter and A4; a real 42-page Save PDF rasterized against print; round trip; saved payload) | fixes 4 (one P3 on the twins, two approved index P3s, the approved Teens Rule; on branch claude/clever-davinci-hhh4iz, not main) | smoke 3/3 green + `--cdn`; probes green | every page but math-minute ended on its cap
- S7 | 2026-11-05 | pass G on math-facts.html, then math-minute.html (clean, so it bought a second: 71 + 21 levels × 200 sheets, 674,000 problems recomputed; every key right, every deck as documented) | fixes 2 + micro-feature (on branch claude/clever-davinci-hhh4iz, not main, after S6) | smoke 3/3 green + `--cdn`; probes green | index.html and math-facts.html ended on their caps
- S6 | 2026-11-05 | pass G on index.html (51 selectors × 200 sheets, 378,000 problems recomputed with exact rationals; every key right) | fixes 2 + micro-feature (on branch claude/clever-davinci-hhh4iz, not main, per the maintainer) | smoke 3/3 green; probes green | index.html ended on its cap with 3 P2s queued
- S5 | 2026-11-05 | pass C on math-facts.html (UI at 1280 / 800 px, Advanced mode, the code panel, the error list; rendered sheets and keys of every level class) | fixes 4 (two gated print changes on both standard pages, two index P2s; on branch claude/fervent-lovelace-urwaob, not main) | smoke 3/3 green + `--cdn`; probes green | every page ended on its two-touch cap
- S4 | 2026-11-05 | pass B on index.html (geometry of 2,208 sheets, seeded Save PDF vs print rasters, Advanced Code round trip, saved payload, header toggles) | fixes 3 + a probe (two P2, one P4; on branch claude/fervent-lovelace-urwaob, not main) | smoke 3/3 green + `--cdn`; probe green | index.html ended on its cap with two P2s queued
- S3 | 2026-11-05 | pass A on math-minute.html (node census vs math-facts, 150-sheet generate per level and cpu4, roster form, load, retention, PDF per page to 150 pages) | fixes 3 (one P2 in two commits, one P3; on branch claude/fervent-lovelace-urwaob, not main) | smoke 3/3 green + `--cdn` | every page ended on its two-touch cap again
- S2 | 2026-11-05 | pass B on math-facts.html (geometry 100 sheets, real PDF rasters, A4, font census, advanced round trip) | fixes 3 (two P2 print defects, one P3; on branch claude/fervent-lovelace-urwaob, not main) | smoke 3/3 green + `--cdn` | every page ended on its two-touch cap
- S1 | 2026-11-04 | pass A on index.html (6 measured arms + a critic; 24 findings, all verified real) | fixes 3 (two P2 + two P3 in 3 commits, all pushed to main) | smoke 3/3 green + `--cdn` | 4th fix blocked by the 2-per-page cap
- S0 | 2026-11-04 | bootstrap | pass — | fixes 0 | smoke 3/3 green | baselines in loop-findings S0

### Surface coverage (surface passes × pages — the session that last audited the cell, or —)

| pass | index.html | math-minute.html | math-facts.html |
|---|---|---|---|
| A | S1 | S3 | S9 |
| B | S4 | S8 | S2 |
| C | S10 | S9 | S5 |
| D | — | — | — |
| G | S6 | S7 | S7 |
| H | — | — | — |
| M | — | — | — |

### Discovery-pass rotation (one per session, stalest first; `node scripts/loop/coverage.mjs` picks)

- A performance & speed (surface): last S9 (math-facts.html: clean — load 22 ms DCL, 150 sheets 18–54 ms and 300 with keys 41–100 ms, form and restore fast, no node growth, Save PDF 150 pages in 31 s; A has now run on every page)
- B print & export (surface): last S8 (math-minute.html: print clean in every level and configuration, Letter and A4; Save PDF framed every page and wrapped one key's header — fixed on both standard pages, index.html's frame queued; B has now run on every page)
- C aesthetics (surface): last S10 (index.html: type scale, button hierarchy, notices, the Mixed panel and the 800 px layout match the standard but for Georgia and the `mwg-` names (the Awaiting convergence session); the Fraction / Decimal Operations checkboxes sit above their labels (queued); Rounding one line shipped; C has now run on every page)
- D accessibility (surface): last —
- E errors & robustness (suite): last S11 (all three pages: every option the forms offer generates — 523 + 21 + 71 combinations — with its count and key; malformed and 500-entry pastes reported and printed; storage denied / full and 13 bad saved payloads load to a usable roster; every control fires without a page error; the known "Entry 10" numbering fixed; a lenient level parse and index's silent 30 cap queued)
- F cross-page consistency (suite): last —
- G math correctness & pedagogy (surface): last S7 (math-facts.html then math-minute.html: every key right, every deck dealt as documented; Teens Rule 10 + 9 approved; math-minute's "hard" levels, the zero always on top and Level 4's wording queued; G has run on every page)
- H teacher walkthrough (surface): last —
- I first load, saved data & safety (suite): last —
- L metadata & discoverability (suite): last — (runnable since S1: the pages are standalone files)
- M mobile & touch (surface): last —

**Next session (S12):** S6–S11's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7–S11 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S12 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`.
⚑ next: D on math-facts.html — A, B, C and E have run everywhere; every cell left is a never-run tie (D, H, M on each page; F, I, L). D first among them, on math-facts.html (the standard implementation, so what it finds carries to math-minute); F follows, now that five sessions of generator changes have landed on all three pages.
⚑ Queues: index.html — the ops-panel labels (C, S10; displaced this session by the Decimals places), the approved 30-cap note (S11, copy approved), its divisor 3 px low (approved S10), the approved long-header shrink and no zero fraction differences, the lenient grade parse (S11), the per-operation decimal key zeros (S11), the short / across Mixed key division (gate 6 P4). math-minute — the lenient level parse (S11). Three-page approved P3s still waiting: the offline PDF notice wording, JPEG 0.8; the apostrophe escape.
⚑ New probes (S11): `S11-robustness` (`--only`, `--skip-selectors` — the selector sweep is 191 s on index —, `--control`; it is E's audit, rerun it whenever a parser, a storage path or a selector list changes). `S6-math-audit` holds the Decimals type to its places; `S7-facts-audit`'s multiplication family deals zero both ways; `S5-key-rows12`, `S7-bracket-names`, `S8-index-key-division` and `S10-rounding-one-line` replay the Decimals change onto their references; `S10-rounding-one-line` pins its reference to 2b678e1. With S9's and S10's they are arm R's set.
⚑ Micro-feature: skipped at gate 1 for the fourth session (S8–S11); the question now rests under Awaiting — do not ask it each session; build a seed only when the maintainer names one.
