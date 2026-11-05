# MathSheet Improvement Archive

Append-only history of the improvement loop: Done entries older than the ledger's last five sessions,
struck candidates and seeds (with why), previous handoffs, and full text the ledger truncated.
Grep it; never read it whole. The live state is `docs/IMPROVEMENT_LOG.md`.

## S0 (2026-11-04) — bootstrap
- The loop was created from the Hebrew Blender (IvritSuite) loop's protocol, scaled to three pages:
  the skill, this archive, the ledger, `docs/loop-passes.md`, `docs/loop-findings.md`, and
  `scripts/loop/` (harness, smoke, inline-JS check, ledger check, coverage, closeout).

## S1 (2026-11-04) — pass A on index.html; three fixes
- Pass A ran as six measured arms (load, generate, PDF, roster, saved data, static) with every finding
  adversarially re-measured by an independent verifier, then a completeness critic; 24 findings, all
  real. Fixes: the Fill Down / saved-mixed-count P2 pair on `index.html` (62e6338, probe
  `scripts/loop/probes/roster-subset.mjs`), the lazy PDF libraries on all three pages (9304f31),
  `content-visibility:auto` on the standard pages' worksheets (0ff238e).
- Gates: micro-feature — skip this session; index.html convergence — "converge, including the font,
  in one dedicated session" (with before/after screenshots for approval first).
- Previous handoff (S0 → S1), verbatim:
  **Next session (S1):** the first real session. Everything is never-run, so the pointer breaks the tie toward the maintainer's first priority.
  ⚑ next: A on index.html
  ⚑ Read *Awaiting the maintainer* first and ask its three questions at the first gate moment (one call); the hosting answer decides L and the CDN candidate's shape (an embedded page may already defer scripts).
  ⚑ The top Candidate (lazy-load the PDF libraries) is A's natural first fix after the pass; prove it by the PDF arm (`smoke.mjs --cdn`) on all three pages plus the no-CDN notice path.
  ⚑ Baselines to compare against: `docs/loop-findings.md` → S0.

## S2 (2026-11-05) — pass B on math-facts.html; three fixes (on a branch)
- Worked on branch `claude/fervent-lovelace-urwaob` at the maintainer's request ("don't push to main
  until I say"), diverging from the skill's push-to-main step for this session only.
