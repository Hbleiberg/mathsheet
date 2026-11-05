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
