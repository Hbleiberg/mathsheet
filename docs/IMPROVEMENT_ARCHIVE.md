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