- Pass B ran as scratch probes (geometry per level class with print-vs-PDF-clone parity, a real Save PDF
  rasterized against Chromium's print PDF, A4, a font census, the Advanced Code round trip, long names).
  Fixes: the invalid `@page` size on all three pages (48a610d), the serif print/PDF header on both
  standard pages (fb36ea5), `content-visibility:auto` on index.html's sheets (7e0e32f, an S1 candidate).
- The S1 candidate "esc() apostrophe, index.html" was widened: the standard pages' `escapeHtml` has the
  same no-op step, so it is a three-page fix; withheld because the caps had no room.
- Gates (one call at close-out): comma names → read extra fields as the name; long names → shrink to
  fit; offline PDF wording → approved; JPEG 0.92 → 0.8 → approved. The two S1 Awaiting items left the
  ledger as approved Candidates. No micro-feature offered (every page had taken its two iterations).
- Screenshots delivered in-session (not committed): print before/after (portrait / A4 split / Save PDF
  vs landscape / A4 scaled / Save PDF) and the printed header before/after (Times → Arial, long names).
- Previous handoff (S1 → S2), verbatim:
  **Next session (S2):** every cell but A/index.html is still never-run, so the pointer breaks the tie; the maintainer's order is A → B → C and the PDF candidates A filed (superlinear clone, no re-entrancy guard, no progress) are B's paper-and-export territory, best fixed first on the reference page.
  ⚑ next: B on math-facts.html
  ⚑ Run `node scripts/loop/smoke.mjs --cdn` at the start: S1 changed how the PDF libraries load on all three pages (lazy, on the first Save PDF click) and the PDF arm now probes cdnjs reachability itself.
  ⚑ The top three Candidates are all small: the `esc()` apostrophe (one line), `content-visibility` on index.html (two CSS lines, the standard pages' commit 0ff238e is the template), and the Save PDF `ignoreElements` clone fix (measure 3 / 24 / 72 pages before and after).
  ⚑ The variety governor ended S1 at three fixes: with three pages and a cap of two iterations per page, a fix shipped on all three pages at once spends one touch on each. Plan the fourth fix's page before the second.
  ⚑ Pass A's measurements and refutations for index.html (no memory leak, the 50 ms poll never runs, the form stays responsive with 300 sheets, the print-media layout bound) are in `docs/loop-findings.md` → S1; do not re-measure them.
  ⚑ Gate answers on file: no micro-feature was wanted in S1 (ask again at S2's selection moment); index.html convergence is a dedicated session (see Awaiting) — F never converges it.

## S3 (2026-11-05) — pass A on math-minute.html; three fixes (on a branch)
- Worked on branch `claude/fervent-lovelace-urwaob` again: the S2 instruction ("don't push to main until
  I say") stands, and no word came; main is still at 6b0503a.
- Pass A ran as scratch probes (node census against math-facts at equal cell counts, 150-sheet generate
  per level shape at cpu1 / cpu4, the roster form at 30 students with and without 150 sheets, cold and
  saved-roster load, retention over 6 generates, Save PDF per page to 150 pages with html2canvas's own
  phase log). Fixes: comma names on the standard pages (ad456d2) and on index.html (3575eed), the Save PDF
  document-copy scope on all three pages (6ada9ea, an S1 candidate).
- Struck as refuted (S0 candidate, verbatim): `- [ ] P3 | math-minute.html | for the same 150-sheet roster Math Minute builds 38,467 DOM nodes in 870 ms where Math Facts builds 29,774 in 617 ms: find what it renders extra per cell or per sheet and trim it (measure first: `smoke.mjs --json` method, 3 runs, medians) | found S0`
  — why: S0 compared level 5 (40 problems a sheet) with `+3` (30). At equal counts both pages build 292
  nodes per 30-cell sheet and 382 per 40-cell sheet (9 per stacked cell, 7 per division cell).
- Gates (one call at the selection moment): micro-feature → skip (every page's two touches were planned
  for the fixes); PDF progress wording → approved; fraction answer keys → whole and mixed numbers. No
  screenshots this session (no visual change: the PDFs are pixel-identical, the names fix is input-side).
- Previous handoff (S2 → S3), verbatim:
  **Next session (S3):** S2's commits (48a610d, fb36ea5, 7e0e32f and the close-out) are on branch `claude/fervent-lovelace-urwaob`, NOT on `main`: the maintainer asked that nothing reach `main` until they say. Check `git log origin/main` first; if main still lacks them and no word has come, work on a branch again and do not push to main.
  ⚑ next: A on math-minute.html
  ⚑ Four Candidates carry the maintainer's S2 approval (comma names, long-name shrink-to-fit, offline PDF wording, JPEG 0.8): no gate needed. The comma-name P2 is the top fix and changes CLAUDE.md's "exactly 3 fields" sentence in the same commit.
  ⚑ The smoke gained two arms in S2: paper (Chromium's print PDF is one 792×612 pt page per sheet, also on A4) and font (every worksheet text is Arial in print and in a PDF-stage clone). Probe trap: `page.pdf()` renders screen CSS after `emulateMedia('screen')` — re-emulate print first.
  ⚑ The apostrophe, offline-wording and JPEG fixes are each the same diff on three pages: one commit spends one touch per page. S1 and S2 both ended on the cap — plan the page budget before the second fix.
  ⚑ Pass B's math-facts measurements (geometry per level class, print vs PDF parity, raster legibility, A4) are in `docs/loop-findings.md` → S2; B is still never-run on index.html and math-minute.html, though the new smoke arms already cover paper size and font there.
  ⚑ Micro-feature: none offered in S2 (caps); ask gate 1 at S3's selection moment.

## S4 (2026-11-05) — pass B on index.html; three fixes (on a branch)
- Worked on branch `claude/fervent-lovelace-urwaob` again: the S2 instruction ("don't push to main until
  I say") stands, and no word came; main is still at 6b0503a.
- Pass B ran as scratch probes: print geometry of every grade × type × count with keys (1,208 sheets, then
  1,000 at 5 copies), seeded Save PDF against the print path rasterized, the Advanced Code round trip and
  the saved payload, the Remove-number / Name-blank headers, then a click-driven Mixed-ops check. Fixes:
  Grade 5–8 Mixed sheets write stacked problems across (7774975, gate 6), index's PDF keeps a full
  written-across page's last row (2d59570), the standard pages' PDF rows at print's heights (b8d2304, the
  S2 P4), and a committed probe for all three (5c70de2). The fourth slot went unused: every remaining
  candidate touches index.html, which had spent its two.
- Gates (one call at the selection moment): Mixed 5–8 → write them across (shipped); key spacing and
  rounding one-line → both approved (Candidates); long headers → shrink to fit (Candidate); micro-feature
  → skip. Screenshots delivered: the Grade 5 Mixed sheet and key before / after (scratchpad `shots/v1-1,
  v1-7` and `v1after-1, v1after-7`).
- Previous handoff (S3 → S4), verbatim:
  **Next session (S4):** S2's and S3's commits are on branch `claude/fervent-lovelace-urwaob`, NOT on `main`: the maintainer asked that nothing reach `main` until they say, and no word came in S3. Check `git log origin/main` first; if main still lacks them and no word has come, work on that branch again and do not push to main.
  ⚑ next: B on index.html — a never-run tie; chosen over A on math-facts.html because that page is math-minute's twin (S3 measured equal nodes per cell, the same generate and PDF path), while index.html's variable grid has never had its print geometry audited.
  ⚑ Approved, no gate needed: long-name shrink-to-fit, offline PDF wording, JPEG 0.8 (S2); the PDF progress message and whole/mixed numbers on fraction keys (S3). Each three-page fix spends one touch per page, so two of them fill every cap: plan the page budget before the second fix.
  ⚑ Save PDF is now ~35 s for 150 pages on every page (S3's `ignoreElements`); what is left per page is html2canvas's render (~90 ms), the 50 ms timer and toDataURL (~25 ms). The re-entrancy guard is still open.
  ⚑ The smoke's advanced arm now pastes a comma name ("Cohen, Avi") on every page. Seed `Math.random` (an init script) to compare two PDFs pixel for pixel; S3's method is in `docs/loop-findings.md`.
  ⚑ Micro-feature: the maintainer skipped it in S1 and again in S3 (there, to keep the caps for fixes); ask gate 1 again at S4's selection moment.

## S5 (2026-11-05) — pass C on math-facts.html; four fixes (on a branch)
- Worked on branch `claude/fervent-lovelace-urwaob` again: the S2 instruction ("don't push to main until
  I say") stands, and no word came; main is still at 6b0503a.
- Pass C ran as scratch probes: the UI at 1280 and 800 px (first paint, a filled roster, after Generate,
  Advanced mode, the Advanced Code panel), where the error list and the code panel land after a generate on
  all three pages, and rendered sheets and keys of every level class under print emulation. Fixes: the
  answer-key division on both standard pages (2a74f54, gate 6), one sign-to-number gap on both standard
  pages (6011727, gate 6), index's Mixed operations kept on Duplicate / reload (5c3b01a, the S4 P2) and
  index's rows-12 key overprint (b981031, the S4 P2 approved at S4's gate 6). Every page ended on its cap.
- Gates (one call at the selection moment): key division → match the sheet; sign spacing → same gap;
  micro-feature → skip. Screenshots delivered: UI before (scratchpad `c5/before-math-facts-{1280,800}-*`;
  no UI change shipped, so no UI after), `c5/S5-key-division-before-after.png`,
  `c5/S5-operator-spacing-before-after.png`, `c5/S5-index-key60-before-after.png`.
- Done row aged out of the ledger (S0), verbatim:
  - [x] S0 | 2026-11-04 | e64166f | .claude/skills/improveloop/, docs/, scripts/loop/ | bootstrap: the skill, the ledger, the passes reference, the findings file, the harness, the smoke, the ledger checks | smoke 0 failing on 3 pages (7 arms each, PDF arm on math-facts); planted escapeHtml defect fails 2 arms; check-inline-js 3/3
- Previous handoff (S4 → S5), verbatim:
  **Next session (S5):** S2–S4's commits are on branch `claude/fervent-lovelace-urwaob`, NOT on `main` (main is still 6b0503a): the maintainer asked that nothing reach `main` until they say, and no word came in S4. Check `git log origin/main` first; if main still lacks them and no word has come, work on that branch again and do not push to main.
  ⚑ next: C on math-facts.html — every cell left is a never-run tie; the maintainer's priorities are A, B, C, and A or B on the remaining pages would re-audit twins of audited pages, while C has never run; math-facts.html is the reference page CLAUDE.md names, so a C fix there carries to math-minute.html.
  ⚑ index.html has two P2s queued (Mixed ops lost on Duplicate / reload — a two-line fix in `renderMixedCheckboxes`; the 60-problem key overprint, approved) and two approved P3s (Rounding one line, long headers shrink-to-fit): spend index's two touches on the P2s. Any three-page approved item (offline wording, JPEG 0.8, PDF progress, long names) also spends an index touch.
  ⚑ `node scripts/loop/probes/S4-pdf-print-parity.mjs` guards S4's PDF fixes offline (stubbed libraries); the Mixed-ops click sequence and every S4 measurement are in `docs/loop-findings.md` → S4.
  ⚑ C rules: BEFORE / AFTER screenshots at 1280 and ~800 px plus a rendered sheet, delivered at close-out; palette, font or layout restructuring is gate 3.
  ⚑ Micro-feature: skipped in S1, S3 and S4 (S4: to keep the session for fixes); ask gate 1 again at S5's selection moment.

## S6 (2026-11-05) — pass G on index.html; two fixes and a micro-feature (on a branch)

- The maintainer invoked the loop "on a new branch - don't push to main yet": S6 committed to
  `claude/clever-davinci-hhh4iz` (from main d52bf7d) and did not touch `main`.
- Pass G as a committed probe (`S6-math-audit.mjs`): 51 selectors × 200 sheets through Advanced Input with
  the key on; 378,000 problems; every key answer equal to the problem recomputed with exact rationals; every
  key problem its sheet's own. Fixes: Division Levels 3–4 2-digit dividends (b1e456f; a first version with
  an evenly drawn divisor made 35 % of problems ÷ to 10 or 11 and was redrawn before commit), the header's
  count (dd8609a). Micro-feature: Custom header line on math-minute (4f7d68c).
- Gates (one call at the selection moment): Division 3–4 → 2-digit dividends; count → the real count;
  fraction subtraction → no zero answers (approved, queued); micro-feature → Custom header line.
- Screenshots delivered (scratchpad): `before-div3-key`, `after-div3-key`, `after-div4-key`, `before-hl-settings-1280`,
  `after-hl-settings-{1280,800}`, `after-hl-rows6-sheet`, `after-hl-hebrew-key`.
- Done rows aged out of the ledger (S1), verbatim:
  - [x] S1 | 2026-11-04 | 0ff238e | math-minute.html, math-facts.html | `content-visibility:auto` on the worksheets: the 150-sheet Generate handler 156 → 26 ms / 162 → 24 ms, the two 150–210 ms long tasks gone; the print block forces `visible` | printBoxes 150 sheets at 1056×816 (0 off), page.pdf 150 pages, scroll position and Save PDF size unchanged, screenshots 1280 / 800 px, smoke + `--cdn`
  - [x] S1 | 2026-11-04 | 9304f31 | index.html, math-minute.html, math-facts.html, scripts/loop/smoke.mjs, CLAUDE.md | the two PDF libraries (135 KB wire) load on the first Save PDF click, not with the page: first roster entry at 1.5 Mbps 906 → 624 / 895 → 372 / 896 → 398 ms, 0 cdnjs requests on load | smoke arm 8 green on all pages (it failed before), `--cdn` saves a real 3-page PDF on each, offline click → notice → online click → PDF
  - [x] S1 | 2026-11-04 | 62e6338 | index.html, scripts/loop/probes/roster-subset.mjs | two P2s: Fill Down dropped Student 1's fraction/decimal ops and mixed subset (the filled entries' ops panel was dead, sheets printed every operation), and a saved or duplicated grade ≥ 5 mixed student came back at count 30 instead of 40/50/60 | probe green; its `--control` run of the old page fails 6 of 9 checks; smoke
  - [x] S1 | 2026-11-04 | — | docs/IMPROVEMENT_LOG.md | gates: micro-feature skipped (maintainer's answer); index.html convergence = one dedicated approved session (Awaiting item rewritten); fourth fix withheld — every page had taken its two iterations | ledger
  - [x] S1 | 2026-11-04 | — | docs/IMPROVEMENT_LOG.md, .claude/skills/improveloop/SKILL.md | maintainer answered two Awaiting questions: the pages are standalone files (pass L unblocked; `<head>` edits reach production) and the loop pushes straight to `main` (S0's branch fast-forwarded into main) | ledger + skill updated, check-ledger ok
- Previous handoff (S5 → S6), verbatim:
  **Next session (S6):** S2–S5's commits reached `main` on the maintainer's word after S5 ("Push to main"; `main` fast-forwarded from 6b0503a to the branch `claude/fervent-lovelace-urwaob`), which lifts the S2 branch-only instruction: from S6 the loop commits and pushes straight to `main` again (skill, session-start step 5). Check `git log origin/main` first.
  ⚑ next: G on index.html — every cell left is a never-run tie and each of A, B and C has now run; A or B on the remaining pages would re-audit twins (S2 measured math-minute's 21 levels on paper, S3 equal nodes per cell, S4 both PDFs) and C's shared CSS was audited on math-facts in S5 (index's UI waits on its convergence session), while G has never run, a wrong key answer is a P1, and index holds the suite's hardest arithmetic (fractions, decimals, rounding, order of operations) with a fraction-key candidate already queued.
  ⚑ Top of the queue: the skipped-entries list hidden under the sheets (P2, all three pages, one touch each) and index's key division (P3, the S5 "match the sheet" answer; the shape is in 2a74f54). Both spend an index touch, as would Rounding one line and the long headers (approved S4): plan index's two touches first.
  ⚑ New probes (S5): `S5-key-division`, `S5-sign-gap`, `S5-mixed-ops`, `S5-key-rows12`; with `S4-pdf-print-parity` they are arm R's set. Ink is measured from the glyphs (canvas `measureText`), not text rects: S4's "8.4 px" overprint was −3.4 px of real ink (`docs/loop-findings.md` → S5).
  ⚑ Micro-feature: skipped in S1, S3, S4 and S5 (S5: to keep the session for fixes); ask gate 1 again at S6's selection moment.

## S7 (2026-11-05) — pass G on math-facts.html, then math-minute.html; two fixes and a micro-feature (on a branch)

- Run without arguments while S6's draft PR (Hbleiberg/mathsheet#5) was open and unmerged: S7 stacked its
  commits on `claude/clever-davinci-hhh4iz` as S6's handoff said, and did not touch `main`.
- Pass G as a committed probe (`S7-facts-audit.mjs`, both standard pages via `--page`): every level × 200
  sheets with keys; 498,000 problems on math-facts and 176,000 on math-minute, every key right, every deck
  dealt as documented. math-facts was clean, so it bought math-minute in the same session; both clean.
- Fixes: the skipped-entries box above the sheets on all three pages (cfa5cd6, the S5 P2), index.html's
  bracket names (f48b8db, the S6 P2). Micro-feature: the Header line on math-facts (8c9bfd3).
- Gates (one call after the pass): micro-feature → Header line on math-facts (shipped); Teens Rule → include
  10 + 9 (approved Candidate; math-facts' two touches went to the fix and the feature).
- A worker restart mid-session killed a background run; its output file was complete and was read back.
- Screenshots delivered (scratchpad): `s7-mf-hl-settings-{1280,800}`, `s7-mf-hl-rows6-{sheet,key}`,
  `s7-mf-hl-hebrew-{sheet,key}`.
- Done rows aged out of the ledger (S2), verbatim:
  - [x] S2 | 2026-11-05 | 48a610d | index.html, math-minute.html, math-facts.html, scripts/loop/smoke.mjs, CLAUDE.md | `@page{size:11in 8.5in landscape}` is invalid CSS and every page's rule was dropped (Chrome's dialog fell back to portrait; on A4 landscape each sheet split in two, its problems lost): now `size:11in 8.5in` | smoke paper arm fails on the old pages (612×792; A4 12 pages for 6 sheets), passes now (792×612; 6 for 6); rendered print, A4 and Save PDF pages
  - [x] S2 | 2026-11-05 | fb36ea5 | math-minute.html, math-facts.html, scripts/loop/smoke.mjs | the printed and PDF'd header (labels, name, description) was Times New Roman: the font lived on the app wrapper the sheets leave for print and the PDF stage; `.worksheet` now carries Arial | smoke font arm fails on both pages before, passes on all three; geometry audit 100 + 104 sheets, 0 clipped; before/after header screenshots
  - [x] S2 | 2026-11-05 | 7e0e32f | index.html | `content-visibility:auto` on the sheets: 150-sheet Generate handler add2 220 → 33 ms, fractions 433 → 47 ms (300 with the key: 675 → 71, 862 → 69) | medians of 3; scrollY, printBoxes, print PDF 150 pages, Save PDF 24 pages with the same per-page ink, last sheet renders at 1280 / 800 px; smoke
  - [x] S2 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | gates answered: comma names → read extra fields as the name; long names → shrink to fit; offline PDF wording and JPEG 0.8 approved (the two S1 Awaiting items resolved); all four are approved Candidates; no micro-feature offered (every page on its cap) | ledger
  - [x] S2 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | `esc()` apostrophe candidate withheld: the standard pages' `escapeHtml` carries the same no-op, so it is a three-page fix the caps did not allow; rewritten as one | ledger
- Previous handoff (S6 → S7), verbatim:
  **Next session (S7):** S6's commits (b1e456f, dd8609a, 4f7d68c and the close-out) are on branch `claude/clever-davinci-hhh4iz`, NOT on `main`: the maintainer ran S6 with "on a new branch - don't push to main yet". Check `git log origin/main` and the branch first; until the maintainer merges it, S7 builds on that branch (fast-forward it, never re-apply its commits on `main`).
  ⚑ next: G on math-facts.html — G found S6's two P2s on index by recomputing every key, the standard pages deal a deck (no duplicate fact) that no probe checks yet, and `probes/S6-math-audit.mjs` already parses stacks and divisions; math-facts has the most selectors. Then math-minute. E is the other strong never-run cell (S6's bracket-name P2 is its kind).
  ⚑ index.html's queue (plan its two touches first): P2 bracket names unchecked (`fractions[fractions-ad]` prints sums), P2 the skipped-entries list under the sheets (three pages); approved P3s: fraction keys as whole / mixed numbers, no zero fraction differences, key division like the sheet, Rounding one line, long headers shrink.
  ⚑ New probes (S6): `S6-math-audit` (`--n`, `--only type@grade`, `--control`; ~60 s at 200 sheets per selector) and `S6-header-line`; with S5's they are arm R's set. `S5-key-rows12`'s identity arm now replays later generator changes (`LATER`) onto its pre-S5 reference: add to that list whenever a session changes what index's sheets hold.
  ⚑ Micro-feature: S6 built the Custom header line on math-minute; its math-facts half is the open seed (ask gate 1 at S7's selection moment).

## S8 (2026-11-05) — pass B on math-minute.html; four fixes (on a branch)

- Run without arguments while the S6–S7 draft PR (Hbleiberg/mathsheet#5) was open and unmerged: S8 stacked its
  commits on `claude/clever-davinci-hhh4iz` as S7's handoff said, and did not touch `main`.
- Pass B as two committed probes: `S8-minute-print.mjs` (every level × 3 configurations, 378 sheets, Chromium's
  print-to-PDF on Letter and A4) — clean; `S8-minute-pdf.mjs` (a real cdnjs Save PDF of 42 pages rasterized
  against print) — every PDF page framed by the screen sheet's 1px #bbb border, and one key's header wrapping in
  the PDF only. Fixed on both standard pages (6bebbdb); index.html's clone is a different block (Candidate).
- Gate 1 (one call after the pass): the maintainer skipped the micro-feature for two approved index fixes —
  fraction keys as whole / mixed numbers (d3ef5c6) and the key's division drawn like the sheet (8e46ade). The
  fourth slot took the approved Teens Rule on math-facts (f0ba0e8).
- 8e46ade shipped split: the quotient over the sheet's bar needs ~24 px above the bar that rows-10 / rows-12 and
  written-across Mixed keys lack (3–11 px overprint measured), so those keep the old drawing byte for byte; the
  short-row shape is a gate-6 P4.
- A worker restart before the gate question; nothing was lost (the question was asked after it).
- Screenshots (scratchpad): `s8-p25-compare` (the Level 4 key, print vs PDF, before the fix), `s8-zoom-div60`,
  `s8-fraction-key-{before,after}`, `s8-idx-div4-compare` (sheet / old key / new key), `s8-idx-real-crop{3,4}`.
- Done rows aged out of the ledger (S3), verbatim:
  - [x] S3 | 2026-11-05 | ad456d2 | math-facts.html, math-minute.html, CLAUDE.md, scripts/loop/harness.mjs, scripts/loop/smoke.mjs | Advanced Input reads "Last, First" names: a line with more than 3 fields takes all but the last two as the name (the S2 rule), so "Cohen, Avi" survives the Generate Advanced Code round trip | scratch probe: 6 paste cases + the round trip on both pages, failing 6 of 8 checks on the old pages; the smoke's advanced arm now prints "Cohen, Avi" (2 failing on the old page)
  - [x] S3 | 2026-11-05 | 6ada9ea | index.html, math-minute.html, math-facts.html, CLAUDE.md | Save PDF skips the results container in html2canvas's per-page document copy (`ignoreElements`): 150 pages 127 → 36 s (math-minute), 107 → 35 s (math-facts), 123 → 35 s (index); 30 pages 11.6 → 7.7 s | seeded problems, 20 pages with keys per page: every page raster pixel-identical to HEAD's, also scrolled to the bottom mid-export; smoke `--cdn`
  - [x] S3 | 2026-11-05 | 3575eed | index.html, CLAUDE.md, scripts/loop/harness.mjs | the same comma-name rule on the 5-field parser (all but the last four fields); bracket lists are `|`-separated and still parse, a bracket typed with commas is still reported | scratch probe on index (the round trip, mixed/fractions/decimals brackets); smoke advanced arm fails on the old page, passes now; roster-subset probe green
  - [x] S3 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md, docs/IMPROVEMENT_ARCHIVE.md | gates: micro-feature skipped (every page's two touches went to the fixes); PDF progress wording approved; fraction keys → whole and mixed numbers; the S0 "Math Minute builds 9,000 extra nodes" candidate struck as refuted (archive) | ledger
- Previous handoff (S7 → S8), verbatim:
  **Next session (S8):** S6's and S7's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S8 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`.
  ⚑ next: B on math-minute.html — every cell left is a never-run tie and the maintainer's priorities rank B first; math-minute is the one page B has never audited, and its header changed in S5 (key division) and S6 (header line). A on math-facts would re-measure math-minute's twin (S3); E is the strongest never-run suite cell.
  ⚑ Queues: index.html's two touches went to S7's fixes; its approved P3s wait (fraction keys as whole / mixed numbers, no zero fraction differences, key division like the sheet, Rounding one line, long headers shrink). math-facts: the approved Teens Rule 10 + 9 (one touch).
  ⚑ New probes (S7): `S7-facts-audit` (`--page math-minute.html`, `--n`, `--only`, `--control`; ~2 min at 200 a level), `S7-skipped-list`, `S7-bracket-names`; `S6-header-line` takes `--page math-facts.html`. With S6's they are arm R's set. The blank / valid-bracket identity arms compare with fixed commits (S6-header-line: dd8609a, f48b8db; S7-bracket-names: cfa5cd6): a session that changes what those sheets hold moves the ref or replays the change, as `S5-key-rows12`'s LATER list does.
  ⚑ Micro-feature: the "Custom header line" seed is done on both standard pages (index.html's waits for its convergence session). Dual-audience seeds next: the Date line, `dir="auto"` on names. Ask gate 1 at S8's selection moment.
