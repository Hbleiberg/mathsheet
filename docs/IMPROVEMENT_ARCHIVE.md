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

## S9 (2026-11-05) — pass A on math-facts.html, then C on math-minute.html; four fixes (on a branch)

- Run without arguments while the S6–S8 draft PR (Hbleiberg/mathsheet#5) was open and unmerged: S9 stacked its
  commits on `claude/clever-davinci-hhh4iz` as S8's handoff said, and did not touch `main`.
- Pass A on math-facts.html came back clean (numbers in loop-findings S9), so it bought C on math-minute.html,
  whose CSS is math-facts' line for line: clean but for items already queued (long names cut, the divisor 3 px
  low, the Mixed key's two-line header) and one copy nit.
- Gate call (three questions after the pass): micro-feature → skipped for the hard levels; Levels 12 / 17 →
  "drop only the easiest" (936850d); "Easy X" in math-minute's menu → keep X. Struck from the ledger: the
  P4 on "Easy X" vs "Easy ÷" (the maintainer keeps the letter X, S9).
- f98327b first moved the baseline with padding-top: the probe caught the underline dropping 6 px in print,
  where the sheets sit outside the app wrapper (content-box). A measured line height keeps both. Measuring on a
  real field left an empty `style=""` (Chrome's lazily-synced style attribute after `removeAttribute`); the
  measure now runs on an empty copy of the line.
- Screenshots (scratchpad): `s9-name-{math-minute,index}-{before,after}`, `s9-namefit-pdf-facts-crop` (the PDF),
  `s9-index-pdf-frame-before-after`, `c/` (math-minute UI and every level's sheet and key).
- Done rows aged out of the ledger (S4), verbatim:
  - [x] S4 | 2026-11-05 | 7774975 | index.html | Grade 5–8 Mixed sheets (any pool with fractions, decimals, rounding …) write their stacked problems across ("844 × 6 =") on the sheet and the key; stacked, they overprinted each other in the 2-column grid (gate 6, approved) | seeded: 218 stacks in the across grid → 0; 46 Mixed sheets 0 overlaps (7–25 each before); 266 other sheets byte-identical; before/after screenshots; probe
  - [x] S4 | 2026-11-05 | 2d59570 | index.html | Save PDF lets a full written-across page run past the body as print does: Rounding's problems 29–30 and Long Division's last dividends were cut from the PDF | seeded 16-page export: pixels change only below y 792, Rounding bottom band 0 → 738 dark px (print 785), 7 pages identical, print path identical; probe; smoke `--cdn`
  - [x] S4 | 2026-11-05 | b8d2304 | math-minute.html, math-facts.html, CLAUDE.md | Save PDF lays the rows at print's fixed heights (the clone's 1fr rows set problems 4–19 px low, the S2 P4); CLAUDE.md's PDF step 3 says so | ruled lines 1–2 px from print on every row (was 4–19, growing); print path identical; probe; smoke `--cdn`
  - [x] S4 | 2026-11-05 | 5c70de2 | scripts/loop/probes/S4-pdf-print-parity.mjs | offline probe (stubbed cdnjs libraries): Save PDF mirrors print on all three pages, Mixed writes stacks across | green on HEAD; `--control` (the pre-S4 pages) fails 4 checks
  - [x] S4 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | gates: Mixed 5–8 → write across (shipped); key spacing, Rounding one line, long-header shrink → approved Candidates; micro-feature skipped; 4th slot unused (every remaining candidate touches index.html, on its cap) | ledger
- Previous handoff (S8 → S9), verbatim:
  **Next session (S9):** S6's, S7's and S8's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7–S8 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S9 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`.
  ⚑ next: A on math-facts.html — every cell left is a never-run tie and the maintainer's order puts A first; math-facts is math-minute's twin (A in S3: the PDF export fixed on all pages), so expect it clean and buy a second surface (C on math-minute.html, whose header changed in S5, S6 and S8). E is the strongest never-run suite cell.
  ⚑ Queues: index.html — approved P3s (Rounding one line, long headers shrink, no zero fraction differences) and S8's PDF frame (the twins' 6bebbdb, a different block there); its short / across Mixed key division is a gate-6 P4. Three-page approved P3s wait for a session with a touch free on every page: the offline PDF notice, JPEG 0.8, the PDF progress line, the name shrink.
  ⚑ New probes (S8): `S8-minute-print` (`--only`, `--a4`, `--control`), `S8-minute-pdf` (real cdnjs; needs the network the smoke's `--cdn` uses; `--ref`, `--control`), `S8-index-key-division` (ref d3ef5c6). With S7's they are arm R's set. `S6-math-audit` now holds fraction keys to whole / mixed form and reads the key's new division cell; `S5-key-rows12` and `S7-bracket-names` replay S8's fraction-key change onto their references.
  ⚑ Micro-feature: S8 skipped it at gate 1 (the maintainer chose two index fixes). Open dual-audience seeds: the Time / Score strip and the Date line on math-minute, `dir="auto"` on names. Ask gate 1 at S9's selection moment.

## S10 (2026-11-05) — pass C on index.html; three fixes (on a branch)

- Run without arguments while the S6–S9 draft PR (Hbleiberg/mathsheet#5) was open and unmerged: S10 stacked its
  commits on `claude/clever-davinci-hhh4iz` as S9's handoff said, and did not touch `main`.
- Pass C on index.html: the UI's type scale, button hierarchy, notices, Mixed panel and 800 px layout match the
  standard apart from Georgia and the `mwg-` names (the Awaiting convergence session); one defect, the Fraction /
  Decimal Operations checkboxes above their labels (an injected rule overrides the static one). The sheets' known
  items stood (Rounding fixed here; long headers, fraction zeros and the short-row Mixed key division queued).
- Gate call (four questions after the pass): micro-feature → skipped (third session running); Level 4's label →
  leave (struck); zero × both ways → approved (queued: math-minute's second touch went to the divisor); divisor →
  align (2b678e1). A worker restart between the question and its answer lost nothing.
- The fourth slot stayed unused: after the three-page PDF fix every remaining approved item needed a page on its
  cap (zero both ways on math-minute; the ops panel and the header shrink on index).
- The S10-rounding-one-line probe first took the grid box's bottom for the ink (always 800 px: `.mwg-horiz-grid`
  is `height:100%`); it measures the cells now.
- Screenshots (scratchpad `s10/`): `c/` (index UI at 1280 / 800 in five states, every type's sheet and key),
  `s10-rounding-{before,after}`, `s10-divisor-before-after` (DSF 3 cells), `s10-progress-{math-minute,index}`.
- Struck Candidate (the maintainer keeps the label, S10, gate 2):
  - [ ] P4 | math-minute.html | Level 4 "numbers through twenty" never passes 18 (minuends 10–18, single-digit answers), as index's Addition Level 2 stops at 18: wording is gate 2 | found S7
- Done rows aged out of the ledger (S5), verbatim:
  - [x] S5 | 2026-11-05 | 2a74f54 | math-facts.html, math-minute.html | the answer key's division is the sheet's own problem (same bracket, same place in the cell) with the quotient in red over the bar; it drew a bar under the answer, the bracket's stroke through it and the divisor beside it (gate 6, approved) | probe: 805 cells on every division level match the sheet within 0.5 px, quotients right and above the bar; control fails; real Save PDF rasters; before/after screenshots
  - [x] S5 | 2026-11-05 | 6011727 | math-facts.html, math-minute.html | one 7.2 px gap between the sign and any bottom number ("×12" sat 2 px from its sign, "× 7" 7.2 px); one-digit problems unchanged (gate 6, approved) | probe: every level of both pages with keys, 5,040 stacks, every gap 7.2 px, one-digit signs within 0.1 px; control fails; before/after screenshot
  - [x] S5 | 2026-11-05 | 5c3b01a | index.html | a Mixed entry keeps its chosen fraction / decimal operations after Duplicate and a saved-roster reload (all eleven came back ticked and printed); a bare "fractions" / "decimals" still means every operation | probe by real clicks: subset kept, reloaded sheet 0 ÷/− (15 before); control fails 3; roster-subset and S4 probes, smoke
  - [x] S5 | 2026-11-05 | b981031 | index.html | answer keys of 60 wide problems (rows-12): the key drops its lines' minimum heights and sets answers at 15 px, so no answer overprints the number below; worksheets and other keys unchanged (S4 gate 6) | probe (seeded, glyph ink): 2,640 cells, smallest gap −3.4 → 2.6 px, ink to 790 of 816; 152 other sheets byte-identical; control fails; before/after screenshot
  - [x] S5 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | gates: key division → match the sheet; sign spacing → same gap (both shipped); micro-feature skipped; the hidden error list (P2, three pages) and index's key division wait on index's two-touch cap | ledger
- Previous handoff (S9 → S10), verbatim:
  **Next session (S10):** S6–S9's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7–S9 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S10 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`.
  ⚑ next: C on index.html — every cell left is a never-run tie and the maintainer's order puts C next; it is C's last unaudited page. index.html's UI differs by design (Georgia, `mwg-`, injected styles): log those under the Awaiting convergence session, never fix them in C. If it comes back clean, buy D on math-facts.html. E is the strongest never-run suite cell.
  ⚑ Queues: index.html — approved P3s (Rounding one line, long headers shrink, no zero fraction differences); its short / across Mixed key division is a gate-6 P4. Three-page approved P3s wait for a session with a touch free on every page: the offline PDF notice, JPEG 0.8, the PDF progress line (the re-entrancy guard is the same block).
  ⚑ New probes (S9): `S9-name-fit` (`--only`, `--control`, `--ref`), `S9-index-pdf` (real cdnjs, as S8-minute-pdf; `--ref`; its problem-drift check only holds the line on the open S4 P4). `S7-facts-audit` now expects Levels 12 and 17's new decks. The M pass should know: at 800 px the on-screen sheets (11 in wide) scroll sideways; print is unaffected.
  ⚑ Micro-feature: S9 skipped it at gate 1 (the maintainer chose the hard levels). Open dual-audience seeds: the Time / Score strip and the Date line on math-minute, `dir="auto"` on names. Ask gate 1 at S10's selection moment.

## S11 (2026-11-06) — pass E (errors & robustness), the suite, on all three pages; three fixes (on a branch)

- Run without arguments while the S6–S10 draft PR (Hbleiberg/mathsheet#5) was open and unmerged: S11 stacked its
  commits on `claude/clever-davinci-hhh4iz` as S10's handoff said, and did not touch `main`.
- Arm R: the smoke and every S9 / S10 probe green; `S10-rounding-one-line` failed only by its own default reference
  (HEAD, which carries the fix): re-pointed to 2b678e1 (bd961ee), the one tooling commit of the session.
- Pass E (`S11-robustness`): every option the forms offer generates (523 / 21 / 71 combinations) with its count and
  key; malformed pastes are reported entry by entry and skipped; 500-entry pastes print in under half a second;
  storage denied or full degrades to defaults with the notices; 13 bad saved payloads load to a usable roster; every
  control fires without a page error. Found: the known "Entry 10" numbering (fixed), a lenient `parseInt` level /
  grade ("1O" → Level 1), index's silent 30 cap on Advanced counts for one-line types, the per-operation decimal
  keys' dropped zeros. Probe traps: nested long-division cells, Level 21's count-less description, math-facts'
  Mixed codes carry their count ("mix+30").
- Gate call (three questions after the pass): micro-feature → skipped (fourth session running; the question now
  rests under Awaiting); Decimals full places → yes (11fd4ee); the 30 cap → print 30 and say so (approved Candidate).
- The fourth slot stayed unused: after the three-page numbering fix, index (Decimals) and math-minute (zero both
  ways) took their second touches, and nothing open belongs to math-facts alone.
- Scratch (scratchpad `s11/`): `armR.log`, `E-full.log`, `E-head.log` (the probe and its control against HEAD's
  pages, run from a snapshot so the fixes could land meanwhile), `zero-identity.mjs`.
- Done rows aged out of the ledger (S6), verbatim:
  - [x] S6 | 2026-11-05 | b1e456f | index.html | Division Levels 3–4 ("2-digit ÷ 1-digit") print 2-digit dividends over 2-digit quotients, every such problem equally likely (85 % had 3-digit dividends; gate 2/6, approved) | S6-math-audit: off its label 7,589 + 7,696 of 9,000 → 0, keys recompute; before/after key screenshots; smoke
  - [x] S6 | 2026-11-05 | dd8609a | index.html, scripts/loop/probes/ | the header and key state the count printed: "60 Fractions" over 30 problems (Advanced, or Mixed → Deselect All → 60) now reads 30 (gate 2, approved); adds `S6-math-audit`; `S5-key-rows12` replays S6's generator changes onto its reference | count ≠ description 4,050 of 10,200 audit sheets → 0; control fails 2 checks; S5-key-rows12 0 of 152 differ; smoke
  - [x] S6 | 2026-11-05 | 4f7d68c | math-minute.html, CLAUDE.md, scripts/loop/probes/S6-header-line.mjs | micro-feature (gate 1): optional "Header line" (≤ 80 chars, dir=auto, escaped, saved as `headerLine`) printed under the header of every sheet and key; blank prints nothing | probe: blank byte-identical to dd8609a, print 1056×816 with 46+ px paper left, PDF clones within 1.0 px, old payload loads; control fails; UI 1280/800 and sheet screenshots
  - [x] S6 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | gates: Division 3–4 → 2-digit dividends; header count → the real count (both shipped); fraction subtraction → no zero answers (approved Candidate); micro-feature → Custom header line on math-minute (shipped; seed split to math-facts) | ledger
- Previous handoff (S10 → S11), verbatim:
  **Next session (S11):** S6–S10's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7–S10 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S11 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`.
  ⚑ next: E — A, B and C have now run on every page; every cell left is a never-run tie, and E (every selector generates, all three pages) is the strongest check after five sessions of generator changes (S6–S10). The surface never-runs (D, H, M) follow; D on math-facts.html next among them.
  ⚑ Queues: math-minute — zero × both ways (approved S10, gate 6). index.html — the ops-panel labels (C, S10), its divisor 3 px low (the twins' 2b678e1 shape, approved S10), the approved long-header shrink and no zero fraction differences, the short / across Mixed key division (gate 6 P4). Three-page approved P3s still waiting: the offline PDF notice wording, JPEG 0.8.
  ⚑ New probes (S10): `S10-pdf-progress` (real cdnjs; `--ref`), `S10-rounding-one-line` (`--ref`, `--control`), `S10-divisor-baseline` (`--only`, `--ref`, `--control`). `S5-key-rows12`, `S7-bracket-names` and `S8-index-key-division` replay S10's rounding span onto their references. With S9's they are arm R's set.
  ⚑ Micro-feature: skipped at gate 1 for the third session running (S8–S10; the maintainer chose fixes each time). Open dual-audience seeds: the Time / Score strip and the Date line on math-minute, `dir="auto"` on names. Ask once more at S11's selection moment; if skipped again, record that under Awaiting so the seeds stop costing a question.

## S12 (2026-11-06) — pass D (accessibility) on math-facts.html, the shared blocks measured on the twins (on a branch)

- Run without arguments while the S6–S11 draft PR (Hbleiberg/mathsheet#5) was open and unmerged: S12 stacked its
  commits on `claude/clever-davinci-hhh4iz` as S11's handoff said, and did not touch `main`.
- Arm R: the smoke and the four S10 / S11 probes green (S11-robustness 5 min 25 s).
- Pass D (scratch `s12/a11y-audit.mjs`): accessible names from Chromium's accessibility tree, a Tab walk with the
  focus ring at every stop, every flow by keyboard, contrast, target sizes, live regions, reduced motion. The row
  fields were unnamed on every page (the labels had no `for`; the S0 baseline missed it) and nothing was a live
  region; Tab order, focus rings and contrast clean; focus drops after Delete / Close / Fix, Escape idle on the code
  panel, the 16 px links, the smooth scrolls under reduced motion and the heading structure queued.
- Fixes, both the same diff on all three pages: the row fields named (4b10d20), the notices live regions (07f115f),
  with `S12-a11y` (two arms, `--ref` controls). Every page then stood on its two-touch cap; the third and fourth
  slots went unused.
- Gates: none asked — no gated work arose, and the micro-feature question rests under Awaiting since S11.
- CLAUDE.md gained the two conventions (row ids and names; the live notice containers and `aria-busy`).
- Scratch (scratchpad `s12/`): `armR.log`, `a11y-audit.mjs`, `audit-<page>.log`, `smoke-fix1.log`, `smoke-fix2.log`.
- Done rows aged out of the ledger (S7), verbatim:
  - [x] S7 | 2026-11-05 | cfa5cd6 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S7-skipped-list.mjs | the "Some entries were skipped" box stands above the sheets and a Generate that skipped an entry lands on it (it sat 16,560 px down after 20 sheets, below the scroll target) | probe at 1280 / 390 px on each page: in view, above the first sheet, still before the results after print; 18 checks fail on the old pages; smoke
  - [x] S7 | 2026-11-05 | f48b8db | index.html, scripts/loop/probes/S7-bracket-names.mjs | Advanced Input checks the names inside brackets: an unknown operation or a type the grade lacks skips the entry with "invalid type for grade G: <name>"; a stray "|" is ignored | probe: 6 bad entries skipped and named, 7 valid brackets byte-identical to the old page (seeded); control fails 2; roster-subset, S5-mixed-ops, S6-math-audit, smoke
  - [x] S7 | 2026-11-05 | 8c9bfd3 | math-facts.html, CLAUDE.md, scripts/loop/probes/S6-header-line.mjs | micro-feature (gate 1): the optional "Header line" on math-facts, line for line math-minute's (S6); the probe takes `--page` | probe on math-facts: blank byte-identical to f48b8db, 8 of 8 carry it escaped, print 1056×816 with 46+ px paper left, PDF clones within 1.0 px, old payload loads; control fails; settings and sheet screenshots
  - [x] S7 | 2026-11-05 | — | scripts/loop/probes/S7-facts-audit.mjs, docs/IMPROVEMENT_LOG.md | pass G on math-facts, then math-minute (clean, so it bought the second): 674,000 problems, every key right, every deck dealt as documented; gates: micro-feature → header line on math-facts (shipped); Teens Rule → include 10 + 9 (approved Candidate) | probe green on both pages; `--control` fails 7 checks on each
- Previous handoff (S11 → S12), verbatim:
  **Next session (S12):** S6–S11's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7–S11 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S12 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`.
  ⚑ next: D on math-facts.html — A, B, C and E have run everywhere; every cell left is a never-run tie (D, H, M on each page; F, I, L). D first among them, on math-facts.html (the standard implementation, so what it finds carries to math-minute); F follows, now that five sessions of generator changes have landed on all three pages.
  ⚑ Queues: index.html — the ops-panel labels (C, S10; displaced this session by the Decimals places), the approved 30-cap note (S11, copy approved), its divisor 3 px low (approved S10), the approved long-header shrink and no zero fraction differences, the lenient grade parse (S11), the per-operation decimal key zeros (S11), the short / across Mixed key division (gate 6 P4). math-minute — the lenient level parse (S11). Three-page approved P3s still waiting: the offline PDF notice wording, JPEG 0.8; the apostrophe escape.
  ⚑ New probes (S11): `S11-robustness` (`--only`, `--skip-selectors` — the selector sweep is 191 s on index —, `--control`; it is E's audit, rerun it whenever a parser, a storage path or a selector list changes). `S6-math-audit` holds the Decimals type to its places; `S7-facts-audit`'s multiplication family deals zero both ways; `S5-key-rows12`, `S7-bracket-names`, `S8-index-key-division` and `S10-rounding-one-line` replay the Decimals change onto their references; `S10-rounding-one-line` pins its reference to 2b678e1. With S9's and S10's they are arm R's set.
  ⚑ Micro-feature: skipped at gate 1 for the fourth session (S8–S11); the question now rests under Awaiting — do not ask it each session; build a seed only when the maintainer names one.
  

## S13 (2026-11-06) — pass F (cross-page consistency), the suite, on all three pages; three fixes (on a branch)

- Run without arguments while the S6–S12 draft PR (Hbleiberg/mathsheet#5) was open and unmerged: S13 stacked its
  commits on `claude/clever-davinci-hhh4iz` as S12's handoff said, and did not touch `main`.
- Arm R: the smoke (60 checks), S11-robustness and S12-a11y green.
- Pass F: the two standard pages diffed line by line (464 diff lines, every one the selector system: title, app id,
  placeholder and help text, STORAGE_KEY, the level tables and generators, the parser's selector check, the PDF
  filename); index.html compared with the CLAUDE.md standard affordance by affordance — the parser, the toggle UI,
  the settings labels and button copy, the saved payload, the notice boxes, the description box and branding
  snippet, the print CSS block, the PDF pipeline constants, the utilities, the style constants, and the shared
  helpers lifted by name and diffed after normalising index's names. Its values match the standard but for the
  known exceptions; the apostrophe escape was a no-op on all three pages; four strings had drifted; CLAUDE.md's
  payload line lacked `headerLine` and index saves its roster under `students`.
- Fixes: the apostrophe entity on all three pages (854a805, `S13-escape-html`); the empty-roster notice on all three
  (12c44be, `S13-gencode-notice`; approved S13, gate 2); CLAUDE.md's payload line (074ec5e). Every page then stood
  on its two-touch cap; the fourth slot went unused.
- Gates (one call, two questions): the empty-roster notice → "say what is needed" (shipped); the four drifted index
  strings → index takes the standard's wording (queued: index was capped).
- Candidates: the S1 apostrophe P3 struck (fixed); added index's four strings (P3, approved) and index's `students`
  payload key (P4).

### Done rows archived from the ledger (S8, verbatim)

- [x] S8 | 2026-11-05 | 6bebbdb | math-minute.html, math-facts.html, CLAUDE.md, scripts/loop/probes/S8-minute-pdf.mjs | Save PDF draws print's box (padding 0.25in 0.3in, no border): the screen sheet's 1px #bbb border framed every PDF page and narrowed the header 2.4 px, so the Level 4 key's description wrapped in the PDF only (its problems 7–9 px low) | real cdnjs PDF, 42 pages: 0 framed (42 before), every cell at print's place (87 px off before); clone vs print 0.0 px on both pages; smoke --cdn
- [x] S8 | 2026-11-05 | d3ef5c6 | index.html, scripts/loop/probes/ | fraction keys write whole and mixed numbers in lowest terms (1/1 → 1, 0/1 → 0, 4/3 → 1 1/3; gate 2, S3); S6-math-audit reads them and holds keys to that form, S5-key-rows12 and S7-bracket-names replay it | audit green over 378,000 problems, its control fails 3; worksheets byte-identical, 72 of 240 key answers rewritten at equal value
- [x] S8 | 2026-11-05 | 8e46ade | index.html, scripts/loop/probes/S8-index-key-division.mjs | the key's division is the sheet's own problem, quotient in red over the bar ("49 r1"; gate 6, S5); Mixed keys in rows-10 / 12 and written across keep the old drawing (no room above the bar) | probe: 582 cells 0.00 px from the sheet, quotients ≥ 14 px clear; short / across keys and every sheet byte-identical; control fails 2; real PDF
- [x] S8 | 2026-11-05 | f0ba0e8 | math-facts.html, scripts/loop/probes/S7-facts-audit.mjs | "+10 (Teens Rule)" deals 10 + 9 = 19 (gate 2, S7); every other level and the Mixed pools keep sums to 18 | S7-facts-audit green (+10 max 19; mix+ 64 facts, max 18), fails 2 on the old page; control fails 7; 70 other levels byte-identical
- [x] S8 | 2026-11-05 | — | scripts/loop/probes/S8-minute-print.mjs, docs/IMPROVEMENT_LOG.md | pass B on math-minute.html: print clean (378 sheets in 3 configurations; Letter and A4 one page a sheet), Save PDF framed (fixed), round trip and saved payload fine; gate: micro-feature → skipped for two approved index fixes | S8-minute-print green, its control fails 3

### Previous handoff (S12 → S13), verbatim

**Next session (S13):** S6–S12's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7–S12 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S13 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`.
⚑ next: F — every cell left is a never-run tie (D on index and math-minute, H and M everywhere, F, I, L); F first because six sessions of shared-block edits (S7–S12: the header line, the PDF guard, the entry numbering, the row ids, the live regions) have landed on all three pages and only the smoke has compared them to the CLAUDE.md standard since S1; D's two remaining pages would mostly re-measure the shared blocks S12 already measured on all three.
⚑ Queues: the D P3 (focus after Delete / Close / Fix, Escape on the code panel) is one shared diff for all three pages — a session's first touch. index.html — the ops-panel labels (C, S10), the approved 30-cap note (S11), its divisor 3 px low (approved S10), the approved long-header shrink and no zero fraction differences, the lenient grade parse (S11), the per-operation decimal key zeros (S11), the short / across Mixed key division (gate 6 P4). math-minute — the lenient level parse (S11). Three-page approved P3s still waiting: the offline PDF notice wording, JPEG 0.8; the apostrophe escape.
⚑ New probe (S12): `S12-a11y` (`--only`, `--ref <commit>`): the row names from Chromium's accessibility tree and the live regions, with a real cdnjs Save PDF for the busy arm (9eb4248 fails both arms, 4b10d20 the live arm). Arm R's set for S13 is S11-robustness and S12-a11y. The S0 "only the Advanced Code textarea is unnamed" baseline was wrong (loop-findings S12).
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12 asked nothing — no gate moment arose); build a seed only when the maintainer names one.

## S14 (2026-11-06) — pass I (first load, saved data & safety), the suite, on all three pages; three fixes (on a branch)

- Run without arguments while the S6–S13 draft PR (Hbleiberg/mathsheet#5) was open and unmerged: S14 stacked its
  commits on `claude/clever-davinci-hhh4iz` as S13's handoff said, and did not touch `main`.
- Arm R: the smoke (60 checks), S12-a11y and the two S13 probes green.
- Pass I (scratch `s14/i-audit.mjs`, 140 checks over the three pages, all green): the static read of every
  `innerHTML` site, `JSON.parse` and `localStorage` call; a fresh context; Save → reload in both modes against
  the CLAUDE.md payload; Clear Current and Clear Saved, cancelled and accepted; cross-page isolation with every
  storage call logged; hostile strings in every saved field and at every input. Nothing to fix; the silent
  fallback on an unreadable payload turned out to be on all three pages (the S1 candidate broadened, with
  index's non-array `mixedTypes` throw folded in).
- Fixes, all from the queue: index's four approved strings (c984c02, `S14-index-copy`); the approved offline PDF
  notice on all three pages and CLAUDE.md (9ffc917); math-minute's digits-only Advanced level (86643bb, the S11
  probe's expectations following). index and math-minute then stood on their caps; math-facts had one touch left
  and no facts-only candidate, so the fourth slot went unused.
- Gates: none asked (no gated work was shipped; the unreadable-payload message waits for the next batch).
- Protocol note: a clean suite pass does not buy a second pass under the rule as written (it names surfaces).

### Done rows archived from the ledger (S9, verbatim)

- [x] S9 | 2026-11-05 | f98327b | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S9-name-fit.mjs | a long student name shrinks to fit its printed line (to 11 px, then "…"; gate 6, S2), on its usual baseline; names that fit unchanged | S9-name-fit, all pages, sheets and keys, with and without the Number: 0 overflow, baselines 0.00 px from an 18 px name in print, fitting sheets byte-identical; control fails 12; real PDF; +11 ms at 300 sheets
- [x] S9 | 2026-11-05 | ae14c70 | index.html, scripts/loop/probes/S9-index-pdf.mjs | Save PDF draws print's box (padding 0.25in 0.3in, border none): the screen sheet's 1px #bbb border framed every PDF page and narrowed the header 2.4 px (S8's twin fix, 6bebbdb) | S9-index-pdf, a real cdnjs PDF of 8 sheet types with keys against print: 0 of 16 pages framed (16 before), header ink within 1 px (2); control fails; smoke --cdn
- [x] S9 | 2026-11-05 | 936850d | math-minute.html, scripts/loop/probes/S7-facts-audit.mjs | the "hard" levels drop their easiest facts (gate 2: "drop only the easiest"): Level 12 deals 3–9 × 6–9 (no ×1, ×2), Level 17 quotients 2–9; labels kept | S7-facts-audit green with the new decks, fails 3 on the old page (2,807 problems outside); the other 19 levels byte-identical (seeded); S8-minute-print
- [x] S9 | 2026-11-05 | 2a5a054 | CLAUDE.md | the advanced-input recipe said "require name" while the standard keeps Student Name optional: it now says the name may be empty | doc only
- [x] S9 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md | pass A on math-facts.html (clean) bought C on math-minute.html (clean but for known items); gates: micro-feature → skipped for the hard levels; hard levels → drop only the easiest (shipped); "Easy X" → keep X (struck) | ledger, loop-findings S9

### Previous handoff (S13 → S14), verbatim

**Next session (S14):** S6–S13's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7–S13 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S14 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`.
⚑ next: I — the never-run ties left are D on index and math-minute, H and M everywhere, I and L; I first because S13's escape fix and its `students`-key finding sit in I's brief (first load, the saved payload, escaping at every sink), while D's two remaining pages would re-measure the shared blocks S12 already measured on all three.
⚑ Queues: index.html's first touch — the four approved strings (S13, gate 2: the code panel's help line, the "moved" message and the clear-roster confirms take the standard pages' wording); then the ops-panel labels (C, S10), the approved 30-cap note (S11), its divisor 3 px low (approved S10), the approved long-header shrink and no zero fraction differences, the lenient grade parse (S11), the per-operation decimal key zeros (S11). Shared first touches: the D P3 (focus after Delete / Close / Fix, Escape on the code panel); the approved offline PDF notice wording and JPEG 0.8 (S2); the code panel under the button row (S5). math-minute — the lenient level parse (S11).
⚑ New probes (S13): `S13-escape-html` (the helper lifted from each page's source, run on the five characters, plus a live round trip of a name holding them all; `--ref aadebcc` fails its static arm) and `S13-gencode-notice` (`--ref 854a805` fails). Arm R's set for S14 is S12-a11y (its busy arm needs cdnjs) and the two S13 probes. F's full comparison is in loop-findings S13; the twins need no re-diff until a page changes outside its selector system.
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12 and S13 asked nothing about it); build a seed only when the maintainer names one.

## S15 (2026-11-06) — pass L (metadata & discoverability), the suite, on all three pages; three fixes (on a branch)

- Run without arguments while the S6–S14 draft PR (Hbleiberg/mathsheet#5) was open and unmerged: S15 stacked its
  commits on `claude/clever-davinci-hhh4iz` as S14's handoff said, and did not touch `main`.
- Arm R: the smoke (60 checks), the two S13 probes and S14-index-copy green.
- Pass L: the three heads hold lang, charset, viewport and a title and nothing else; the public site turned out to be
  a WordPress install whose pages embed the GitHub Pages copies (byte-identical to `main`) in 1400 px iframes and
  carry the public metadata themselves. Inside a cross-origin iframe, Generate & Print reaches `window.print` and
  Save PDF downloads on both page shapes. Full measurements in loop-findings S15.
- Gates (one call, three questions): the GitHub Pages copies → noindex (shipped); an unreadable saved roster → say
  so once and clear it (shipped); the deployment description → confirmed (CLAUDE.md).
- Fixes: noindex on all three pages (69deb36, `S15-head`); the unreadable-roster notice on all three (77eda9d,
  `S15-unreadable-roster`); the deployment paragraph in CLAUDE.md and pass L's premise (d9912f2). Every page then
  stood on its two-touch cap; the fourth slot went unused.
- Candidates: the S1 unreadable-roster P4 struck (fixed); a favicon P4 added (gate 3). Feature seed added: iframe
  auto-height via postMessage.

### Done rows archived from the ledger (S10, verbatim)

- [x] S10 | 2026-11-05 | 291903c | index.html, math-minute.html, math-facts.html, scripts/loop/probes/ | Save PDF reads "Making your PDF: page k of N..." per page, in view, and refuses a second click (button disabled until "PDF saved!" or a notice; approved S3, the S1 guard); the same diff on the twins | S10-pdf-progress (cdnjs), all pages: 8 of 8 counted, disabled mid-export, one pipeline for two clicks; offline and no-student paths re-enable; `--ref HEAD` fails 12; smoke --cdn
- [x] S10 | 2026-11-05 | a32d3fa | index.html, scripts/loop/probes/ | Rounding problems print on one line (a nowrap span; the blank gives way, 286 → 203–256 px; approved S4, gate 6); Mixed 5–8 too | S10-rounding-one-line: 0 of 244 wrap (122 before), last row 780 px (816), other sheets byte-identical; control fails 2; S5-key-rows12, S7-bracket-names, S8-index-key-division replay the span and stay green; S6-math-audit
- [x] S10 | 2026-11-05 | 2b678e1 | math-minute.html, math-facts.html, scripts/loop/probes/S10-divisor-baseline.mjs | the long-division divisor shares the dividend's baseline (padding-top 8 → 5 px; approved S10, gate 6) | 860 brackets 0.00 px apart (3.00 before), every bracket where HEAD puts it; control fails 2; S5-key-division, S5-sign-gap, S8-minute-print, smoke
- [x] S10 | 2026-11-05 | — | docs/IMPROVEMENT_LOG.md, CLAUDE.md | pass C on index.html (UI at 1280 / 800 in five states, 29 type rows with keys under print): the ops-panel labels found, the rest known or by design; gates: micro-feature → skipped; Level 4 label → leave (struck); zero both ways → approved; divisor → align (shipped) | ledger, loop-findings S10

### Previous handoff (S14 → S15), verbatim

**Next session (S15):** S6–S14's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7–S14 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S15 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`.
⚑ next: L — the one suite never run (runnable since S1); the never-run surface ties are D on index and math-minute, H and M everywhere. L first because it closes the suite set after E, F and I, and its findings are small (titles, descriptions, `lang`, icons: gate 2 for any text); then D on index.html, whose own blocks (the injected styles, the Mixed and ops panels, the code panel) S12 did not measure.
⚑ Queues: shared first touches — the D P3 (focus after Delete / Close / Fix, Escape on the code panel), JPEG 0.8 (approved S2; `--cdn` bytes and a zoomed raster), the code panel under the button row (S5), reduced motion and the 16 px links (P4). index.html — the ops-panel labels (C, S10), the approved 30-cap note (S11), its divisor 3 px low (approved S10), the approved long-header shrink and no zero fraction differences, the lenient grade / count parse (S11), the per-operation decimal key zeros (S11), the `students` payload key (P4). The P4 unreadable-payload message is a gate-2 question for the next batch.
⚑ New probe (S14): `S14-index-copy` (`--ref 9030fbe` fails 4). S11-robustness's math-minute paste expectations follow the digits-only level (7 sheets, 6 reports). Arm R's set for S15 is S13-escape-html, S13-gencode-notice and S14-index-copy (S12-a11y optional; its busy arm needs cdnjs). Pass I's full measurements are in loop-findings S14; a clean suite pass did not buy a second pass (the rule names surfaces) — the slots went to queued approvals instead, a divergence to fold into the skill if wanted.
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S14 asked nothing about it); build a seed only when the maintainer names one.

## S16 (2026-11-06) — pass D (accessibility) on index.html, its own blocks; two three-page fixes (on a branch)

- Run without arguments while the S6–S15 draft PR (Hbleiberg/mathsheet#5) was open and unmerged: S16 stacked its
  commits on `claude/clever-davinci-hhh4iz` as S15's handoff said, and did not touch `main`.
- Arm R: the smoke (60 checks), S14-index-copy, S15-head and S15-unreadable-roster green.
- Pass D on index.html's own blocks (scratch `s16/d-index.mjs`): every Mixed / ops / code-panel control named by
  its label or text and keyboard-operable, UA focus rings everywhere, contrast 4.65 and up; no group context on the
  two panels (P4), 23 px panel buttons and 13 px checkboxes (into the target P4), an ops checkbox's box stretched
  to the column by the grid's input rule (into the C P3); 17 Tab stops per Mixed row, noted. Measurements in
  loop-findings S16.
- Fixes, both the same block on all three pages: focus follows Delete, the code panel's open / Close / Escape / Use,
  and Fix (6daf036, `S16-focus`) — and Fix's scroll to the field had never run on any page, its selector unable to
  match the serialised colour; the code textarea named by the panel's title (635eadc). CLAUDE.md's Accessibility
  bullet grew the convention (dba73d2). Every page then stood on its two-touch cap; the fourth slot went unused.
- Gates: none asked (nothing gated; the micro-feature question rests under Awaiting).
- Candidates: the S12 focus P3 and the S0 textarea P4 struck (fixed); the group-context P4 added; the target-size
  P4 and the ops-panel P3 amended with S16's measurements.

### Done rows archived from the ledger (S11, verbatim)

- [x] S11 | 2026-11-06 | 2abc2e3 | index.html, math-minute.html, math-facts.html | skipped-entry reports number the entries a teacher pasted, not the raw `;` chunks (a newline after `;` made an empty one: the 6th line read "Entry 10", S2); the same loop on all three pages | S11-robustness (paste arm) reports 4, 5, 6, 7 for the 4th–7th entries on each page where HEAD said 7, 9, 11, 13 (15, 26 on index); smoke
- [x] S11 | 2026-11-06 | 11fd4ee | index.html, scripts/loop/probes/ | the Decimals type shows the level's places on every number, sheet and key ("45.0 + 7.0 = 52.0", "3.50 + 12.25 = 15.75"; 9 % lost a zero or the point, S6; approved S11, gate 6) | S6-math-audit's new places check: 12,000 of 12,000 numbers at grades 5 and 6, keys included; HEAD fails 1,579 problems; Mixed@6 green; the S5, S7, S8, S10 index probes replay the change; smoke
- [x] S11 | 2026-11-06 | ad0ed78 | math-minute.html, scripts/loop/probes/S7-facts-audit.mjs | a zero factor stands below as well as on top (7 × 0 and 0 × 7) on Levels 11, 13–15 and Mixed, as every other fact is dealt both ways (S7; approved S10, gate 6) | S7-facts-audit green on 21 levels with the family following, fails Levels 11 and 13 on HEAD; seeded, Levels 1–10, 12, 16–20 byte-identical; Level 11 11 on top / 20 below (19 / 0); S8-minute-print; smoke
- [x] S11 | 2026-11-06 | — | scripts/loop/probes/, docs/IMPROVEMENT_LOG.md | pass E on all three pages (615 selector combinations, bad and 500-entry pastes, storage denied / full, 13 bad payloads, every control): clean but for the known numbering (fixed); a lenient level parse and the silent 30 cap found; the rounding probe's reference re-pointed (bd961ee); gates: micro-feature → skip; Decimals → full places; 30 cap → say so | S11-robustness green, `--control` fails each page; loop-findings S11

### Previous handoff (S15 → S16), verbatim

**Next session (S16):** S6–S15's commits are on branch `claude/clever-davinci-hhh4iz` (draft PR Hbleiberg/mathsheet#5), NOT on `main`: the maintainer ran S6 "on a new branch - don't push to main yet" and S7–S15 stacked on it. Check `git log origin/main` and the PR first; until it is merged, S16 builds on that branch (never re-apply its commits on `main`); once it is merged, restart the branch from `main`. GitHub Pages publishes `main` into mathsheet.io's iframes (CLAUDE.md, S15), so the merge is the deploy.
⚑ next: D on index.html — the never-run ties left are D on index and math-minute, H and M everywhere (every suite has now run). D on index first: its own blocks (the injected styles, the Mixed and ops panels, the code panel, Georgia's contrast) were never measured, while the shared blocks were measured on all three in S12; then H.
⚑ Queues: shared first touches — the D P3 (focus after Delete / Close / Fix, Escape on the code panel), JPEG 0.8 (approved S2; `--cdn` bytes and a zoomed raster), the code panel under the button row (S5), reduced motion and the 16 px links (P4), the favicon (P4, gate 3). index.html — the ops-panel labels (C, S10), the approved 30-cap note (S11), its divisor 3 px low (approved S10), the approved long-header shrink and no zero fraction differences, the lenient grade / count parse (S11), the per-operation decimal key zeros (S11), the `students` payload key (P4).
⚑ New probes (S15): `S15-head` (`--ref 658ede3` fails 6) and `S15-unreadable-roster` (`--ref 69deb36` fails 12). Arm R's set for S16 is S14-index-copy, S15-head and S15-unreadable-roster. Traps: the harness `storage` seed re-plants on every navigation (plant by hand for a "next load" check); the production page sits in a 1400 px cross-origin iframe, so M and B should also run inside one (`s15/iframe-probe.mjs` in the scratchpad shows the shape).
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S15 asked nothing about it); build a seed only when the maintainer names one.

## S17 (2026-11-07) — pass M (mobile & touch) on math-facts.html; three fixes, pushed to `main`

- Run on `main`: the session's assigned branch matched `origin/main` (e2bb697), local `main` was reset to it, and
  each fix was pushed to `main` as CLAUDE.md and the S1 ratification say.
- Arm R: the smoke (60 checks), S15-head, S15-unreadable-roster and S16-focus green.
- Pass M on math-facts.html (scratch `s17/m-audit.mjs`: iPhone SE, iPhone 13 and iPad Mini in both orientations,
  a 350 px frame; fresh, validation box, code panel, Advanced, results): the roster's button row cut Add Student
  on every phone, and `s17/rows.mjs` found the same on index.html and math-minute.html; index.html's responsive
  block measured dead at every width. Measurements in loop-findings S17.
- Fixes: the button rows wrap at ≤860 px on all three pages (8e40f96); index's three responsive rules carry
  `#mwg-app` and apply again (13bcc9b); the math-facts help line drops "to the right" (13b7c75, approved).
  index.html and math-facts.html then stood on their caps; math-minute's slot went unused rather than split the
  queued three-page 16 px change.
- Gates: one asked — the help line ("to the right") → drop the direction.
- Candidates: the 16 px phone fields (P3) and the sideways sheet preview (P4) added; three found and fixed.

### Done rows archived from the ledger (S12, verbatim)

- [x] S12 | 2026-11-06 | 07f115f | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S12-a11y.mjs | the notices are live regions (the status, error and counter boxes and the validation box changed in silence for a screen reader): polite regions, the validation box an alert, `aria-busy` through the PDF page counts | S12-a11y arm 2: polite / alert in the accessibility tree, a real PDF busy through every count and clear before the result; 12 fails on 4b10d20; smoke

### Previous handoff (S16 → S17), verbatim

**Next session (S17):** S6–S16 reached `main` on 2026-11-06 (the maintainer: "Push to main"; `main` fast-forwarded to 7867a4f, draft PR Hbleiberg/mathsheet#5 closed as merged, branch `claude/clever-davinci-hhh4iz` retired). S17 works on `main` again, as CLAUDE.md says: one commit per iteration, pushed to `main`. GitHub Pages publishes `main` into mathsheet.io's iframes (CLAUDE.md, S15), so every push is a deploy; `--cdn` close-outs matter accordingly.
⚑ next: M on math-facts.html — the never-run cells are D on math-minute, H and M everywhere. D on math-minute would re-measure S12's shared blocks (the twins are identical outside their selector systems, S13), so M first: it has never run anywhere, and the production frame is 100 % wide and a fixed 1400 px tall, so phone widths need a look (gate 4 for anything that changes desktop; phone screenshots at deviceScaleFactor 2); then H on index.html (the feature-seed intake; the micro-feature question rests under Awaiting).
⚑ Queues: shared first touches — JPEG 0.8 (approved S2; `--cdn` bytes and a zoomed raster), the code panel under the button row (S5), reduced motion (P4), the target sizes (P4, now with index's 23 px panel buttons), the favicon (P4, gate 3). index.html — the ops-panel labels (C, S10; the grid's `input{width:100%}` is part of it), the approved 30-cap note (S11), its divisor 3 px low (approved S10), the approved long-header shrink and no zero fraction differences, the lenient grade / count parse (S11), the per-operation decimal key zeros (S11), the `students` payload key (P4), the panels' group context (P4, S16).
⚑ New probe (S16): `S16-focus` (`--ref 196dd4a` fails 27; `--ref 6daf036` fails the 3 name checks). Arm R's set for S17 is S15-head, S15-unreadable-roster and S16-focus. Traps: a `display:none` node has no accessible name (read names with the panel open); an inline style set as `rgb(204,0,0)` reads back as `rgb(204, 0, 0)`, so attribute selectors on colours silently miss.
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S16 asked nothing about it); build a seed only when the maintainer names one.

## S18 (2026-11-07) — pass H (teacher walkthrough) on index.html; three fixes, pushed to `main`

- Run on `main` (local `main` at `origin/main`, 1f80a43); each fix pushed as it landed.
- Arm R: the smoke, S16-focus and S17-phone-layout green.
- Pass H on index.html (scratch `s18/walk.mjs`, `walk2.mjs`, `walk3.mjs`, `walk4.mjs`): a class of 22 built by real
  clicks and keys (Hebrew names, two students on other levels, an IEP student, a key for a parent helper, a
  substitute's blank sheets), then the Advanced box as its help teaches it. Measurements in loop-findings S18.
- Gates (one call, four questions, every answer the recommended one): the Advanced help → name the codes and read
  the help's bracket spelling; the unsaved roster → a notice after Generate, nothing saved without the click; Fill
  Down over set rows → confirm first (queued); a Hebrew name's punctuation → `<bdi>`, the name stays left.
- Fixes: index's Advanced help and short bracket names (e71f8fc); the unsaved-roster notice on all three pages
  (fde4b66); the twins' printed name in a `<bdi>` (36f71e4). Every page then stood on its two-touch cap, so index's
  `<bdi>` half and Fill Down's confirm wait as approved candidates.
- Found on the artifact while proving 36f71e4, and logged P2: Save PDF cuts an 11 px-floor name mid-letter with no
  "…", and a long Hebrew name loses its first letter (the same before the change).

### Done rows archived from the ledger (S13, verbatim)

- [x] S13 | 2026-11-06 | 854a805 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S13-escape-html.mjs | the escaping helper writes the apostrophe as `&#x27;` as the standard says (its step replaced `'` with itself since S0: no live sink, but a gap the smoke's XSS arm could not see); one line on all three pages | S13-escape-html: the helper lifted from each page escapes all five characters (fails 3 on aadebcc); a name with every special character round-trips as typed; smoke
- [x] S13 | 2026-11-06 | 12c44be | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S13-gencode-notice.mjs | the Generate Advanced Code empty-roster notice says what the code needs (the twins said "with a name and level" though a name is optional; index "complete student"); approved S13 (gate 2) | S13-gencode-notice: a name and no level shows the notice and no panel, a level and no name opens the panel with the empty name first (fails 3 on 854a805); smoke
- [x] S13 | 2026-11-06 | 074ec5e | CLAUDE.md | the saved-payload line lists `headerLine` (saved since S6 / S7) and index's exceptions name its `students` roster key and missing header line | doc only
- [x] S13 | 2026-11-06 | — | docs/IMPROVEMENT_LOG.md, docs/loop-findings.md | pass F on all three pages (the twins diffed line by line; index compared with the standard affordance by affordance): the twins identical outside their selectors, index matching in value but for its known exceptions; four index strings approved and queued; gates: notice wording → say what is needed; copy drift → index takes the standard's | ledger, loop-findings S13

### Previous handoff (S17 → S18), verbatim

**Next session (S18):** S17 ran on `main` (local `main` reset to `origin/main` at e2bb697, which matched the session's assigned branch; the remote `claude/awesome-meitner-kkmh8h` was never created) and pushed each fix there: 8e40f96, 13bcc9b, 13b7c75 and the close-out are live on GitHub Pages. Work on `main` again: one commit per iteration, each push a deploy.
⚑ next: H on index.html — the never-run cells are D on math-minute (S12's shared blocks, the twins identical outside their selectors, S13), H everywhere and M on index and math-minute. H has never run anywhere and is the feature-seed intake (the micro-feature question rests under Awaiting), so H first, on index.html, the page with the most teacher-facing surface; M on index next (its phone layout was fixed in S17, its own Mixed / ops panels at phone width only spot-checked).
⚑ Queues: shared first touches — the 16 px phone fields (P3, S17: iOS zooms a focused field under 16 px; prove the computed size at ≤560 / ≤480 px and desktop unchanged), JPEG 0.8 (approved S2; `--cdn` bytes and a zoomed raster), the code panel under the button row (S5), reduced motion (P4), the target sizes (P4), the favicon (P4, gate 3), the sideways sheet preview on phones (P4, S17). index.html — the ops-panel labels (C, S10), the approved 30-cap note (S11), its divisor 3 px low (approved S10), the approved long-header shrink and no zero fraction differences, the lenient grade / count parse (S11), the per-operation decimal key zeros (S11), the `students` payload key (P4), the panels' group context (P4, S16).
⚑ New probe (S17): `S17-phone-layout` (`--ref e2bb697` fails 20, `--ref 8e40f96` fails index's 8, `--ref 13bcc9b` fails math-facts' 1). Arm R's set for S18 is S16-focus and S17-phone-layout. Trap: index.html's static `<style>` loses to `injectStyles()` at equal specificity (the injected sheet is appended later), so any static rule meant to override an injected one needs `#mwg-app`; measure the computed style, never trust the source.
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S17 asked nothing about it); build a seed only when the maintainer names one.

## S19 (2026-11-08) — pass M (mobile & touch) on index.html; three fixes, pushed to `main`

- Run on `main` (local `main` at `origin/main`, f9e7b6a; the assigned `claude/awesome-meitner-kkmh8h` carried nothing
  `main` lacked); each fix pushed as it landed.
- Arm R: the smoke, S17-phone-layout and the three S18 probes green.
- Pass M on index.html (scratch `s19/m-index.mjs`, `s19/cp.mjs`, `s19/cut.mjs`, `s19/contact.mjs`): iPhone SE, iPhone
  13 in both orientations, iPad Mini in both, a 350 px frame; fresh, the validation box and Fix, the Mixed and
  Fraction / Decimal panels, the code panel, Advanced, after a generate. No new defect but the Problem Count select's
  cut text (also on the desktop, P4); the known 14 px fields, small targets, ops labels and sideways sheet confirmed.
- The S18 P2 re-measured on the real artifact (scratch `s19/long.mjs`, `s19/hook.mjs`, `s19/h2c-field.mjs`): the
  English floor names cut mid-letter in Save PDF confirmed; "a Hebrew name that fits loses its first letter in the
  PDF" refuted — S18's script put the results back after the app root, outside its scoped `box-sizing`, so the
  regenerate measured a wider header. Found instead: a Hebrew name too long at 11 px lost its first name in print too.
- Fixes: the written "…" at the 11 px floor on all three pages (84025f7); index's printed name in a `<bdi>` (bf9f2c7,
  approved S18); the twins' Fill Down confirm (c68f197, approved S18); CLAUDE.md (81e3d8c). Every page then stood on
  its cap, so the fourth slot went unused; index's Fill Down half and the 16 px fields wait.
- Gates: none asked (both gated changes were approved in S18; the rest were bug fixes).

### Done rows archived from the ledger (S14, verbatim)

- [x] S14 | 2026-11-06 | c984c02 | index.html, scripts/loop/probes/S14-index-copy.mjs | the code panel's help line, the "Use in Advanced Input" message and the two clear-roster confirms read as on the standard pages (approved S13, gate 2) | S14-index-copy: the four strings lifted from math-facts.html's source, index driven live (fails 4 on 9030fbe); smoke
- [x] S14 | 2026-11-06 | 9ffc917 | index.html, math-minute.html, math-facts.html, CLAUDE.md | the offline Save PDF notice reads "The PDF tools could not be downloaded. Check your connection and try again." (was "PDF library not loaded yet…"; approved S2); the same line on all three pages, CLAUDE.md's guard sentence with it | the smoke's offline arm on every page: both cdnjs requests attempted, the new notice shown, 0 page errors; 60 of 60
- [x] S14 | 2026-11-06 | 86643bb | math-minute.html, scripts/loop/probes/S11-robustness.mjs | an Advanced level is digits only ("7.5" and "1O" printed Levels 7 and 1 with no message, S11): both are reported as invalid; index's grade and count half stays queued | S11-robustness paste arm on math-minute: 7 sheets and 6 reports numbered 4–7, 10, 11 (fails 3 on the old parse); smoke
- [x] S14 | 2026-11-06 | — | docs/loop-findings.md | pass I on all three pages (fresh context, Save → reload in both modes, Clear Current vs Clear Saved cancelled and accepted, cross-page isolation with every storage call logged, hostile values in every saved field and every input): clean, 140 checks; the silent fallback on an unreadable payload is on all three pages (candidate broadened) | scratch s14/i-audit.mjs, loop-findings S14

### Previous handoff (S18 → S19), verbatim

**Next session (S19):** S18 ran on `main` and pushed each fix there: e71f8fc, fde4b66, 36f71e4 and the close-out are live on GitHub Pages. Work on `main` again: one commit per iteration, each push a deploy.
⚑ next: M on index.html — the never-run cells are D on math-minute (S12's shared blocks, the twins identical outside their selectors, S13), H on math-minute and math-facts, M on index and math-minute. M on index first: its own Mixed / ops panels at phone width were only spot-checked (S17), and the 16 px phone fields (P3) are its natural first fix; H on a twin next (the feature-seed intake for the Math Minute pages).
⚑ Queues: the new P2 first (a long name in Save PDF is cut mid-letter with no "…" on every page, and a long Hebrew name loses its first letter; S18). Approved and waiting: index's Hebrew `<bdi>` (its half of 36f71e4; S18-hebrew-name lists only the twins until then), Fill Down's confirm on all three (S18), JPEG 0.8 (S2), the 30-cap note (S11), the long-header shrink (S4) and no zero fraction differences (S6), the divisor 3 px low (S10). Shared first touches otherwise — the 16 px phone fields (S17), the code panel under the button row (S5), the red border after Fix (S17), reduced motion and target sizes (P4).
⚑ New probes (S18): `S18-advanced-help` (`--ref 1f80a43` fails 7), `S18-unsaved-reminder` (`--ref e71f8fc` fails 12), `S18-hebrew-name` (`--ref fde4b66` fails 8). Arm R's set for S19 is S17-phone-layout and the three S18 probes. Trap: `S9-name-fit` compares sheets byte for byte with HEAD, so it fails on any uncommitted change to the printed name markup and passes once committed; a change there is proved by its other arms and the real PDF.
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S18 asked nothing about it); build a seed only when the maintainer names one. H on index refreshed two seeds (Paste names now lists index; Large print notes 30 as the smallest count).

## S20 (2026-11-08) — pass H (teacher walkthrough) on math-minute.html; three fixes, pushed to `main`

- Run on `main` (local `main` at `origin/main`, f14b27e; the assigned `claude/awesome-meitner-kkmh8h` has no remote
  branch); each fix pushed as it landed.
- Arm R: the smoke and the three S18 and two S19 probes green.
- Pass H on math-minute.html (scratch `s20/walk.mjs`, `s20/walk2.mjs`): a class of 22 by real clicks and keys, five
  Hebrew names, an IEP on Level 1, an advanced student on 13, the key for a parent helper; next week's move up, a new
  student, the Hebrew round trip, a spreadsheet paste, a substitute's blanks. 112 actions to build the class (42 typed
  numbers); S19's own Fill Down question was wrong in both weekly uses; a spreadsheet paste skipped line by line.
- Gates (two, both as recommended): Fill Down → keep a row on its own level, no question, the message names it;
  spreadsheet paste → read tabs and add a help line.
- Fixes: the twins' Fill Down keep rule (aafa34e; S20-fill-down supersedes S19-fill-down); the three-page spreadsheet
  paste (b7eb193; first shaped as "any tab splits", which broke S11-robustness's stray tab, reshaped before commit to
  "short of its fields by commas"); index's Fill Down half in the same shape (8083292); CLAUDE.md (f3f6a81). Every page
  then stood on its cap; the fourth slot went unused.
- Divergence: a `git stash` during a background S11-robustness run spoiled that run (the harness serves the working
  tree); stopped and rerun alone, green. Recorded as a trap.

### Done rows archived from the ledger (S15, verbatim)

- [x] S15 | 2026-11-06 | 69deb36 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S15-head.mjs | the GitHub Pages copies declare `noindex` (the public pages are mathsheet.io's WordPress pages, which iframe the copies and carry the titles, descriptions and search metadata; approved S15, gate 2); one line on all three pages | S15-head: lang, charset, viewport, title and exactly one robots tag read from each live document (fails 6 on 658ede3); smoke
- [x] S15 | 2026-11-06 | 77eda9d | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S15-unreadable-roster.mjs | an unreadable saved roster is reported once ("The saved roster could not be read, so the page starts with a blank roster.") and cleared, so the next load is plain (silent and repeating since S0; approved S15, gate 2); the same block on all three pages | S15-unreadable-roster: unparsable JSON and "null" on each page (fails 12 on 69deb36); S11 payload arm green; smoke
- [x] S15 | 2026-11-06 | d9912f2 | CLAUDE.md, docs/loop-passes.md | the deployment written down: GitHub Pages publishes `main`, mathsheet.io's WordPress pages embed the three files in 1400 px iframes, merging is what reaches teachers; pass L's premise amended | doc only; confirmed by the maintainer (gate, S15)
- [x] S15 | 2026-11-06 | — | docs/loop-findings.md | pass L on all three pages (the heads, the repo root, the public site and its sitemaps, the GitHub Pages copies, the pages inside a cross-origin iframe): the deployment found, the copies byte-identical to main; print and Save PDF work in the frame; a favicon queued, an auto-height seed; gates: indexing → noindex; unreadable roster → say and clear; deployment → confirmed | scratch s15/l-audit.mjs, s15/iframe-probe.mjs, loop-findings S15

### Per-session line archived from the ledger (S0, verbatim)

- S0 | 2026-11-04 | bootstrap | pass — | fixes 0 | smoke 3/3 green | baselines in loop-findings S0

### Previous handoff (S19 → S20), verbatim

**Next session (S20):** S19 ran on `main` and pushed each fix there: 84025f7, bf9f2c7, c68f197, 81e3d8c and the close-out are live on GitHub Pages. Work on `main` again: one commit per iteration, each push a deploy.
⚑ next: H on math-minute.html — the never-run cells are D, H and M on math-minute and H on math-facts. H on math-minute first: the feature-seed intake for the timed sheets, on the page with the most never-run cells; D on math-minute after it (S12's shared blocks, the twins identical outside their selectors, S13), then H on math-facts.
⚑ Queues: approved and waiting — index's Fill Down question (its half of c68f197: a row differing in grade, type or count, or in its ops and Mixed picks), JPEG 0.8 (S2), the 30-cap note (S11), the long-header shrink (S4), no zero fraction differences (S6), the divisor 3 px low (S10). Shared first touches — the 16 px phone fields (S17; index's 16 fields confirmed S19), the code panel under the button row (S5), the red border after Fix (S17), reduced motion and target sizes (P4). Index alone: the ops labels (P3, the pairing unclear at phone width), the Count select's cut text (P4, gate 2 or 4).
⚑ New probes (S19): `S19-long-name` (`--ref f9e7b6a` fails 42) and `S19-fill-down` (`--ref bf9f2c7` fails 10); `S18-hebrew-name` now covers index (`--ref 84025f7 --only index.html` fails 4). Arm R's set for S20 is the three S18 probes and the two S19 probes. Trap (S19): a script that moves the results for print must put them back where they were (`parentNode` / `nextSibling`): after the app root they lose its scoped `box-sizing`, the header widens and the next generate sizes names differently — S18's "a Hebrew name loses its first letter in the PDF" was that, refuted.
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S19 asked nothing about it); build a seed only when the maintainer names one.

## S21 (2026-11-08) — pass H (teacher walkthrough) on math-facts.html; three fixes, pushed to `main`

- Run on `main` (local `main` at `origin/main`, f5a60c2); each fix pushed once verified.
- Arm R: the smoke, `S19-long-name` and the two S20 probes green.
- Pass H on math-facts.html (scratch `s21/walk.mjs`, `s21/walk2.mjs`): a second-grade class of 22 by real clicks and
  keys, five Hebrew names, an IEP on +0 +1, an advanced student on mixed +/−, the key for a parent helper; next week's
  +3 → +4, the Advanced box as a teacher writes codes, a spreadsheet's level column, a substitute's blanks. S20's Fill
  Down rule held; 15 of 34 plausible code spellings skipped, 9 of them a real code.
- Gate (one, as recommended): a spreadsheet's "+3" stored as 3 → explain it in the skipped line (queued: math-facts on
  its cap).
- Fixes: math-facts' codes read whatever their capitals, spaces or dash (caedad5); Fill Down's message beside its
  button on all three pages (516b2d4); index's fraction subtraction takes away a smaller fraction, approved S6 (99911b1);
  CLAUDE.md (904695f). math-facts and index then on their caps; math-minute's one touch left had no autonomous item.
- Method note: `S11-robustness` ran from a frozen `git worktree` of caedad5 in the scratchpad while fix 2 was edited
  (S20's stash trap avoided). Four stale probes listed in the handoff.

### Done rows archived from the ledger (S16, verbatim)

- [x] S16 | 2026-11-06 | 6daf036 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S16-focus.mjs | focus follows every action: Delete → the next row's Delete; the code panel opens with focus in the code, Close / Escape return it to the opener, Use lands in the Advanced box; Fix focuses the first highlighted field (its scroll had never run); the same block thrice | S16-focus: activeElement after every keyboard action (fails 8 of 9 a page on 196dd4a); smoke
- [x] S16 | 2026-11-06 | 635eadc | index.html, math-minute.html, math-facts.html | the Advanced Code textarea is named "Advanced Input Code" by the panel's title (`aria-labelledby`; the one unnamed field since S0, and the field that takes focus on open since 6daf036) | S16-focus name arm, from the accessibility tree with the panel open (fails 3 on 6daf036); smoke
- [x] S16 | 2026-11-06 | dba73d2 | CLAUDE.md | the focus convention and the textarea's name added to the Accessibility bullet | doc only
- [x] S16 | 2026-11-06 | — | docs/loop-findings.md | pass D on index.html's own blocks (the Mixed and ops panels, the code panel, the injected styles: names, ancestors, tab stops, contrast, focus rings, targets, keyboard): every control named and keyboard-operable, contrast ≥ 4.65, UA focus rings; no group context (P4 queued); 23 px buttons and 13 px checkboxes into the target P4; the stretched ops checkbox box into the C P3 | scratch s16/d-index.mjs, loop-findings S16

### Per-session line archived from the ledger (S1, verbatim)

- S1 | 2026-11-04 | pass A on index.html (6 measured arms + a critic; 24 findings, all verified real) | fixes 3 (two P2 + two P3 in 3 commits, all pushed to main) | smoke 3/3 green + `--cdn` | 4th fix blocked by the 2-per-page cap

### Previous handoff (S20 → S21), verbatim

**Next session (S21):** S20 ran on `main` and pushed each fix there: aafa34e, b7eb193, 8083292, f3f6a81 and the close-out are live on GitHub Pages. Work on `main` again: one commit per iteration, each push a deploy.
⚑ next: H on math-facts.html — the never-run cells are D and M on math-minute and H on math-facts. H on math-facts first: the twin of S20's walkthrough (its 71 fact codes, the weekly move by fact family); D on math-minute after it (S12's shared blocks, the twins identical outside their selectors, S13), then M on math-minute.
⚑ Queues: Fill Down's message beside its button (P3, all three; S20's kept-rows note lands 2,900 px below the button with 22 rows — a shared first touch). Approved and waiting — JPEG 0.8 (S2), the 30-cap note (S11), the long-header shrink (S4), no zero fraction differences (S6), the divisor 3 px low (S10). Shared otherwise — the 16 px phone fields (S17), the code panel under the button row (S5), the red border after Fix (S17), reduced motion and target sizes (P4). Index alone: the ops labels (P3), the Count select's text (P4, gate 2 or 4).
⚑ New probes (S20): `S20-fill-down` replaces `S19-fill-down` (deleted: it asserted S19's question; `--ref f14b27e` fails 14 on the twins, `--ref b7eb193 --only index.html` fails 7) and `S20-spreadsheet-paste` (a real Ctrl+V; `--ref aafa34e` fails 30). Arm R's set for S21 is `S19-long-name` and the two S20 probes. `S7-bracket-names` (1) and `S7-skipped-list` (6) fail on HEAD and on f14b27e alike (stale comparisons, not S20's).
⚑ Trap (S20): never `git stash` while a probe runs in the background — the harness serves the working tree, so the run reads the stashed files (S20's S11-robustness run was spoiled and rerun). `S11-robustness` takes ~10 minutes: run it in the background, alone.
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S20 asked nothing about it); build a seed only when the maintainer names one. H on math-minute marked the Time / Score strip as the one thing a timed sheet's header lacks, and the compact key now lists math-minute.

## S22 (2026-11-08) — pass D (accessibility) on math-minute.html; four fixes, pushed to `main`

- Run on `main` (local `main` at `origin/main`, ac0a2e4); each fix pushed once verified.
- Arm R: the smoke, the two S20 and three S21 probes green.
- Pass D on math-minute.html (scratch `s22/d-mm.mjs`, `s22/d-mm2.mjs`): names from Chromium's accessibility tree in four
  states, Tab walks in both modes, every flow by keyboard (add, Fill Down, Duplicate, Delete, validation and Fix, the code
  panel, Use in Advanced Input, the toggle, Generate, Save PDF, both Clears), contrast, targets, live regions, WCAG text
  spacing, 200 % zoom. Two losses found and fixed: Save PDF dropped keyboard focus to the page's start (all three pages),
  the Level Reference read 1, 12, 2, 13.
- Gates: none asked (both D fixes change nothing a teacher sees; the two queued items were approved S21 and S4).
- Fixes: Save PDF's keyboard focus returns (7dbcdb9); math-minute's Level Reference in level order (a458824);
  math-facts' spreadsheet hint, approved S21 (3589e48); index's long descriptions shrink to fit, approved S4 (ef52c67);
  CLAUDE.md (94c4e71). Every page then on its cap.
- Method note: the first refocus shape also focused after a mouse click and scrolled a 22-row page ~470 px at the save's
  end; it was narrowed to a button showing its focus ring before commit. `S10-pdf-progress` found stale (since S18).

### Done rows archived from the ledger (S17, verbatim)

- [x] S17 | 2026-11-07 | 8e40f96 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S17-phone-layout.mjs | the button rows wrap at ≤860 px (centred and `nowrap`, Add Student was out of reach on every phone); index's rule carries `#mwg-app`; the same block thrice | S17-phone-layout arm 1, 5 devices and a 350 px frame (fails 20 on e2bb697); desktop pixel-identical; a real iframe on an iPhone 13; smoke
- [x] S17 | 2026-11-07 | 13bcc9b | index.html, scripts/loop/probes/S17-phone-layout.mjs | index's responsive rules apply again (≤860 the Advanced box stacks, ≤700 two roster columns, ≤480 one): the injected base rules, appended after the static sheet, had won at every width, leaving five 60 px roster fields and a 46 px paste box (18 px on an iPhone SE) | arm 2: column counts per width (fails 8 on 8e40f96); desktop pixel-identical; the Mixed and Fraction-ops panels fit at 320 and 390 px; smoke
- [x] S17 | 2026-11-07 | 13b7c75 | math-facts.html | the Advanced help reads "Fact codes are listed in the Level Reference." (it said "to the right", below the box at ≤860 px; approved S17, gate 2) | arm 3 reads the live help (fails 1 on 13bcc9b); smoke
- [x] S17 | 2026-11-07 | — | docs/loop-findings.md | pass M on math-facts.html (iPhone SE, iPhone 13 and iPad Mini in both orientations, a 350 px frame; fresh, validation, code panel, Advanced, results): the button row on all three pages and index's dead responsive block found and fixed; code panel and validation box fit, Close reachable; no `inputmode` forced; 14 px fields (iOS focus zoom) and the sideways sheet preview queued | scratch s17/m-audit.mjs, s17/iframe-m.mjs, loop-findings S17

### Per-session line archived from the ledger (S2, verbatim)

- S2 | 2026-11-05 | pass B on math-facts.html (geometry 100 sheets, real PDF rasters, A4, font census, advanced round trip) | fixes 3 (two P2 print defects, one P3; on branch claude/fervent-lovelace-urwaob, not main) | smoke 3/3 green + `--cdn` | every page ended on its two-touch cap

### Previous handoff (S21 → S22), verbatim

**Next session (S22):** S21 ran on `main` and pushed each fix there: caedad5, 516b2d4, 99911b1, 904695f and the close-out are live on GitHub Pages. Work on `main` again: one commit per iteration, each push a deploy.
⚑ next: D on math-minute.html — the never-run cells are D and M on math-minute. D first (S12 measured the shared blocks on the twins and S13 showed them identical outside their selectors, so expect its Level select, its reference and the S20–S21 rows), then M on math-minute.
⚑ Queues: approved and waiting — math-facts' spreadsheet hint (S21), JPEG 0.8 (S2), the 30-cap note (S11), the long-header shrink (S4), the divisor 3 px low (S10). Shared — the 16 px phone fields (S17), the code panel under the button row (S5), the red border after Fix (S17), reduced motion and targets (P4). Index alone: the ops labels (P3), its case-sensitive Advanced type (P4, the twin of caedad5), the Count select's text (P4, gate 2 or 4).
⚑ New probes (S21): `S21-fact-codes` (`--ref f5a60c2` fails 22), `S21-fill-down-status` (`--ref caedad5` fails 39; `S20-fill-down` reads the new line, the status box on older refs), `S21-fraction-sub` (`--ref 516b2d4` fails 9). Arm R's set for S22: the two S20 and three S21 probes. Long probes (`S11-robustness`, ~10 min) can run from a `git worktree` of HEAD in the scratchpad while the next fix is edited.
⚑ Stale probes, failing before S21 and unchanged by it: `S7-bracket-names` (1), `S7-skipped-list` (6), `S8-index-key-division` (2, its seeded identity to d3ef5c6), `S5-key-rows12` (its reference 5c3b01a is not in this repository) — worth one iteration to repair or retire to the archive.
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S21 asked nothing about it); build a seed only when the maintainer names one. H on both timed pages found the Time / Score strip the one thing their header lacks.

### After the S22 close-out: the maintainer's answers

- Struck Feature seed (the maintainer, after S22: "No time/score" — not to be proposed again), verbatim:
  - [ ] seed | math-minute.html, math-facts.html | "Time / Score" strip in the header (toggle): `Time: ____  Score: ____ / N`, N from the level's count (S20 and S21 H: the one thing a timed sheet's header lacks, on both timed pages) | from S0
- The S22 note on math-minute's "11 - Easy X" (a screen reader reads the letter X) is removed from the type-ahead P4:
  the maintainer keeps the letter X (S9, gate 2).

## S23 (2026-11-08) — pass M (mobile & touch) on math-minute.html, then A (performance) on index.html; four fixes, pushed to `main`

- Run on `main` (local `main` at `origin/main`, 37af5e4); each fix pushed once verified.
- Arm R: the smoke and the three S21 and four S22 probes green, but `S22-desc-fit` failed 2 runs in 5: a 0.1 px drift
  in one fraction cell under CPU load, the base against itself too (the probe's precision; repaired in the tooling fix).
- Pass M on math-minute.html (scratch `s23/m-mm.mjs`, `s23/contact.mjs`): clean but for two queued items, both fixed.
  The clean surface bought a second: A on index.html (`s23/a-index.mjs`, `s23/prof.mjs`, `s23/pdf-index.mjs`): clean
  but for a 2–5× slower generate with the Number removed, fixed.
- Gates: none asked (a perf fix with byte-identical sheets, a phone-width CSS fix, a highlight that follows its field,
  probe repairs).
- Fixes: index's no-Number name fit in one layout (f57d63c); 16 px phone fields on all three (af59ae5); the twins' red
  border (2597f1c); arm R's seven stale probes (6611a2f); CLAUDE.md (e258268). Every page then on its cap.
- Method note: the first 16 px shape cut the twins' Header line example; widened in the same commit. The clone was
  shallow, so `S5-key-rows12`'s 5c3b01a looked missing (S22 listed it so): `git fetch --unshallow` found it.

### Done rows archived from the ledger (S18, verbatim)

- [x] S18 | 2026-11-07 | e71f8fc | index.html, scripts/loop/probes/S18-advanced-help.mjs | the Advanced help names the types the page reads (add1–add5 … div1–div5; its "addition" examples and type names were all skipped) and the page reads fractions[add] as written there (approved S18, gate 2) | S18-advanced-help: every example and named type generates (fails 7 on 1f80a43); smoke
- [x] S18 | 2026-11-07 | fde4b66 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S18-unsaved-reminder.mjs | after Generate & Print or Save PDF, a roster that is not the saved one gets "This roster isn't saved. Click Save Roster to keep it for next time." (approved S18, gate 2; nothing saved without the click) | S18-unsaved-reminder on all three pages (fails 12 on e71f8fc); smoke
- [x] S18 | 2026-11-07 | 36f71e4 | math-minute.html, math-facts.html, scripts/loop/probes/S18-hebrew-name.mjs | a printed name sits in a `<bdi>`, so "שרה כ." ends in its period (it printed at the name's start); English names unchanged (approved S18, gate 6); index's half queued | S18-hebrew-name (fails 8 on fde4b66); real print and cdnjs Save PDF rasterized before / after; smoke
- [x] S18 | 2026-11-07 | ecc8741 | CLAUDE.md | the unsaved-roster notice, the printed name's `<bdi>` and index's Advanced type codes written down | doc only
- [x] S18 | 2026-11-07 | — | docs/loop-findings.md | pass H on index.html (a class of 22 by real clicks: Hebrew names, two other levels, an IEP, a parent helper's key, a substitute's blanks; the Advanced box as the help teaches it): 52 actions to build, lost on reload; the help's every example skipped; Fill Down over set rows; gates: four, all as recommended | scratch s18/walk*.mjs, loop-findings S18

### Per-session line archived from the ledger (S3, verbatim)

- S3 | 2026-11-05 | pass A on math-minute.html (node census vs math-facts, 150-sheet generate per level and cpu4, roster form, load, retention, PDF per page to 150 pages) | fixes 3 (one P2 in two commits, one P3; on branch claude/fervent-lovelace-urwaob, not main) | smoke 3/3 green + `--cdn` | every page ended on its two-touch cap again

### Previous handoff (S22 → S23), verbatim

**Next session (S23):** S22 ran on `main` and pushed each fix there: 7dbcdb9, a458824, 3589e48, ef52c67, 94c4e71 and the close-out are live on GitHub Pages. Work on `main` again: one commit per iteration, each push a deploy.
⚑ next: M on math-minute.html — the last never-run cell (S17 measured the shared rows on all three pages and S19 index; expect math-minute's Level select and reference at phone width, the S20–S22 rows, the Fill Down line at 390 px).
⚑ Queues: approved and waiting — JPEG 0.8 (S2), the 30-cap note (S11), the divisor 3 px low (S10). Shared — the 16 px phone fields (S17), the red border after Fix (S17), the code panel under the button row (S5), reduced motion and targets (P4). Index alone: the ops labels (P3, C), its case-sensitive Advanced type (P4, the twin of caedad5), the Count select's text (P4, gate 2 or 4).
⚑ New probes (S22): `S22-pdf-focus` (`--ref ac0a2e4` fails 15), `S22-level-reference` (`--ref 7dbcdb9` fails 6), `S22-spreadsheet-hint` (`--ref a458824` fails 4), `S22-desc-fit` (`--ref 3589e48` fails 3; ~1 min). Arm R's set for S23: the three S21 and four S22 probes. `S9-name-fit` compares every sheet with HEAD byte for byte: run it after a sheet-markup commit lands, not before.
⚑ Stale probes, failing before S22 and unchanged by it: `S10-pdf-progress` (3: its "ends on PDF saved!" predates S18's unsaved-roster line), `S7-bracket-names` (1), `S7-skipped-list` (6), `S8-index-key-division` (2), `S5-key-rows12` (its reference 5c3b01a is not in this repository) — one tooling iteration to repair or retire them.
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S22 asked nothing about it); build a seed only when the maintainer names one. The Time / Score strip is declined (the maintainer, after S22: "No time/score"): struck to the archive, not to be proposed again.

## S24 (2026-11-08) — pass B (print & export) on math-facts.html, then A (performance) on math-minute.html; three fixes, pushed to `main`

- Run on `main` (local `main` at `origin/main`, d31ff06; the clone was full this time); each fix pushed once verified.
- Arm R: the smoke and the four S22 and three S23 probes green.
- Pass B on math-facts.html: clean but for the two known Advanced Code P4s. The clean surface bought a second: A on
  math-minute.html, which found every generate 1.6–2.4× slower than S3's on the same machine, bisected to 36f71e4
  (S18's `<bdi>`; S19 carried it to index.html): Chromium's fast innerHTML parser takes no `<bdi>`.
- Gates: none asked (a markup swap with pixel-identical output, the twins' S23 fix completed on index, dead CSS).
- Fixes: the name span on all three pages, with CLAUDE.md and the S23-name-fit-layout repair (037221c); index's red
  border (7f40755); the twins' dead CSS (9fb3e5d). Every page then on its cap; the fourth slot unused.
- Method notes: S23-name-fit-layout compared every sheet byte for byte with 37af5e4 by default, the decay S23 recorded
  for the other probes, and read red after the span: its default now compares the name lines. `S24-name-parse` at 1.3×
  and 5 runs left index's control at 1.34×: 7 runs and 1.25× read 0.94–1.09× on the fix, 1.32–1.74× on d31ff06.

### Done rows archived from the ledger (S19, verbatim)

- [x] S19 | 2026-11-08 | 84025f7 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S19-long-name.mjs | a name still too long at the 11 px floor ends in a written "…" (`endWithEllipsis()`): Save PDF cut it mid-letter (html2canvas draws no CSS ellipsis), and a Hebrew name's "…" took its first name in print and PDF; the same block thrice | S19-long-name (fails 42 on f9e7b6a); real print and cdnjs Save PDF rasters before / after on all three: only the floor names differ; smoke
- [x] S19 | 2026-11-08 | bf9f2c7 | index.html, scripts/loop/probes/S18-hebrew-name.mjs | index's printed name in a `<bdi>` (`nameHtml()`, its half of 36f71e4; approved S18, gate 6): "שרה כ." ends in its period, a cut Hebrew name in its "…" | S18-hebrew-name now covers index (fails 4 on 84025f7); print and Save PDF rasters: only the Hebrew names differ; smoke
- [x] S19 | 2026-11-08 | c68f197 | math-minute.html, math-facts.html, scripts/loop/probes/S19-fill-down.mjs | Fill Down asks before changing a row with its own level, "Fill Down will change Students 4 and 5, which have their own settings. Continue?" (approved S18, gate 2); Cancel changes nothing; index's half queued | S19-fill-down: plural, singular, three rows, unasked fills, Student 1 empty (fails 10 on bf9f2c7); smoke
- [x] S19 | 2026-11-08 | 81e3d8c | CLAUDE.md | the written "…" at the floor, index's `<bdi>`, Fill Down's question | doc only
- [x] S19 | 2026-11-08 | — | docs/loop-findings.md | pass M on index.html (iPhone SE, iPhone 13 and iPad Mini in both orientations, a 350 px frame; fresh, validation and Fix, the Mixed and ops panels, the code panel, Advanced, results): no sideways scroll before a generate, focus lands in view, no fixed element; the Count select's cut text queued (P4); S18's "Hebrew first letter in the PDF" refuted (a test artifact) | scratch s19/m-index.mjs, s19/contact.mjs, loop-findings S19

### Per-session line archived from the ledger (S4, verbatim)

- S4 | 2026-11-05 | pass B on index.html (geometry of 2,208 sheets, seeded Save PDF vs print rasters, Advanced Code round trip, saved payload, header toggles) | fixes 3 + a probe (two P2, one P4; on branch claude/fervent-lovelace-urwaob, not main) | smoke 3/3 green + `--cdn`; probe green | index.html ended on its cap with two P2s queued

### Previous handoff (S23 → S24), verbatim

**Next session (S24):** S23 ran on `main` and pushed each fix there: f57d63c, af59ae5, 2597f1c, 6611a2f, e258268 and the close-out are live on GitHub Pages. Work on `main` again: one commit per iteration, each push a deploy. A cloud session's clone is shallow: `git fetch --unshallow origin main` before a `--ref` or `--control` names an old commit.
⚑ next: B on math-facts.html — the stalest cell (S2); every cell has now run. Expect S5's and S8's print changes, S9's name shrink, S18's `<bdi>`, S19's written "…" and S7's header line on paper and in a real `--cdn` PDF, against the S2 baselines in loop-findings.
⚑ Queues: approved and waiting — JPEG 0.8 (S2), the 30-cap note (S11), the divisor 3 px low (S10). index alone: the red border after Fix (P3, the twins' half shipped S23), the ops labels (P3, C), its case-sensitive Advanced type (P4), the Count select's text (P4, gate 2 or 4). Shared — the code panel under the button row (P3, S5), reduced motion and targets (P4).
⚑ New probes (S23): `S23-name-fit-layout` (`--ref 37af5e4` fails 3), `S23-phone-fields` (`--ref f57d63c` fails 12), `S23-red-border` (`--ref af59ae5` fails 6). Arm R's set for S24: the four S22 and three S23 probes. Repaired in S23 and green: `S5-key-rows12`, `S7-bracket-names`, `S7-skipped-list`, `S8-index-key-division`, `S10-pdf-progress`, `S11-robustness`, `S22-desc-fit` (byte-for-byte arms against old commits now need `--identity`).
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S23 asked nothing about it); build a seed only when the maintainer names one. The Time / Score strip is declined (after S22): not to be proposed again.

## S25 (2026-11-08) — pass B (print & export) on index.html; two fixes, one approved at gate 6, pushed to `main`

- Run on `main` (local `main` at `origin/main`, 2f9a38f; the clone full); each fix pushed once verified.
- Arm R: the smoke and the three S23 and two S24 probes green.
- Pass B on index.html: every grade × type × count in three configurations (3,160 sheets), A4, a real 126-page Save
  PDF, the round trip and payload. Found: a division written across (Long Division at Grades 5–8, a Mixed sheet's
  divisions there) 54 px a row in 43 px tracks, the 15th row 0.12 in from the paper's edge; its key a run-together
  column of own-bar divisions; S4's PDF rows P4 measured at up to 13 px; the last key's harmless `print-break` again.
- Gates: one (gate 6: the across division sheet and key, with a before/after picture) → "Both", as recommended.
- Fixes: the PDF clone at print's rows (abdbd88); the across division sheet and key (7435289, with the S6 and S22
  probe repairs). index.html then on its cap; the twins had no autonomous item of their own; two slots unused.
- Method notes: S4's B probe read the across sheets' depth from text rects and called Long Division keys 799 px, never
  the worksheet's 804.5 bracket; the cell-overflow was invisible to every "ink inside its cell" check because each cell
  box itself ran past its track. A 140 ink threshold counted the across answer line (rgb 136) in print but not in the
  JPEG: 100 reads dark ink only. A layout claim about the PDF is proved on the clone (stubbed libraries), the raster
  only for what is drawn (html2canvas puts the rows-12 keys' tight glyphs ~3 px off print over an identical layout).

### Done rows archived from the ledger (S20, verbatim)

- [x] S20 | 2026-11-08 | aafa34e | math-minute.html, math-facts.html, scripts/loop/probes/S20-fill-down.mjs | Fill Down keeps a row on its own level and names it, no question (approved S20, gate 2): S19's question named all 21 rows when the class moved up, and for a new student OK reset the IEP row while Cancel left the new one empty; the same block on both | S20-fill-down: a new row, the class moved, a reload, the singular, by hand, arrow keys, Student 1 empty (fails 14 on f14b27e); smoke
- [x] S20 | 2026-11-08 | b7eb193 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S20-spreadsheet-paste.mjs | a roster pasted from a spreadsheet is read: a line short of its fields by commas is read by its tabs, a stray tab in a comma line stays a space; the help says so (approved S20, gate 2) | S20-spreadsheet-paste by a real Ctrl+V on all three (fails 30 on aafa34e); S11-robustness green; smoke
- [x] S20 | 2026-11-08 | 8083292 | index.html, scripts/loop/probes/S20-fill-down.mjs | index's Fill Down half, the S20 shape: a row on its own grade, type, count, Mixed picks or operations keeps them, "…Students 4 and 5 kept their own settings." (`settingsKey()`) | S20-fill-down's index arm, an unchecked operation and Mixed pick included (fails 7 on b7eb193); smoke
- [x] S20 | 2026-11-08 | f3f6a81 | CLAUDE.md | Fill Down's keep rule and the parse's tab rule | doc only
- [x] S20 | 2026-11-08 | — | docs/loop-findings.md | pass H on math-minute.html (a class of 22 by real clicks and keys, five Hebrew names, an IEP, an advanced student, a parent helper's key; next week's move up, a new student, a spreadsheet paste, a substitute's blanks): 112 actions to build, 42 of them numbers; S19's Fill Down question wrong for both weekly uses; gates: two, both as recommended | scratch s20/walk.mjs, s20/walk2.mjs, loop-findings S20

### Per-session line archived from the ledger (S5, verbatim)

- S5 | 2026-11-05 | pass C on math-facts.html (UI at 1280 / 800 px, Advanced mode, the code panel, the error list; rendered sheets and keys of every level class) | fixes 4 (two gated print changes on both standard pages, two index P2s; on branch claude/fervent-lovelace-urwaob, not main) | smoke 3/3 green + `--cdn`; probes green | every page ended on its two-touch cap

### Previous handoff (S24 → S25), verbatim

**Next session (S25):** S24 ran on `main` and pushed each fix there: 037221c, 7f40755, 9fb3e5d and the close-out are live on GitHub Pages. Work on `main` again: one commit per iteration, each push a deploy. If `git rev-parse --is-shallow-repository` says true, `git fetch --unshallow origin main` before a `--ref` names an old commit.
⚑ next: B on index.html — the stalest cell (S4); B has now run twice on the twins. Expect S5's key division, S9's PDF frame, S9's name shrink, S19's written "…", S22's description fit and S24's name span on paper and in a real `--cdn` PDF, against the S4 baselines; S4's probes carry index's classes, S8's the twins' method.
⚑ Queues: approved and waiting — JPEG 0.8 (S2), the 30-cap note (S11), the divisor 3 px low (S10). index alone: the ops labels (P3, C), its case-sensitive Advanced type (P4), the Count select's text (P4, gate 2 or 4). Shared — the code panel under the button row (P3, S5), reduced motion and targets (P4).
⚑ New probes (S24): `S24-name-parse` (`--ref d31ff06` fails 3; the page's generate as a ratio of the bare name's, 7 runs alternated, so a slow machine slows both), `S24-index-red-border` (`--ref 037221c` fails 9). Arm R's set for S25: the three S23 and two S24 probes. `S23-name-fit-layout` now compares name lines; its byte arm needs `--identity`.
⚑ A new element in the sheet markup: time a generate with it swapped for a `<span>` first; a tag Chromium's fast innerHTML parser does not take (`<bdi>`) slowed every sheet for six sessions unseen (S24).
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S24 asked nothing about it); build a seed only when the maintainer names one. The Time / Score strip is declined (after S22): not to be proposed again.

## S26 (2026-11-09) — pass C (aesthetics) on math-facts.html; two fixes, pushed to `main`

- Run on `main` (local `main` at `origin/main`, 24cec4f; the clone full); each fix pushed once verified.
- Arm R: the smoke and the two S24 and two S25 probes green.
- Pass C on math-facts.html: the UI at 1280 / 800 in seven states, nine levels' sheets and keys under print with a header
  line, Hebrew, long and empty names. S5's baselines and the fixes since hold. Found: the three default rows (a fresh page,
  Clear Current Roster) carry no Name placeholder on all three pages; a key's answers come in two sizes (17 px under a
  stack, 20 px over a bracket; index three at rows-12). Both queued P4; the second is a printed-key change (gate 6).
- Gates: none asked. The key's answer size needs index, which the session's fixes had capped, so the question waits.
- Fixes: index's operation checkboxes beside their labels (ed7f879, S10's P3, the top Candidate); the JPEG 0.8 approved
  in S2 on all three pages with CLAUDE.md (78e0b94). index then on its cap; the twins had no autonomous item of their own
  (the Name hint is the same line on index); two slots unused.
- Method notes: a click-by-coordinates check failed 1 of 2 on both commits — the Mixed label was below the viewport, where
  a mouse click lands nowhere; scroll the element in first. A full-page screenshot leaves `content-visibility: auto`
  sheets blank past the first screen, and a shot 200 ms after a smooth scroll catches it mid-way.

### Done rows archived from the ledger (S21, verbatim)

- [x] S21 | 2026-11-08 | caedad5 | math-facts.html, scripts/loop/probes/S21-fact-codes.mjs | an Advanced fact code is read whatever its capitals, spaces or dash ("+0 +1" as the level menu shows it, "Doubles", "Mix +30", "x 3", "–3"); codes that name no level are still skipped | S21-fact-codes: 30 spellings and 7 non-codes (fails 22 on f5a60c2); S11-robustness, S20-paste, S13-escape green; smoke
- [x] S21 | 2026-11-08 | 516b2d4 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S21-fill-down-status.mjs, scripts/loop/probes/S20-fill-down.mjs | Fill Down's message in a polite live line beside its button (with 22 rows it landed ~2,900 px below, out of sight); any change to the roster clears it; the same block thrice | S21-fill-down-status at 1280 and 390 px (fails 39 on caedad5); S20-fill-down reads the line; S12, S16, S17 probes green; screenshots; smoke
- [x] S21 | 2026-11-08 | 99911b1 | index.html, scripts/loop/probes/S21-fraction-sub.mjs | a fraction subtraction takes away a smaller fraction (approved S6, gate 2): 26 % of "Fractions — Subtraction" and 34 % of the Fractions type's subtractions were x − x = 0, a denominator of 2 always ½ − ½; addition unchanged | S21-fraction-sub, 12,000 problems (fails 9 on 516b2d4); S6-math-audit green, every key recomputed; smoke
- [x] S21 | 2026-11-08 | 904695f | CLAUDE.md | Fill Down's message beside its button; math-facts' lenient fact codes | doc only
- [x] S21 | 2026-11-08 | — | docs/loop-findings.md | pass H on math-facts.html (a class of 22 by real clicks and keys, five Hebrew names, an IEP on +0 +1, an advanced student, a parent helper's key; next week's +3 → +4, codes as a teacher writes them, a spreadsheet's levels, a substitute's blanks): S20's Fill Down rule held; 15 of 34 plausible spellings skipped, 9 a real code; gates: one, as recommended | scratch s21/walk.mjs, s21/walk2.mjs, loop-findings S21

### Per-session line archived from the ledger (S6, verbatim)

- S6 | 2026-11-05 | pass G on index.html (51 selectors × 200 sheets, 378,000 problems recomputed with exact rationals; every key right) | fixes 2 + micro-feature (on branch claude/clever-davinci-hhh4iz, not main, per the maintainer) | smoke 3/3 green; probes green | index.html ended on its cap with 3 P2s queued

### Previous handoff (S25 → S26), verbatim

**Next session (S26):** S25 ran on `main` and pushed each fix there: abdbd88, 7435289 and the close-out are live on GitHub Pages. Work on `main` again: one commit per iteration, each push a deploy. If `git rev-parse --is-shallow-repository` says true, `git fetch --unshallow origin main` before a `--ref` names an old commit.
⚑ next: C on math-facts.html — the stalest cell (S5), C last on the twins in S5 / S9: since then S7's header line, S9's name shrink, S17–S23's narrow-screen rows and 16 px fields, S21's Fill Down line, S22's spreadsheet hint. A dramatic change is gate 3, BEFORE screenshots first.
⚑ Queues: approved and waiting — JPEG 0.8 (S2), the 30-cap note (S11), the divisor 3 px low on index's stacked grids (S10; across, level since S25). index alone: the ops labels (P3, C), its case-sensitive Advanced type (P4), the Count select's text (P4, gate 2 or 4), the last key's `print-break` (P4). Shared — the code panel under the button row (P3, S5), reduced motion and targets (P4).
⚑ New probes (S25): `S25-pdf-rows` (`--ref 2f9a38f` fails 1; offline, the clone's cells against print's), `S25-across-division` (`--ref abdbd88` fails 6; its arm 2 compares every other sheet with abdbd88 byte for byte — move that arm behind `--identity` when a later approved change reaches those sheets). Repaired in 7435289: `S6-math-audit` reads the across key cell, `S22-desc-fit` leaves the across division sheets out. Arm R's set for S26: the two S24 and two S25 probes.
⚑ index.html's sheets print and export outside `#mwg-app`, so they lose its `box-sizing: border-box`: measure them under print, never on screen. A grid cell taller than its track (`min-height: 0` in a grid of set height) overflows into the next row unseen: compare each cell's box with its track (S25).
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S25 asked nothing about it); build a seed only when the maintainer names one. The Time / Score strip is declined (after S22): not to be proposed again.

## S27 (2026-11-09) — pass G (math correctness & pedagogy) on index.html; two fixes, both approved, on a branch

- Run on branch `claude/dazzling-gauss-uhpik9`, not `main`: the maintainer invoked the loop "on a branch until I tell
  you to push to main", so session-start step 5 (fast-forward `main`, push there) was set aside; the branch started at
  `main` (29e6a69). The clone was shallow: `git fetch --unshallow origin main` before S8's probe named d3ef5c6.
- Arm R: the smoke and the S25 ×2 and S26 probes green.
- Pass G on index.html: S6-math-audit (378,000 keys) all right; a scratch probe measured repeats per sheet, Division
  Level 5's quotients, the branches each grade reaches and Scientific Notation in seven locales. Four P3s logged.
- Gates: three in one call (gate 6 the dealing, gate 2 Level 5's range, gate 2 Rounding at grades 3–4): all three as
  recommended (like the twins; fix the range; Rounding at 3–4 with Mixed left as is).
- Fixes: Level 5's quotients (56b3b00), the dealing (86e0fd0). index then on its cap; Rounding at 3–4 and the locale wait.
  The twins had no autonomous item of their own.
- Method notes: keying the deck by markup missed Mixed's cross-level twins (7)70 from Division 2 and 3); at 300 draws a
  1-in-90 fact was missed on 2.5 % of sheets, at 1,000 none in 1,000. Three identity probes failed after the change: with
  the dealing switched off they matched the parent exactly, so only the drawn problems differ; their identity arms now
  run behind `--identity`. A sweep of all 48 probes at close-out: 47 green; S6-header-line's
  blank arm compared math-minute with its pre-feature page byte for byte, red since S18's name span: it now checks the
  property (no header line on any sheet or key when blank or spaces), the byte arm behind `--identity`.

### Done rows archived from the ledger (S22, verbatim)

- [x] S22 | 2026-11-08 | 7dbcdb9 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S22-pdf-focus.mjs | Save PDF gives keyboard focus back when the export ends (the disabled button dropped it to the page's start: the next Tab was the toggle at the top, ~120 Tabs from Save PDF with 22 students); a mouse click left as it was; the same block thrice | S22-pdf-focus offline: Enter, a Tab mid-export, a mouse click, the notice (fails 15 on ac0a2e4); S12-a11y, S16-focus green; smoke
- [x] S22 | 2026-11-08 | a458824 | math-minute.html, scripts/loop/probes/S22-level-reference.mjs | the Level Reference is written in level order and flows down its two columns (a screen reader read 1, 12, 2, 13, … 11); nothing moves | S22-level-reference at 1280, 800, 390 px: the AX tree reads 1–21, boxes and pixels identical to 7dbcdb9 (fails 6 on it; a planted 10-row grid fails); smoke
- [x] S22 | 2026-11-08 | 3589e48 | math-facts.html, scripts/loop/probes/S22-spreadsheet-hint.mjs | a skipped bare-number code adds "A spreadsheet turns +3 into 3: type it as '+3 there, or fix it here." (approved S21, gate 2); nothing guessed | S22-spreadsheet-hint, tab and comma lines, a Hebrew name (fails 4 on a458824); S21-fact-codes, S20-spreadsheet-paste, S13-escape-html green; smoke
- [x] S22 | 2026-11-08 | ef52c67 | index.html, scripts/loop/probes/S22-desc-fit.mjs | a long sheet or key description shrinks to fit its box (approved S4, gate 6): with 5 copies and keys 1,055 of 1,510 ran under "Worksheet 3 of 5" or lost "(Key 3 of 5)"; down to 9 px (the longest 9.5) on its line height, nothing moves | S22-desc-fit, 151 combinations × 3 shapes under print and Save PDF clones (fails 3 on 3589e48); header shots; S4, S9, S18, S19 probes green; smoke
- [x] S22 | 2026-11-08 | 94c4e71 | CLAUDE.md | Save PDF's keyboard focus returns; index's long descriptions shrink | doc only
- [x] S22 | 2026-11-08 | — | docs/loop-findings.md | pass D on math-minute.html (names from the AX tree in four states, Tab walks, every flow by keyboard, contrast, targets, live regions, text spacing, 200 % zoom): every control named, focus visible, contrast ≥ 4.61; Save PDF's lost focus (all three) and the Level Reference's reading order fixed; gates: none | scratch s22/d-mm.mjs, s22/d-mm2.mjs, loop-findings S22

### Per-session line archived from the ledger (S7, verbatim)

- S7 | 2026-11-05 | pass G on math-facts.html, then math-minute.html (clean, so it bought a second: 71 + 21 levels × 200 sheets, 674,000 problems recomputed; every key right, every deck as documented) | fixes 2 + micro-feature (on branch claude/clever-davinci-hhh4iz, not main, after S6) | smoke 3/3 green + `--cdn`; probes green | index.html and math-facts.html ended on their caps

### Previous handoff (S26 → S27), verbatim

**Next session (S27):** S26 ran on `main` and pushed each fix there: ed7f879, 78e0b94 and the close-out are live on GitHub Pages. Work on `main` again: one commit per iteration, each push a deploy. If `git rev-parse --is-shallow-repository` says true, `git fetch --unshallow origin main` before a `--ref` names an old commit.
⚑ next: G on index.html — the stalest cell (S6), G's oldest; since then index gained S8's key division, S10's one-line Rounding, S11's Decimals places, S21's fraction subtraction and S25's across division keys. Recompute every key with exact rationals as S6 did (its probes carry the method); A on math-facts and C on math-minute (both S9) come next.
⚑ Queues: approved and waiting — the 30-cap note (S11), the divisor 3 px low on index's stacked grids (S10). Shared — the code panel under the button row (P3, S5), the default rows' Name hint (P4, S26: one line, all three pages), reduced motion and targets (P4). Gate 6, unasked — one answer size on the keys (S26). index alone: its case-sensitive Advanced type (P4), the Count select's text (P4, gate 2 or 4), the last key's `print-break` (P4).
⚑ New probe (S26): `S26-ops-labels` (`--ref 24cec4f` fails 3; 1280 / 800 / 390, standalone and Mixed). Arm R's set for S27: the two S25 probes and `S26-ops-labels`. JPEG 0.8 is in CLAUDE.md's PDF step 4; a PDF size from before S26 reads ~22 % larger.
⚑ Screenshots: a full-page shot leaves the `content-visibility: auto` sheets below the first screen blank, a shot taken within a second of a smooth scroll catches it mid-way, and a mouse click by coordinates below the viewport lands nowhere (S26).
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S26 asked nothing about it); build a seed only when the maintainer names one. The Time / Score strip is declined (after S22): not to be proposed again.

## S28 (2026-11-09) — pass G on math-minute.html (clean), then math-facts.html (clean); two fixes on index.html, on a branch

- Run on branch `claude/dazzling-gauss-uhpik9` again (invoked with no argument; the maintainer's "on a branch until I tell
  you to push to main" from S27 still stood), stacked on the open draft PR Hbleiberg/mathsheet#6; `main` untouched.
- Arm R: the smoke, S26-ops-labels and the two S27 probes green.
- Pass G on math-minute.html: clean (176,000 problems), so it bought math-facts.html: clean (498,000).
- Gates: two in one call (gate 2: Level 2 "Hard Addition" to sums 10–18; Levels 6 / 8 / 10 to every subtraction fact):
  both "leave as is". Struck, below.
- Fixes: the two S27 index items — Scientific Notation's locale (c9cc85f, autonomous), Rounding at grades 3–4 (b60bd4d,
  approved S27). index then on its cap; the twins had nothing autonomous; two slots unused.
- Method notes: a Python script in an unquoted heredoc ran the ledger text's backticked code names as shell commands
  (syntax errors, nothing executed) and blanked them; restored, and the handoff now says to quote every heredoc.

### Candidates struck at gate 2 (S28: the maintainer left both levels as they are)

- [ ] P3 | math-minute.html | Level 2 "Hard Addition" deals every sum 2–18 (`additionFacts(18, false)`), so 20 of its 45 facts are Easy Addition's sums below ten (13 of 30 a sheet), where Level 4 "Hard Subtraction" is the teen facts only: sums 10–18, the inverse of Level 4, as S9's "drop only the easiest" did for 12 and 17 (gate 2) | found S28
- [ ] P3 | math-minute.html | Levels 6 / 8 / 10 ("Forty–Sixty subtraction facts") deal only Level 4's 45 teen facts, while 5 / 7 / 9 deal every addition fact (Levels 1 and 2 together, 54 % sums below ten): deal Levels 3 and 4 together, every subtraction fact to 18 (gate 2) | found S28

### Done rows archived from the ledger (S23, verbatim)

- [x] S23 | 2026-11-08 | f57d63c | index.html, scripts/loop/probes/S23-name-fit-layout.mjs | with the Number removed the name fit measures its lines (one per description and copy) on header copies in one layout: in place each laid out a whole sheet, 470 ms for 30 students on 30 types × 5 with keys | medians of 3: 479 → 109 ms (cpu4 2,305 → 518); every sheet byte-identical (S23-name-fit-layout, fails 3 on 37af5e4); name probes green; smoke
- [x] S23 | 2026-11-08 | af59ae5 | index.html, math-minute.html, math-facts.html, scripts/loop/probes/S23-phone-fields.mjs | a phone's fields are 16 px, upright or on its side, so iPhone Safari stops zooming into them (14 px, the code box 13); the twins' setting boxes 280 px there, for the Header line's example | S23-phone-fields, four phone shapes, three states (fails 12 on f57d63c); desktop and the iPad pixel-identical; screenshots; smoke
- [x] S23 | 2026-11-08 | 2597f1c | math-minute.html, math-facts.html, scripts/loop/probes/S23-red-border.mjs | a Level the validation box marked red loses it once it holds a value, picked or filled down (`clearFilledHighlights()`); the same block on both; index's half queued | S23-red-border: mouse, keyboard, Fill Down, a name beside an empty Level (fails 6 on af59ae5); S20, S21, S16, S12 probes green; screenshots; smoke
- [x] S23 | 2026-11-08 | 6611a2f | scripts/loop/probes/ (S5, S7 ×2, S8, S10, S11, S22) | arm R's seven stale probes repaired: S18's notice and S21's Fill Down line read where they are, byte-for-byte arms against old commits behind `--identity`, S22-desc-fit within 0.25 px (a 0.1 px drift under load) | all seven green on HEAD; their controls fail (loop-findings S23)
- [x] S23 | 2026-11-08 | e258268 | CLAUDE.md | a phone's fields are 16 px | doc only
- [x] S23 | 2026-11-08 | — | docs/loop-findings.md | pass M on math-minute.html (6 device shapes; fresh, Fix, Fill Down, the code panel, Advanced and its Level Reference, results): clean but for the queued 14 px fields and red border, both fixed; then A on index.html (load, generate to 1,510 sheets at 1× and cpu4, the form, restore, Save PDF): clean but for the no-Number slowdown, fixed; gates: none | scratch s23/m-mm.mjs, s23/a-index.mjs, s23/prof.mjs, loop-findings S23

### Per-session line archived from the ledger (S8, verbatim)

- S8 | 2026-11-05 | pass B on math-minute.html (378 sheets printed in 3 configurations, Letter and A4; a real 42-page Save PDF rasterized against print; round trip; saved payload) | fixes 4 (one P3 on the twins, two approved index P3s, the approved Teens Rule; on branch claude/clever-davinci-hhh4iz, not main) | smoke 3/3 green + `--cdn`; probes green | every page but math-minute ended on its cap

### Previous handoff (S27 → S28), verbatim

**Next session (S28):** S27 ran on branch `claude/dazzling-gauss-uhpik9`, not `main`: the maintainer asked for "a branch until I tell you to push to main". 56b3b00, 86e0fd0 and the close-out are on that branch and its draft PR; GitHub Pages (`main`) still serves S26. Ask the maintainer which branch to work on; once they say "push to main", fast-forward `main` to the branch. If `git rev-parse --is-shallow-repository` says true, `git fetch --unshallow origin main` before a probe names an old commit (S8's does).
⚑ next: G on math-minute.html — the stalest cell (S7, math-facts S7 too); since then math-minute gained S9's hard levels and S11's zero both ways. Run `S7-facts-audit` (both pages) for every key and deck, then look for what it does not measure, as S27 did on index.
⚑ Queues: approved and waiting — Rounding at grades 3–4, left out of their default Mixed (S27), the 30-cap note (S11), the divisor 3 px low on index's stacked grids (S10). index alone: Scientific Notation's locale (P3, autonomous: `toLocaleString("en-US")`), its case-sensitive Advanced type (P4). Shared — the code panel under the button row (P3, S5), the default rows' Name hint (P4, S26). Gate 6, unasked — one answer size on the keys (S26).
⚑ New probes (S27): `S27-div5-quotients` (fails 3 on 29e6a69), `S27-no-repeats` (62 selectors, ~45 s; fails 57 on 56b3b00). Arm R's set for S28: those two and `S26-ops-labels`. The identity arms of S10-rounding-one-line, S22-desc-fit and S25-across-division now run only with `--identity`.
⚑ The random stream changed (86e0fd0 deals, and Mixed shuffles its types before dealing): a seeded byte-for-byte compare against an older commit differs on most sheets. Switch the dealing off (`return makeProblem(type, grade);` atop `dealProblem`) to prove an unrelated change, as S27 did. Arm R swept all 48 probes at close-out: green but S6-header-line, repaired (its byte arm behind `--identity`).
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S27 asked nothing about it); build a seed only when the maintainer names one. The Time / Score strip is declined (after S22): not to be proposed again.

## S29 (2026-11-09) — pass B on math-minute.html (clean), then A on math-facts.html (clean); three fixes, on a branch

- Run on branch `claude/dazzling-gauss-uhpik9` again (invoked with no argument; the maintainer's "on a branch until I tell
  you to push to main" from S27 still stood), stacked on the open draft PR Hbleiberg/mathsheet#6; `main` untouched.
- Arm R: the smoke and the four S27–S28 probes green; then, swept in a worktree, all 53 probes: S23-name-fit-layout red
  since b60bd4d (its lines from HEAD's menus, one of them invalid on 37af5e4), repaired in a53342b; the rest green.
- Pass B on math-minute.html (the stalest cell, S8): clean but for the two known Advanced Code P4s, so it bought A on
  math-facts.html (S9): clean against S9's end.
- Fixes, all from the queue: the code panel under the button row (878b342, all three pages, S5's P3), index's divisor
  baseline (ccaa955, approved S10), the default rows' Name hint on the twins (dcbfa6a, S26's P4; index's half waits).
  Every page then on its cap; the fourth slot unused. Gates: none.
- Method notes: a planted control of a scratch PDF probe wrote over the green run's rasters, and their crops (the long
  Hebrew name 18 px, its end showing) read as a defect until a DOM dump after a real Save PDF showed the page right.

### Done rows archived from the ledger (S24, verbatim)

- [x] S24 | 2026-11-08 | 037221c | index.html, math-minute.html, math-facts.html, CLAUDE.md, scripts/loop/probes/S24-name-parse.mjs | a printed name sits in a `<span dir="auto">`, not a `<bdi>`: Chromium's fast innerHTML parser takes no `<bdi>`, so every generate ran 1.3–1.9× as long since S18 / S19; it renders the same | L9 × 300 139 → 84 ms (cpu4 745 → 391), index 91 → 62; screen, print, Save PDF pixel-identical (198 pages); S24-name-parse (fails 3 on d31ff06); smoke
- [x] S24 | 2026-11-08 | 7f40755 | index.html, scripts/loop/probes/S24-index-red-border.mjs | a Grade, Type or Count the validation box marked red loses it once filled, by mouse, keyboard or Fill Down (`clearFilledHighlights()`, as on the twins since S23) | S24-index-red-border: each of 12 fields red exactly when empty after every step (fails 9 on 037221c); S11, S12, S16, S20, S21, S23 probes green; screenshot; smoke
- [x] S24 | 2026-11-08 | 9fb3e5d | math-minute.html, math-facts.html | the dead `#student-form-title` and `.modal-*` rules removed (81 lines each) | five states × 1280 / 390 px: screenshots and every computed style identical, no element matched; a planted 1 px fails 20; smoke
- [x] S24 | 2026-11-08 | — | docs/loop-findings.md | pass B on math-facts.html (71 codes × three configurations: 1,278 sheets in print, A4, real cdnjs PDFs of 202 pages, the round trip, the payload): clean but for the two known Advanced Code P4s; then A on math-minute.html (load, generate to 1,510 sheets, the form, restore, Save PDF): clean but for S18's `<bdi>`, fixed on all three; gates: none | loop-findings S24

### Per-session line archived from the ledger (S9, verbatim)

- S9 | 2026-11-05 | pass A on math-facts.html (load, Generate to 300 sheets at 1× and cpu4, form, restore, memory, Save PDF to 150 pages: clean), then C on math-minute.html (UI at 1280 / 800, every level's sheet and key: clean but for known items) | fixes 4 (the approved name shrink on all pages, index's PDF frame, the hard levels, a CLAUDE.md line; on branch claude/clever-davinci-hhh4iz, not main) | smoke 3/3 green + `--cdn`; probes green | index.html and math-minute.html ended on their caps

### Previous handoff (S28 → S29), verbatim

**Next session (S29):** S27 and S28 ran on branch `claude/dazzling-gauss-uhpik9`, not `main`: the maintainer asked for "a branch until I tell you to push to main". Their commits (S28: c9cc85f, b60bd4d and the close-out) are on that branch and its draft PR, Hbleiberg/mathsheet#6; GitHub Pages (`main`) still serves S26. Stay on the branch until the maintainer says "push to main"; then fast-forward `main` to it. If `git rev-parse --is-shallow-repository` says true, `git fetch --unshallow origin main` before a probe names an old commit.
⚑ next: B on math-minute.html — the stalest cell (S8); since then its sheets gained S9's name shrink, S10's divisor baseline, S11's zero both ways, S18's name span and the Header line, S19's written "…", S26's JPEG 0.8. Print every level in three configurations, Letter and A4, and a real `--cdn` Save PDF against print, as S8 did (`S8-minute-print`, `S8-minute-pdf`); A on math-facts and C on math-minute (both S9) come next.
⚑ Queues: approved and waiting — the 30-cap note (S11), the divisor 3 px low on index's stacked grids (S10). index alone: its case-sensitive Advanced type (P4), the Count select's text (P4, gate 2 or 4). Shared — the code panel under the button row (P3, S5), the default rows' Name hint (P4, S26). Gate 6, unasked — one answer size on the keys (S26). Settled S28, not to be asked again: Level 2 "Hard Addition" keeps every sum 2–18; Levels 6 / 8 / 10 stay teen subtraction.
⚑ New probes (S28): `S28-sci-locale` (seven locales; fails 5 on 2f78bd2), `S28-rounding-grades` (fails 8 on c9cc85f; its last arm compares grades 1–4 Mixed with c9cc85f byte for byte under a seed). Arm R's set for S29: those two and the two S27 probes.
⚑ Scripts: write every Python or Node script inside a quoted heredoc (`<<'EOF'`): an unquoted one runs each backticked code name in the text as a command (S28 blanked two in the ledger, restored).
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S28 asked nothing about it); build a seed only when the maintainer names one. The Time / Score strip is declined (after S22): not to be proposed again.

## S30 (2026-11-09) — pass C on math-minute.html (one P4); two fixes, on a branch

- Run on branch `claude/dazzling-gauss-uhpik9` again (invoked with no argument; the maintainer's "on a branch until I tell
  you to push to main" from S27 still stood), stacked on the open draft PR Hbleiberg/mathsheet#6; `main` untouched.
- Arm R: the smoke and the five S28–S29 probes; S28-rounding-grades red on its byte arm against c9cc85f, which decayed at
  ccaa955 (S29's approved divisor), repaired in 94d3797 to measure the property, the byte arm behind `--identity`.
- Pass C on math-minute.html (the stalest cell, S9): the UI and the 21 levels' sheets and keys hold S9's and S26's
  baselines; one new P4 on all three pages (a marked field's 2 px growth and grey fill), queued; no second surface.
- Fixes from the queue: index's Name hint (02939af, its half of S29's dcbfa6a), the Duplicate / Delete targets on all three
  pages (15f3989, S12's P4). index then on its cap; the twins had no autonomous item of their own, so two slots unused.
  Gates: none.

### Done rows archived from the ledger (S25, verbatim)

- [x] S25 | 2026-11-08 | abdbd88 | index.html, scripts/loop/probes/S25-pdf-rows.mjs | Save PDF lays the stacked grids out at print's rows (the clone kept the screen's `minmax(…, 1fr)`): 4,043 of 5,880 cells in a real export sat 3–13 px lower than on paper; S4's P4 | S25-pdf-rows: every stacked class 0.0 px (7.5 on 2f9a38f); real cdnjs export 4,043 → 90 cells off, worst 8 px, html2canvas's glyphs; S4, S9, S19, S22 probes; smoke
- [x] S25 | 2026-11-08 | 7435289 | index.html, scripts/loop/probes/S25-across-division.mjs (+ S6, S22 repaired) | a division written across fits its row (54 px rows in 43 px tracks ran the 15th to 0.12 in from the edge), divisor level; its key is the sheet's own problem with the quotient in red at the right (approved S25, gate 6) | S25-across-division: 1,440 problems, lowest ink 786 px, keys recomputed (fails 6 on abdbd88); 286 other sheets identical; real PDF across 84 → 0 off; smoke
- [x] S25 | 2026-11-08 | — | docs/loop-findings.md | pass B on index.html (3,160 sheets in three configurations, A4, a real 126-page Save PDF, the round trip and payload): the across division rows and key, and S4's PDF rows, fixed; the last key's `print-break` (harmless) queued; gates: one (gate 6, both, as recommended) | loop-findings S25

### Per-session line archived from the ledger (S10, verbatim)

- S10 | 2026-11-05 | pass C on index.html (UI at 1280 / 800 in five states; 29 type rows, sheet and key, under print) | fixes 3 (the three-page PDF progress and guard, index's Rounding, the twins' divisor; a 4th slot unused, every approved item left needing a capped page; on branch claude/clever-davinci-hhh4iz, not main) | smoke 3/3 green + `--cdn`; probes green | every page ended on its cap

### Previous handoff (S29 → S30), verbatim

**Next session (S30):** S27–S29 ran on branch `claude/dazzling-gauss-uhpik9`, not `main`: the maintainer asked for "a branch until I tell you to push to main". Their commits (S29: a53342b, 878b342, ccaa955, dcbfa6a and the close-out) are on that branch and its draft PR, Hbleiberg/mathsheet#6; GitHub Pages (`main`) still serves S26. Stay on the branch until the maintainer says "push to main"; then fast-forward `main` to it. If `git rev-parse --is-shallow-repository` says true, `git fetch --unshallow origin main` before a probe names an old commit.
⚑ next: C on math-minute.html — the stalest cell (S9); since then its UI gained S12's names, S16's focus, S17's wrapping button row, S20–S21's Fill Down line, S23's 16 px phone fields and red border, and S29's code panel under the button row. The UI at 1280 / 800 in its states, every level's sheet and key under print; C on index.html (S10) comes next.
⚑ Queues: approved and waiting — the 30-cap note (S11, index). index alone: the default rows' Name hint (its half of dcbfa6a, one line: `S29-default-name-hint --only index.html` fails 3 — a first touch), its case-sensitive Advanced type (P4), the Count select's text (P4, gate 2 or 4). Gate 6, unasked — one answer size on the keys (S26). Settled S28, not to be asked again: Level 2 "Hard Addition" keeps every sum 2–18; Levels 6 / 8 / 10 stay teen subtraction.
⚑ New probes (S29): `S29-code-panel` (fails 12 on a53342b), `S29-index-divisor` (`--control` fails), `S29-default-name-hint` (the twins; `--control` fails 6). Arm R's set for S30: those three and the two S28 probes. All 53 probes were green on a53342b, S23-name-fit-layout repaired.
⚑ Scripts: write every Python or Node script inside a quoted heredoc (`<<'EOF'`): an unquoted one runs each backticked code name in the text as a command (S28). A scratch control that writes the same files as its green run overwrites them: give it its own output names (S29 misread a planted page's PDF that way, briefly).
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S29 asked nothing about it); build a seed only when the maintainer names one. The Time / Score strip is declined (after S22): not to be proposed again.

## S31 (2026-11-09) — pass C on index.html (one P4, fixed); two fixes, on a branch

- Run on branch `claude/dazzling-gauss-uhpik9` again (invoked with no argument; the maintainer's "on a branch until I tell
  you to push to main" from S27 still stood), stacked on the open draft PR Hbleiberg/mathsheet#6; `main` untouched.
- Arm R: the smoke and the five S28–S30 probes, all green.
- Pass C on index.html (the stalest cell, S10): the UI and 140 sheets and keys hold S10's baselines; a division written
  across sat centred, 108–122 px off the student's place on the key: gate 6 asked with before / after renders, approved,
  04c9483. No second surface (a fix was found).
- Fixes: 04c9483 (the across division at the left), d86b99f (S11's approved cap note; it showed the help's own example
  asks 40 of Grade 5 Mixed, which prints 30: gate 2 asked, "mixed, 40, 4"). index then on its cap; the twins had no
  autonomous item of their own, so two slots unused. Gates: two, both answered as recommended.

### Done rows archived from the ledger (S26, verbatim)

- [x] S26 | 2026-11-09 | ed7f879 | index.html, scripts/loop/probes/S26-ops-labels.mjs | each Fraction / Decimal operation's checkbox sits beside its label: 22 boxes had stretched above bold labels (the injected `.mwg-student-grid` rules won); the static rule now under `#mwg-app` (S10's P3) | S26-ops-labels at 1280 / 800 / 390: 22 of 22 beside, 13 px boxes, a click on the text toggles (`--ref 24cec4f` fails 3); smoke, S5-mixed-ops, S20-fill-down, roster-subset, S23-phone-fields, S16-focus green
- [x] S26 | 2026-11-09 | 78e0b94 | index.html, math-minute.html, math-facts.html, CLAUDE.md | Save PDF writes its pages at JPEG quality 0.8 (approved S2) | real cdnjs PDFs of one seeded roster: −21.9 / −21.5 / −21.6 %; page images a mean 0.45–0.58 of 255 apart, ink boxes ≤ 1 px; the grey tag and red answers alike at 3×; smoke --cdn, S4-pdf-print-parity, S25-pdf-rows, S19-long-name green
- [x] S26 | 2026-11-09 | — | docs/loop-findings.md | pass C on math-facts.html (the UI at 1280 / 800 in seven states; nine levels' sheets and keys under print): S5's baselines and the fixes since hold; queued the default rows' missing Name hint (three pages) and the key's two answer sizes (gate 6) | screenshots at DSF 2; computed styles on all three pages

### Per-session line archived from the ledger (S11, verbatim)

- S11 | 2026-11-06 | pass E, the suite (615 selector combinations through the forms, malformed and 500-entry pastes, storage denied / full, 13 bad payload shapes, every control, on all three pages) | fixes 3 (the three-page entry numbering, index's Decimals places, math-minute's zero both ways; a 4th slot unused, only math-facts had a touch left; on branch claude/clever-davinci-hhh4iz, not main) | smoke 3/3 green + `--cdn`; probes green | index.html and math-minute.html ended on their caps

### Previous handoff (S30 → S31), verbatim

**Next session (S31):** S27–S30 ran on branch `claude/dazzling-gauss-uhpik9`, not `main`: the maintainer asked for "a branch until I tell you to push to main". Their commits (S30: 94d3797, 02939af, 15f3989 and the close-out) are on that branch and its draft PR, Hbleiberg/mathsheet#6; GitHub Pages (`main`) still serves S26. Stay on the branch until the maintainer says "push to main"; then fast-forward `main` to it. If `git rev-parse --is-shallow-repository` says true, `git fetch --unshallow origin main` before a probe names an old commit.
⚑ next: C on index.html — the stalest cell (S10); since then its UI gained S12's names, S16's focus, S17's wrapping button row, S20–S21's Fill Down line, S22's description shrink, S23's 16 px fields, S24's red border, S26's ops labels, S29's code panel and S30's row targets; its sheets S25's across division, S27's dealing, S28's Rounding at grades 3–4 and S29's divisor. The UI at 1280 / 800 in its states (the Mixed and ops panels), each type's sheet and key under print, as S10 did; E (S11, the suite) comes next.
⚑ Queues: approved and waiting — the 30-cap note (S11, index). index alone: its case-sensitive Advanced type (P4, a first touch), the Count select's text (P4, gate 2 or 4). Shared — a marked field's 2 px growth (P4, S30), reduced motion and the settings checkboxes' targets (P4). Gate 6, unasked — one answer size on the keys (S26). Settled S28, not to be asked again: Level 2 "Hard Addition" keeps every sum 2–18; Levels 6 / 8 / 10 stay teen subtraction.
⚑ New probes (S30): `S30-row-targets` (`--control` fails 27). Repaired: `S28-rounding-grades` (byte arm behind `--identity`), `S29-code-panel` (reads Duplicate / Delete by their text), `S29-default-name-hint` (all three pages; `--control` fails 9). Arm R's set for S31: those four and `S29-index-divisor`. All 57 probes green on 15f3989.
⚑ Scripts: write every Python or Node script inside a quoted heredoc (`<<'EOF'`): an unquoted one runs each backticked code name in the text as a command (S28). A scratch control that writes the same files as its green run overwrites them: give it its own output names (S29). Clear Current Roster asks `confirm()`, which Playwright dismisses unless the script accepts dialogs; `elementFromPoint` sees only the viewport (S30).
⚑ Micro-feature: rests under Awaiting (skipped S8–S11; S12–S30 asked nothing about it); build a seed only when the maintainer names one. The Time / Score strip is declined (after S22): not to be proposed again.
