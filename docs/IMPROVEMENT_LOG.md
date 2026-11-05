# MathSheet Improvement Log

The memory of the continuous-improvement loop (`/improveloop`). **Read this first every session**, the
way the skill says (bounded: the handoff, the top Candidates, the headings). One concern per iteration,
one commit per iteration. Prioritization: P1 (data loss, broken generate/print/PDF, wrong answers on a
key, a name reaching HTML unescaped) > P2 (silently wrong output, print/PDF divergence, a11y blockers)
> P3 (performance, dead UI, confusing copy, consistency) > P4 (polish). Tie-breakers: (1) the printed
sheet a student holds, (2) a teacher's saved roster, (3) dual-audience (Jewish day school + secular
classroom) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P2 | index.html, math-minute.html, math-facts.html | the "Some entries were skipped" list (`#errors` / `#mwgErrors`) sits below every generated sheet: after 20 sheets it is at y 9,735 px while the page scrolls to the results' top (1,455), so a skipped student is missing from the class set with the reason out of sight: show the box above the results (and in view) | found S5
- [ ] P3 | index.html | the answer key's division draws its own bar under the red answer, the bracket's stroke running up through it and the divisor beside the answer (the shape 2a74f54 fixed on the standard pages): use the sheet's `mwg-division-problem` with the quotient over the bar, as approved for the twins in S5 (gate 6, "match the sheet") | found S5
- [ ] P3 | index.html | Rounding wraps every problem to two lines (the answer blank takes 60 % of the cell), so its 15 rows run to 806 px, 0.1 in from the paper's edge; approved S4 (gate 6): one line per problem (a shorter answer blank) | found S4
- [ ] P3 | index.html | with 2–5 copies a long description runs under "Worksheet 3 of 5", and a key's "(Key 3 of 5)" is cut by its box (160 of 500 Grade 5 keys); approved S4 (gate 6): shrink the description's font to fit, as for long names | found S4
- [ ] P3 | index.html, math-minute.html, math-facts.html | `escapeHtml` / `esc()` never escapes the apostrophe on any page (the step replaces `'` with `\u0027`, itself): emit `&#x27;` as CLAUDE.md shows; no exploitable sink today (user values land in text nodes or double-quoted attributes), but the smoke's XSS arm cannot see the gap | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | the printed Student Name holds ~22 characters (18 px bold Arial, ~207 px field) and cuts longer names with "…" ("Bat-Sheva Rivka Gol…"); approved S2 (gate 6): shrink the font to fit the line, short names unchanged; prove with printBoxes and before/after screenshots | found S2
- [ ] P3 | index.html | fraction answer keys write whole-number results as "0/1" and "1/1" and leave improper results unconverted ("4/3" at grade 5); approved S3 (gate 2): whole and mixed numbers on the key (1/1 → 1, 0/1 → 0, 4/3 → 1 1/3); check whether the printed problems share the helper before changing it | found S2
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
- [ ] P4 | CLAUDE.md | the Advanced-input parsing comment says "require name" while the standard (and every page) keeps Student Name optional: drop the two words | found S3
- [ ] P4 | math-facts.html, math-minute.html | the worksheet's division divisor sits 3.0 px below the dividend's baseline (`.division-divisor` padding-top 8px): align the baselines (printed layout: gate 6) | found S5
- [ ] P4 | math-facts.html, math-minute.html | dead CSS: `#student-form-title` (no such element) and the `.modal-*` rules (~75 lines; the Advanced Code panel is an inline div): remove | found S5

## Feature seeds (micro-features: one page, ≤ ~150 lines, no dependency; selection is gate 1)

