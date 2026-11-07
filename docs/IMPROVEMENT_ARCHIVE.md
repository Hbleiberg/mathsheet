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
