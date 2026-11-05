# MathSheet Improvement Log

The memory of the continuous-improvement loop (`/improveloop`). **Read this first every session**, the
way the skill says (bounded: the handoff, the top Candidates, the headings). One concern per iteration,
one commit per iteration. Prioritization: P1 (data loss, broken generate/print/PDF, wrong answers on a
key, a name reaching HTML unescaped) > P2 (silently wrong output, print/PDF divergence, a11y blockers)
> P3 (performance, dead UI, confusing copy, consistency) > P4 (polish). Tie-breakers: (1) the printed
sheet a student holds, (2) a teacher's saved roster, (3) dual-audience (Jewish day school + secular
classroom) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P3 | math-facts.html | "+10 (Teens Rule)" deals 10 + 0 to 10 + 8 and never 10 + 9 = 19 (`makePlusNFacts` caps every addition fact at 18); approved S7 (gate 2): the +10 level runs to 10 + 9, the other levels keep the cap (decide whether `mix+` and its "64 distinct addition facts" comment take 10 + 9 too) | found S7
- [ ] P3 | index.html | the answer key's division draws its own bar under the red answer, the bracket's stroke running up through it and the divisor beside the answer (the shape 2a74f54 fixed on the standard pages): use the sheet's `mwg-division-problem` with the quotient over the bar, as approved for the twins in S5 (gate 6, "match the sheet") | found S5
- [ ] P3 | index.html | Rounding wraps every problem to two lines (the answer blank takes 60 % of the cell), so its 15 rows run to 806 px, 0.1 in from the paper's edge; approved S4 (gate 6): one line per problem (a shorter answer blank) | found S4
- [ ] P3 | index.html | with 2–5 copies a long description runs under "Worksheet 3 of 5", and a key's "(Key 3 of 5)" is cut by its box (160 of 500 Grade 5 keys; S6: one copy is enough for Division Level 4's key, "— Grade 5" under the branding tag); approved S4 (gate 6): shrink the description's font to fit, as for long names | found S4
- [ ] P3 | index.html, math-minute.html, math-facts.html | `escapeHtml` / `esc()` never escapes the apostrophe on any page (the step replaces `'` with `\u0027`, itself): emit `&#x27;` as CLAUDE.md shows; no exploitable sink today (user values land in text nodes or double-quoted attributes), but the smoke's XSS arm cannot see the gap | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | the printed Student Name holds ~22 characters (18 px bold Arial, ~207 px field) and cuts longer names with "…" ("Bat-Sheva Rivka Gol…"); approved S2 (gate 6): shrink the font to fit the line, short names unchanged; prove with printBoxes and before/after screenshots | found S2
- [ ] P3 | index.html | fraction answer keys write whole-number results as "0/1" and "1/1" and leave improper results unconverted ("4/3" at grade 5; S6: half of grade-5 keys, 3,065 of 6,000); approved S3 (gate 2): whole and mixed numbers on the key (1/1 → 1, 0/1 → 0, 4/3 → 1 1/3); check whether the printed problems share the helper before changing it | found S2
- [ ] P3 | index.html | Fractions: 27 % of subtraction problems are x − x = 0 and 27 % of additions total exactly 1 (both fractions drawn from 1…d−1 independently; d = 2 always gives ½ ± ½): approved S6 (gate 2): subtraction takes away a smaller fraction, addition unchanged | found S6
- [ ] P3 | index.html | the "Decimals" type prints numbers with `a + ""`, dropping trailing zeros: 9 % of grade-5 numbers show no decimal point (68 of 6,000 problems are all-whole, "45 + 7 =") and the grade-6 two-place level shows one place in 9 %: print with `toFixed(pl)` as the per-operation generators do; gate 6 | found S6
- [ ] P3 | index.html, math-minute.html, math-facts.html | offline Save PDF notice, approved S2 (gate 2): replace "PDF library not loaded yet. Please try again in a moment." with "The PDF tools could not be downloaded. Check your connection and try again." (the smoke's offline arm matches /PDF/) | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | PDF JPEG quality 0.92 → 0.8, approved S2 (~20 % smaller, no visible difference at 300 dpi, measured S1); CLAUDE.md's PDF step 4 changes with it; prove with `--cdn` bytes before/after and a zoomed raster | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | no progress during an export (~35 s for 150 pages since S3): one static "Generating PDF, please wait..." box, half scrolled off, until "PDF saved!"; approved S3 (gate 2): "Making your PDF: page 12 of 150..." updated per page, kept in view | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | Save PDF has no re-entrancy guard: a second click during a capture starts a second full pipeline and the button never disables; disable it (or ignore clicks) until "PDF saved!" or the failure notice, re-enabling on both paths | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | advanced-input errors number the raw `;` chunks, and a newline after `;` makes an empty one, so the 6th line of a pasted roster is reported as "Entry 10": number the non-empty entries | found S2
- [ ] P3 | index.html, math-minute.html, math-facts.html | "Generate Advanced Code" opens its panel after the results and the error box, below every generated sheet (3,400 px down after 3 sheets), and scrolls there: put the panel under the button row | found S5
- [ ] P4 | index.html | Save PDF lays the stacked grids at `minmax(…, 1fr)` while print fixes rows-6…12 (rows-3/4/5 are not fixed in index's print block at all): PDF problems sit 5–6 px lower; give the clone print's rows as b8d2304 did on the standard pages | found S4
- [ ] P4 | index.html | restored fraction/decimal entries still render their ops panel twice (`updateOpsPanel`'s defaults, then `renderOpsPanel` with the saved ops — synchronous since S1): pass the saved ops into `updateOpsPanel` | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the fixed 200 ms `setTimeout` before `window.print` is ~200 ms of every Generate & Print and settles nothing (a rAF + `setTimeout(0)` shape measured −120 to −185 ms on index.html); CLAUDE.md documents the 200 ms as the print-flow convention, so the change updates that sentence too | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the PDF stage (`position:absolute; top:0; z-index:-1000`) is on screen: its bottom ~108 px sit in the desktop viewport and the clones flicker there for the whole export; move it off-screen (e.g. `top:-10000px`) and re-prove the PDF bytes | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the 50 ms timer between PDF pages is ~21 % of a 150-page export since S3 (7.5 s of ~35 s); a bare `requestAnimationFrame` swap failed the verifier's paint probe, so the shape needs a wait that still lets the clone paint (a double rAF, measured) | found S1
- [ ] P4 | index.html | a corrupt saved roster (`mwgRosterData_v2` unparsable) falls back to the defaults silently and the bad value is never cleared, so every load repeats the fallback; clear it and say so once (copy → gate 2) | found S1
- [ ] P4 | index.html | `renderMixedCheckboxes` attaches one change listener per checkbox (~36 per render) instead of one delegated handler on the box | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the read-only textarea in the "Generate Advanced Code" modal has no accessible name (the only unnamed field the S0 baseline found): a `<label for>` or `aria-label` | found S0
- [ ] P4 | index.html, math-minute.html, math-facts.html | a `;` in a Standard-form name ("Levi; Dana") splits the line on the Advanced Code round trip (one part skipped, "Dana" printed): Generate Advanced Code should not emit a raw `;` inside a name (the replacement character is a gate-2 question) | found S2
- [ ] P4 | index.html | Integers print negatives with a hyphen ("-7 − (-3) =", 74 % of problems; the key too) beside the U+2212 operator: use U+2212 for the sign | found S6
- [ ] P4 | index.html | Rounding reads "Round 347 to nearest tens" (→ "to the nearest ten") and 3.9 % ask a number below the place ("Round 7 to nearest hundreds" → 0): copy is gate 2, the range pedagogy | found S6
- [ ] P4 | index.html | Scientific-notation keys write "4.5 x 10^4" (ASCII x, caret) beside the sheet's "× 10" with a superscript: render the key with × and `<sup>` | found S6
- [ ] P4 | index.html | descriptions vs generators: "Addition Level 2 (sums 10-20)" never sums past 18 (addends 1–9), "Level 5 (3-digit + any)" and Subtraction 5 never take a 1-digit number; gate 2 | found S6
- [ ] P4 | CLAUDE.md | the Advanced-input parsing comment says "require name" while the standard (and every page) keeps Student Name optional: drop the two words | found S3
- [ ] P4 | math-facts.html, math-minute.html | the worksheet's division divisor sits 3.0 px below the dividend's baseline (`.division-divisor` padding-top 8px): align the baselines (printed layout: gate 6) | found S5
- [ ] P4 | math-facts.html, math-minute.html | dead CSS: `#student-form-title` (no such element) and the `.modal-*` rules (~75 lines; the Advanced Code panel is an inline div): remove | found S5
- [ ] P4 | math-minute.html | Level 12 "Thirty hard multiplication facts" is 1–9 × 6–9: 20 of its 30 facts have a factor 1–5 and 4 are ×1 (13 % of problems); Level 17 "hard division" deals ÷ 6–9 with quotients 1 and 10 (6 ÷ 6, 60 ÷ 6): the word or the range is gate 2 | found S7
- [ ] P4 | math-minute.html | a zero factor always stands on top (0 × 7, never 7 × 0: `multiplicationFacts` starts the second factor at 1), every zero on Levels 11 and 13–15 (13–17 % of problems): start it at 0 where zero is allowed (gate 6) | found S7
- [ ] P4 | math-minute.html | Level 4 "numbers through twenty" never passes 18 (minuends 10–18, single-digit answers), as index's Addition Level 2 stops at 18: wording is gate 2 | found S7

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

## In progress

_(empty — never leave the tree mid-change)_

## Done (last 5 sessions; older rows move to the archive)

- [x] S7 | 2026-11-05 | cfa5cd6 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S7-skipped-list.mjs | the "Some entries were skipped" box stands above the sheets and a Generate that skipped an entry lands on it (it sat 16,560 px down after 20 sheets, below the scroll target) | probe at 1280 / 390 px on each page: in view, above the first sheet, still before the results after print; 18 checks fail on the old pages; smoke
- [x] S7 | 2026-11-05 | f48b8db | index.html, scripts/loop/probes/S7-bracket-names.mjs | Advanced Input checks the names inside brackets: an unknown operation or a type the grade lacks skips the entry with "invalid type for grade G: <name>"; a stray "|" is ignored | probe: 6 bad entries skipped and named, 7 valid brackets byte-identical to the old page (seeded); control fails 2; roster-subset, S5-mixed-ops, S6-math-audit, smoke
- [x] S7 | 2026-11-05 | 8c9bfd3 | math-facts.html, CLAUDE.md, scripts/loop/probes/S6-header-line.mjs | micro-feature (gate 1): the optional "Header line" on math-facts, line for line math-minute's (S6); the probe takes `--page` | probe on math-facts: blank byte-identical to f48b8db, 8 of 8 carry it escaped, print 1056×816 with 46+ px paper left, PDF clones within 1.0 px, old payload loads; control fails; settings and sheet screenshots
- [x] S7 | 2026-11-05 | — | scripts/loop/probes/S7-facts-audit.mjs, docs/IMPROVEMENT_LOG.md | pass G on math-facts, then math-minute (clean, so it bought the second): 674,000 problems, every key right, every deck dealt as documented; gates: micro-feature → header line on math-facts (shipped); Teens Rule → include 10 + 9 (approved Candidate) | probe green on both pages; `--control` fails 7 checks on each
- [x] S6 | 2026-11-05 | b1e456f | index.html | Division Levels 3–4 ("2-digit ÷ 1-digit") print 2-digit dividends over 2-digit quotients, every such problem equally likely (85 % had 3-digit dividends; gate 2/6, approved) | S6-math-audit: off its label 7,589 + 7,696 of 9,000 → 0, keys recompute; before/after key screenshots; smoke
- [x] S6 | 2026-11-05 | dd8609a | index.html, scripts/loop/probes/ | the header and key state the count printed: "60 Fractions" over 30 problems (Advanced, or Mixed → Deselect All → 60) now reads 30 (gate 2, approved); adds `S6-math-audit`; `S5-key-rows12` replays S6's generator changes onto its reference | count ≠ description 4,050 of 10,200 audit sheets → 0; control fails 2 checks; S5-key-rows12 0 of 152 differ; smoke
- [x] S6 | 2026-11-05 | 4f7d68c | math-minute.html, CLAUDE.md, scripts/loop/probes/S6-header-line.mjs | micro-feature (gate 1): optional "Header line" (≤ 80 chars, dir=auto, escaped, saved as `headerLine`) printed under the header of every sheet and key; blank prints nothing | probe: blank byte-identical to dd8609a, print 1056×816 with 46+ px paper left, PDF clones within 1.0 px, old payload loads; control fails; UI 1280/800 and sheet screenshots
- [x] S6 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | gates: Division 3–4 → 2-digit dividends; header count → the real count (both shipped); fraction subtraction → no zero answers (approved Candidate); micro-feature → Custom header line on math-minute (shipped; seed split to math-facts) | ledger
- [x] S5 | 2026-11-05 | 2a74f54 | math-facts.html, math-minute.html | the answer key's division is the sheet's own problem (same bracket, same place in the cell) with the quotient in red over the bar; it drew a bar under the answer, the bracket's stroke through it and the divisor beside it (gate 6, approved) | probe: 805 cells on every division level match the sheet within 0.5 px, quotients right and above the bar; control fails; real Save PDF rasters; before/after screenshots
- [x] S5 | 2026-11-05 | 6011727 | math-facts.html, math-minute.html | one 7.2 px gap between the sign and any bottom number ("×12" sat 2 px from its sign, "× 7" 7.2 px); one-digit problems unchanged (gate 6, approved) | probe: every level of both pages with keys, 5,040 stacks, every gap 7.2 px, one-digit signs within 0.1 px; control fails; before/after screenshot
- [x] S5 | 2026-11-05 | 5c3b01a | index.html | a Mixed entry keeps its chosen fraction / decimal operations after Duplicate and a saved-roster reload (all eleven came back ticked and printed); a bare "fractions" / "decimals" still means every operation | probe by real clicks: subset kept, reloaded sheet 0 ÷/− (15 before); control fails 3; roster-subset and S4 probes, smoke
- [x] S5 | 2026-11-05 | b981031 | index.html | answer keys of 60 wide problems (rows-12): the key drops its lines' minimum heights and sets answers at 15 px, so no answer overprints the number below; worksheets and other keys unchanged (S4 gate 6) | probe (seeded, glyph ink): 2,640 cells, smallest gap −3.4 → 2.6 px, ink to 790 of 816; 152 other sheets byte-identical; control fails; before/after screenshot
- [x] S5 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | gates: key division → match the sheet; sign spacing → same gap (both shipped); micro-feature skipped; the hidden error list (P2, three pages) and index's key division wait on index's two-touch cap | ledger
- [x] S4 | 2026-11-05 | 7774975 | index.html | Grade 5–8 Mixed sheets (any pool with fractions, decimals, rounding …) write their stacked problems across ("844 × 6 =") on the sheet and the key; stacked, they overprinted each other in the 2-column grid (gate 6, approved) | seeded: 218 stacks in the across grid → 0; 46 Mixed sheets 0 overlaps (7–25 each before); 266 other sheets byte-identical; before/after screenshots; probe
- [x] S4 | 2026-11-05 | 2d59570 | index.html | Save PDF lets a full written-across page run past the body as print does: Rounding's problems 29–30 and Long Division's last dividends were cut from the PDF | seeded 16-page export: pixels change only below y 792, Rounding bottom band 0 → 738 dark px (print 785), 7 pages identical, print path identical; probe; smoke `--cdn`
- [x] S4 | 2026-11-05 | b8d2304 | math-minute.html, math-facts.html, CLAUDE.md | Save PDF lays the rows at print's fixed heights (the clone's 1fr rows set problems 4–19 px low, the S2 P4); CLAUDE.md's PDF step 3 says so | ruled lines 1–2 px from print on every row (was 4–19, growing); print path identical; probe; smoke `--cdn`
- [x] S4 | 2026-11-05 | 5c70de2 | scripts/loop/probes/S4-pdf-print-parity.mjs | offline probe (stubbed cdnjs libraries): Save PDF mirrors print on all three pages, Mixed writes stacks across | green on HEAD; `--control` (the pre-S4 pages) fails 4 checks
- [x] S4 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | gates: Mixed 5–8 → write across (shipped); key spacing, Rounding one line, long-header shrink → approved Candidates; micro-feature skipped; 4th slot unused (every remaining candidate touches index.html, on its cap) | ledger
- [x] S3 | 2026-11-05 | ad456d2 | math-facts.html, math-minute.html, CLAUDE.md, scripts/loop/harness.mjs, scripts/loop/smoke.mjs | Advanced Input reads "Last, First" names: a line with more than 3 fields takes all but the last two as the name (the S2 rule), so "Cohen, Avi" survives the Generate Advanced Code round trip | scratch probe: 6 paste cases + the round trip on both pages, failing 6 of 8 checks on the old pages; the smoke's advanced arm now prints "Cohen, Avi" (2 failing on the old page)
- [x] S3 | 2026-11-05 | 6ada9ea | index.html, math-minute.html, math-facts.html, CLAUDE.md | Save PDF skips the results container in html2canvas's per-page document copy (`ignoreElements`): 150 pages 127 → 36 s (math-minute), 107 → 35 s (math-facts), 123 → 35 s (index); 30 pages 11.6 → 7.7 s | seeded problems, 20 pages with keys per page: every page raster pixel-identical to HEAD's, also scrolled to the bottom mid-export; smoke `--cdn`
- [x] S3 | 2026-11-05 | 3575eed | index.html, CLAUDE.md, scripts/loop/harness.mjs | the same comma-name rule on the 5-field parser (all but the last four fields); bracket lists are `|`-separated and still parse, a bracket typed with commas is still reported | scratch probe on index (the round trip, mixed/fractions/decimals brackets); smoke advanced arm fails on the old page, passes now; roster-subset probe green
- [x] S3 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md, docs/IMPROVEMENT_ARCHIVE.md | gates: micro-feature skipped (every page's two touches went to the fixes); PDF progress wording approved; fraction keys → whole and mixed numbers; the S0 "Math Minute builds 9,000 extra nodes" candidate struck as refuted (archive) | ledger

## Metrics

### Per-session log (one line per session; last 20)

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
| A | S1 | S3 | — |
| B | S4 | — | S2 |
| C | — | — | S5 |
| D | — | — | — |
| G | S6 | S7 | S7 |
| H | — | — | — |
| M | — | — | — |

### Discovery-pass rotation (one per session, stalest first; `node scripts/loop/coverage.mjs` picks)

- A performance & speed (surface): last S3 (math-minute.html: the S0 node-count lead refuted; generate, form, load and memory fine; Save PDF 127 s for 150 pages → 36 s, fixed on all pages; A-next: math-facts.html, the twin of math-minute)
- B print & export (surface): last S4 (index.html: Mixed 5–8 overprint, the PDF's cut last row and the standard pages' PDF rows fixed; queued: Mixed ops lost on reload and the 60-problem key overprint (P2), Rounding one line, long headers)
- C aesthetics (surface): last S5 (math-facts.html: answer-key division and the sign gap fixed on both standard pages; the skipped-entries list and the Advanced Code panel open below every sheet on all three pages; UI type scale, buttons and the 800 px layout fine)
- D accessibility (surface): last —
- E errors & robustness (suite): last —
- F cross-page consistency (suite): last —
- G math correctness & pedagogy (surface): last S7 (math-facts.html then math-minute.html: every key right, every deck dealt as documented; Teens Rule 10 + 9 approved; math-minute's "hard" levels, the zero always on top and Level 4's wording queued; G has run on every page)
- H teacher walkthrough (surface): last —
- I first load, saved data & safety (suite): last —
- L metadata & discoverability (suite): last — (runnable since S1: the pages are standalone files)
- M mobile & touch (surface): last —

**Next session (S8):** S6's and S7's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S8 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`.
⚑ next: B on math-minute.html — every cell left is a never-run tie and the maintainer's priorities rank B first; math-minute is the one page B has never audited, and its header changed in S5 (key division) and S6 (header line). A on math-facts would re-measure math-minute's twin (S3); E is the strongest never-run suite cell.
⚑ Queues: index.html's two touches went to S7's fixes; its approved P3s wait (fraction keys as whole / mixed numbers, no zero fraction differences, key division like the sheet, Rounding one line, long headers shrink). math-facts: the approved Teens Rule 10 + 9 (one touch).
⚑ New probes (S7): `S7-facts-audit` (`--page math-minute.html`, `--n`, `--only`, `--control`; ~2 min at 200 a level), `S7-skipped-list`, `S7-bracket-names`; `S6-header-line` takes `--page math-facts.html`. With S6's they are arm R's set. The blank / valid-bracket identity arms compare with fixed commits (S6-header-line: dd8609a, f48b8db; S7-bracket-names: cfa5cd6): a session that changes what those sheets hold moves the ref or replays the change, as `S5-key-rows12`'s LATER list does.
⚑ Micro-feature: the "Custom header line" seed is done on both standard pages (index.html's waits for its convergence session). Dual-audience seeds next: the Date line, `dir="auto"` on names. Ask gate 1 at S8's selection moment.