- [ ] seed | math-minute.html, math-facts.html | "Custom header line": an optional free-text line printed under the title on every sheet (a week, a unit, a parasha), escaped, saved in the roster payload, blank by default | from S0
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
- [x] S2 | 2026-11-05 | 48a610d | index.html, math-minute.html, math-facts.html, scripts/loop/smoke.mjs, CLAUDE.md | `@page{size:11in 8.5in landscape}` is invalid CSS and every page's rule was dropped (Chrome's dialog fell back to portrait; on A4 landscape each sheet split in two, its problems lost): now `size:11in 8.5in` | smoke paper arm fails on the old pages (612×792; A4 12 pages for 6 sheets), passes now (792×612; 6 for 6); rendered print, A4 and Save PDF pages
- [x] S2 | 2026-11-05 | fb36ea5 | math-minute.html, math-facts.html, scripts/loop/smoke.mjs | the printed and PDF'd header (labels, name, description) was Times New Roman: the font lived on the app wrapper the sheets leave for print and the PDF stage; `.worksheet` now carries Arial | smoke font arm fails on both pages before, passes on all three; geometry audit 100 + 104 sheets, 0 clipped; before/after header screenshots
- [x] S2 | 2026-11-05 | 7e0e32f | index.html | `content-visibility:auto` on the sheets: 150-sheet Generate handler add2 220 → 33 ms, fractions 433 → 47 ms (300 with the key: 675 → 71, 862 → 69) | medians of 3; scrollY, printBoxes, print PDF 150 pages, Save PDF 24 pages with the same per-page ink, last sheet renders at 1280 / 800 px; smoke
- [x] S2 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | gates answered: comma names → read extra fields as the name; long names → shrink to fit; offline PDF wording and JPEG 0.8 approved (the two S1 Awaiting items resolved); all four are approved Candidates; no micro-feature offered (every page on its cap) | ledger
- [x] S2 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | `esc()` apostrophe candidate withheld: the standard pages' `escapeHtml` carries the same no-op, so it is a three-page fix the caps did not allow; rewritten as one | ledger
- [x] S1 | 2026-11-04 | 0ff238e | math-minute.html, math-facts.html | `content-visibility:auto` on the worksheets: the 150-sheet Generate handler 156 → 26 ms / 162 → 24 ms, the two 150–210 ms long tasks gone; the print block forces `visible` | printBoxes 150 sheets at 1056×816 (0 off), page.pdf 150 pages, scroll position and Save PDF size unchanged, screenshots 1280 / 800 px, smoke + `--cdn`
- [x] S1 | 2026-11-04 | 9304f31 | index.html, math-minute.html, math-facts.html, scripts/loop/smoke.mjs, CLAUDE.md | the two PDF libraries (135 KB wire) load on the first Save PDF click, not with the page: first roster entry at 1.5 Mbps 906 → 624 / 895 → 372 / 896 → 398 ms, 0 cdnjs requests on load | smoke arm 8 green on all pages (it failed before), `--cdn` saves a real 3-page PDF on each, offline click → notice → online click → PDF
- [x] S1 | 2026-11-04 | 62e6338 | index.html, scripts/loop/probes/roster-subset.mjs | two P2s: Fill Down dropped Student 1's fraction/decimal ops and mixed subset (the filled entries' ops panel was dead, sheets printed every operation), and a saved or duplicated grade ≥ 5 mixed student came back at count 30 instead of 40/50/60 | probe green; its `--control` run of the old page fails 6 of 9 checks; smoke
- [x] S1 | 2026-11-04 | — | docs/IMPROVEMENT_LOG.md | gates: micro-feature skipped (maintainer's answer); index.html convergence = one dedicated approved session (Awaiting item rewritten); fourth fix withheld — every page had taken its two iterations | ledger
- [x] S1 | 2026-11-04 | — | docs/IMPROVEMENT_LOG.md, .claude/skills/improveloop/SKILL.md | maintainer answered two Awaiting questions: the pages are standalone files (pass L unblocked; `<head>` edits reach production) and the loop pushes straight to `main` (S0's branch fast-forwarded into main) | ledger + skill updated, check-ledger ok

## Metrics

### Per-session log (one line per session; last 20)

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
| G | — | — | — |
| H | — | — | — |
| M | — | — | — |

### Discovery-pass rotation (one per session, stalest first; `node scripts/loop/coverage.mjs` picks)

- A performance & speed (surface): last S3 (math-minute.html: the S0 node-count lead refuted; generate, form, load and memory fine; Save PDF 127 s for 150 pages → 36 s, fixed on all pages; A-next: math-facts.html, the twin of math-minute)
- B print & export (surface): last S4 (index.html: Mixed 5–8 overprint, the PDF's cut last row and the standard pages' PDF rows fixed; queued: Mixed ops lost on reload and the 60-problem key overprint (P2), Rounding one line, long headers)
- C aesthetics (surface): last S5 (math-facts.html: answer-key division and the sign gap fixed on both standard pages; the skipped-entries list and the Advanced Code panel open below every sheet on all three pages; UI type scale, buttons and the 800 px layout fine)
- D accessibility (surface): last —
- E errors & robustness (suite): last —
- F cross-page consistency (suite): last —
- G math correctness & pedagogy (surface): last —
- H teacher walkthrough (surface): last —
- I first load, saved data & safety (suite): last —
- L metadata & discoverability (suite): last — (runnable since S1: the pages are standalone files)
- M mobile & touch (surface): last —

**Next session (S6):** S2–S5's commits reached `main` on the maintainer's word after S5 ("Push to main"; `main` fast-forwarded from 6b0503a to the branch `claude/fervent-lovelace-urwaob`), which lifts the S2 branch-only instruction: from S6 the loop commits and pushes straight to `main` again (skill, session-start step 5). Check `git log origin/main` first.
⚑ next: G on index.html — every cell left is a never-run tie and each of A, B and C has now run; A or B on the remaining pages would re-audit twins (S2 measured math-minute's 21 levels on paper, S3 equal nodes per cell, S4 both PDFs) and C's shared CSS was audited on math-facts in S5 (index's UI waits on its convergence session), while G has never run, a wrong key answer is a P1, and index holds the suite's hardest arithmetic (fractions, decimals, rounding, order of operations) with a fraction-key candidate already queued.
⚑ Top of the queue: the skipped-entries list hidden under the sheets (P2, all three pages, one touch each) and index's key division (P3, the S5 "match the sheet" answer; the shape is in 2a74f54). Both spend an index touch, as would Rounding one line and the long headers (approved S4): plan index's two touches first.
⚑ New probes (S5): `S5-key-division`, `S5-sign-gap`, `S5-mixed-ops`, `S5-key-rows12`; with `S4-pdf-print-parity` they are arm R's set. Ink is measured from the glyphs (canvas `measureText`), not text rects: S4's "8.4 px" overprint was −3.4 px of real ink (`docs/loop-findings.md` → S5).
⚑ Micro-feature: skipped in S1, S3, S4 and S5 (S5: to keep the session for fixes); ask gate 1 again at S6's selection moment.
