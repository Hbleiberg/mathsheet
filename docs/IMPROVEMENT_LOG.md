# MathSheet Improvement Log

The memory of the continuous-improvement loop (`/improveloop`). **Read this first every session**, the
way the skill says (bounded: the handoff, the top Candidates, the headings). One concern per iteration,
one commit per iteration. Prioritization: P1 (data loss, broken generate/print/PDF, wrong answers on a
key, a name reaching HTML unescaped) > P2 (silently wrong output, print/PDF divergence, a11y blockers)
> P3 (performance, dead UI, confusing copy, consistency) > P4 (polish). Tie-breakers: (1) the printed
sheet a student holds, (2) a teacher's saved roster, (3) dual-audience (Jewish day school + secular
classroom) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P2 | math-facts.html, math-minute.html | Advanced Code round trip drops "Last, First" names: "Cohen, Avi" exports as 4 fields and is skipped on paste, "Levi; Dana" prints as "Dana"; approved S2: a line with more than 3 fields reads all but the last two as the name (CLAUDE.md's "exactly 3 fields" changes in the same commit); index.html's 5-field parser is as strict — check its brackets first | found S2
- [ ] P3 | index.html, math-minute.html, math-facts.html | `escapeHtml` / `esc()` never escapes the apostrophe on any page (the step replaces `'` with `\u0027`, itself): emit `&#x27;` as CLAUDE.md shows; no exploitable sink today (user values land in text nodes or double-quoted attributes), but the smoke's XSS arm cannot see the gap | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | the printed Student Name holds ~22 characters (18 px bold Arial, ~207 px field) and cuts longer names with "…" ("Bat-Sheva Rivka Gol…"); approved S2 (gate 6): shrink the font to fit the line, short names unchanged; prove with printBoxes and before/after screenshots | found S2
- [ ] P3 | index.html, math-minute.html, math-facts.html | offline Save PDF notice, approved S2 (gate 2): replace "PDF library not loaded yet. Please try again in a moment." with "The PDF tools could not be downloaded. Check your connection and try again." (the smoke's offline arm matches /PDF/) | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | Save PDF is superlinear: html2canvas clones the whole document for every page, so a 150-page export takes 114 s instead of ~42 s; pass `ignoreElements` (skip the results container and the app) or capture inside an isolated container so each page clones only its sheet; prove with 3 / 24 / 72-page timings | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | Save PDF has no re-entrancy guard: a second click during a capture starts a second full pipeline and the button never disables; disable it (or ignore clicks) until "PDF saved!" or the failure notice, re-enabling on both paths | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | PDF JPEG quality 0.92 → 0.8, approved S2 (~20 % smaller, no visible difference at 300 dpi, measured S1); CLAUDE.md's PDF step 4 changes with it; prove with `--cdn` bytes before/after and a zoomed raster | found S1
- [ ] P3 | index.html, math-minute.html, math-facts.html | advanced-input errors number the raw `;` chunks, and a newline after `;` makes an empty one, so the 6th line of a pasted roster is reported as "Entry 10": number the non-empty entries | found S2
- [ ] P3 | index.html | fraction answer keys write whole-number results as "0/1" and "1/1" and leave improper results unconverted ("4/3" at grade 5): pass G's first lead on index.html (the mixed-number convention is a gate-2 question) | found S2
- [ ] P3 | index.html, math-minute.html, math-facts.html | no progress during a 30–400 s export: one static "Generating PDF, please wait..." box (half scrolled off) until "PDF saved!"; update it per page ("page 12 of 150") — a copy change, gate 2 | found S1
- [ ] P3 | math-minute.html | for the same 150-sheet roster Math Minute builds 38,467 DOM nodes in 870 ms where Math Facts builds 29,774 in 617 ms: find what it renders extra per cell or per sheet and trim it (measure first: `smoke.mjs --json` method, 3 runs, medians) | found S0
- [ ] P4 | math-minute.html, math-facts.html | Save PDF lays the rows out at 1fr while print uses fixed rows (2.4 / 1.8 / 1.44 / 1.2 in), so every problem sits 11–18 px lower in the PDF than on paper and print leaves ~20 px blank at the bottom: give the PDF clone the print row heights (CLAUDE.md: the PDF mirrors print) | found S2
- [ ] P4 | index.html | restored fraction/decimal entries still render their ops panel twice (`updateOpsPanel`'s defaults, then `renderOpsPanel` with the saved ops — synchronous since S1): pass the saved ops into `updateOpsPanel` | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the fixed 200 ms `setTimeout` before `window.print` is ~200 ms of every Generate & Print and settles nothing (a rAF + `setTimeout(0)` shape measured −120 to −185 ms on index.html); CLAUDE.md documents the 200 ms as the print-flow convention, so the change updates that sentence too | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the PDF stage (`position:absolute; top:0; z-index:-1000`) is on screen: its bottom ~108 px sit in the desktop viewport and the clones flicker there for the whole export; move it off-screen (e.g. `top:-10000px`) and re-prove the PDF bytes | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the 50 ms timer between PDF pages is ~24 % of a 150-page export (7.5 s); a bare `requestAnimationFrame` swap failed the verifier's paint probe, so the shape needs a wait that still lets the clone paint (a double rAF, measured) | found S1
- [ ] P4 | index.html | a corrupt saved roster (`mwgRosterData_v2` unparsable) falls back to the defaults silently and the bad value is never cleared, so every load repeats the fallback; clear it and say so once (copy → gate 2) | found S1
- [ ] P4 | index.html | `renderMixedCheckboxes` attaches one change listener per checkbox (~36 per render) instead of one delegated handler on the box | found S1
- [ ] P4 | index.html, math-minute.html, math-facts.html | the read-only textarea in the "Generate Advanced Code" modal has no accessible name (the only unnamed field the S0 baseline found): a `<label for>` or `aria-label` | found S0

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
- [x] S0 | 2026-11-04 | e64166f | .claude/skills/improveloop/, docs/, scripts/loop/ | bootstrap: the skill, the ledger, the passes reference, the findings file, the harness, the smoke, the ledger checks | smoke 0 failing on 3 pages (7 arms each, PDF arm on math-facts); planted escapeHtml defect fails 2 arms; check-inline-js 3/3

## Metrics

### Per-session log (one line per session; last 20)

- S2 | 2026-11-05 | pass B on math-facts.html (geometry 100 sheets, real PDF rasters, A4, font census, advanced round trip) | fixes 3 (two P2 print defects, one P3; on branch claude/fervent-lovelace-urwaob, not main) | smoke 3/3 green + `--cdn` | every page ended on its two-touch cap
- S1 | 2026-11-04 | pass A on index.html (6 measured arms + a critic; 24 findings, all verified real) | fixes 3 (two P2 + two P3 in 3 commits, all pushed to main) | smoke 3/3 green + `--cdn` | 4th fix blocked by the 2-per-page cap
- S0 | 2026-11-04 | bootstrap | pass — | fixes 0 | smoke 3/3 green | baselines in loop-findings S0

### Surface coverage (surface passes × pages — the session that last audited the cell, or —)

| pass | index.html | math-minute.html | math-facts.html |
|---|---|---|---|
| A | S1 | — | — |
| B | — | — | S2 |
| C | — | — | — |
| D | — | — | — |
| G | — | — | — |
| H | — | — | — |
| M | — | — | — |

### Discovery-pass rotation (one per session, stalest first; `node scripts/loop/coverage.mjs` picks)

- A performance & speed (surface): last S1 (index.html: 24 verified findings, 3 fixes shipped, 10 candidates filed; A-next: math-minute.html — the S0 node-count candidate)
- B print & export (surface): last S2 (math-facts.html: 2 P2 shipped — the invalid @page size on all pages, the serif print header on both standard pages; 7 candidates filed)
- C aesthetics (surface): last —
- D accessibility (surface): last —
- E errors & robustness (suite): last —
- F cross-page consistency (suite): last —
- G math correctness & pedagogy (surface): last —
- H teacher walkthrough (surface): last —
- I first load, saved data & safety (suite): last —
- L metadata & discoverability (suite): last — (runnable since S1: the pages are standalone files)
- M mobile & touch (surface): last —

**Next session (S3):** S2's commits (48a610d, fb36ea5, 7e0e32f and the close-out) are on branch `claude/fervent-lovelace-urwaob`, NOT on `main`: the maintainer asked that nothing reach `main` until they say. Check `git log origin/main` first; if main still lacks them and no word has come, work on a branch again and do not push to main.
⚑ next: A on math-minute.html
⚑ Four Candidates carry the maintainer's S2 approval (comma names, long-name shrink-to-fit, offline PDF wording, JPEG 0.8): no gate needed. The comma-name P2 is the top fix and changes CLAUDE.md's "exactly 3 fields" sentence in the same commit.
⚑ The smoke gained two arms in S2: paper (Chromium's print PDF is one 792×612 pt page per sheet, also on A4) and font (every worksheet text is Arial in print and in a PDF-stage clone). Probe trap: `page.pdf()` renders screen CSS after `emulateMedia('screen')` — re-emulate print first.
⚑ The apostrophe, offline-wording and JPEG fixes are each the same diff on three pages: one commit spends one touch per page. S1 and S2 both ended on the cap — plan the page budget before the second fix.
⚑ Pass B's math-facts measurements (geometry per level class, print vs PDF parity, raster legibility, A4) are in `docs/loop-findings.md` → S2; B is still never-run on index.html and math-minute.html, though the new smoke arms already cover paper size and font there.
⚑ Micro-feature: none offered in S2 (caps); ask gate 1 at S3's selection moment.
