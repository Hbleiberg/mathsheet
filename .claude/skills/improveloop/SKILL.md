---
name: improveloop
description: >-
  Run one bounded, ledger-driven continuous-improvement session on the MathSheet.io worksheet
  generators (index.html, math-minute.html, math-facts.html): read the ledger, run the stalest
  discovery pass (A performance, B print & export, C aesthetics, D accessibility, E errors, F
  consistency, G math correctness, H teacher walkthrough, I saved data & safety, L metadata, M mobile),
  ship up to four small verified fixes (one commit each), optionally one micro-feature from the seed
  list, ask the maintainer at decision gates, update the ledger, close out. Use whenever the user
  invokes /improveloop, or asks to run, continue, resume or rerun the improvement loop / an improvement
  session / pass / sweep, or to hunt-and-fix small verified issues across the generators — even loosely
  phrased ("run the loop", "do an improvement pass", "make the worksheets print better", "speed up the
  pages", "tidy the site a bit", "check it on a phone", "improveloop").
---

# MathSheet.io — Continuous Improvement Loop

A bounded session that keeps all of its state in `docs/IMPROVEMENT_LOG.md` (the **ledger**), so any
future session resumes with no prior chat context. The loop's value is many small, verified, isolated
wins on three self-contained HTML pages — never a grand refactor, never a new page.

**Authority split.** This skill owns *protocol*; the ledger owns *state* (session numbers, coverage,
candidate priorities, open questions). Where a template here disagrees with the live ledger, the
ledger wins — except that a pass this skill's roster lists and the ledger's rotation lacks is added as
a never-run row, not ignored. A ratified convention recorded in the ledger that contradicts this skill
is followed and flagged in the close-out so the skill gets folded.

**The loop's files.** Protocol: this file. Passes: `docs/loop-passes.md` — read only *Probe rules*,
*Surfaces* and the section of the pass you run. Measurements and refutations: `docs/loop-findings.md`
(grep for the page and the pass before auditing). History: `docs/IMPROVEMENT_ARCHIVE.md` (grep-only).
Tooling: `scripts/loop/` (`harness.mjs`, `smoke.mjs`, `check-inline-js.mjs`, `check-ledger.mjs`,
`coverage.mjs`, `closeout.mjs`, `probes/`; `scripts/loop/README.md`). Conventions every fix obeys:
`CLAUDE.md` (the standard, the known exceptions of `index.html`, the print and PDF pipelines).

## Session start (in order)
1. **Read `CLAUDE.md`.** Every convention there applies to every iteration; `index.html`'s exceptions
   are recognized, not propagated and not "fixed" without gate 5.
2. **Read the ledger — bounded.** `grep -n '^## \|^### ' docs/IMPROVEMENT_LOG.md` to map it, then
   read only: the `**Next session (SN):**` handoff and its `⚑` lines, the top ~10 Candidates (P1
   first), the headlines of *Awaiting the maintainer* (not yours to fix — a session that *can* resolve
   one moves it to Done), the Surface coverage table, the rotation rows, the last Done block and the
   last 5 per-session lines.
3. **Number this session** from the pointer's `SN`; tag everything you write with it.
4. **Regression arm R.** `node scripts/loop/smoke.mjs` on HEAD, then any `scripts/loop/probes/` from
   the last two sessions. A failure is a P2 ahead of the pass. Compare its `--json` numbers against
   the findings file only when a pass needs them; never trust a previous close-out's numbers unread.
5. **Git.** Commit and push straight to `main`, one commit per iteration (CLAUDE.md's rule, ratified
   by the maintainer in S1 for the loop). A cloud session assigned a `claude/*` branch first
   fast-forwards `main` to it (or merges it) and then works on `main`; it never leaves loop commits
   only on a side branch.
6. **Pick the pass:** `node scripts/loop/coverage.mjs` names the stalest cell; enter the iteration
   protocol.

## Session parameters
| Parameter | Rule |
|---|---|
| Budget | **5 iterations**: 1 discovery pass + up to 4 fixes. A micro-feature costs 2. |
| Scope guard | One concern per iteration, one commit per iteration. A fix that reveals a second problem logs it as a Candidate — never chase it now. |
| Verification debt | At most one unverified aspect outstanding; resolve or revert it before the next iteration, and end the session rather than accumulate a second. Never leave the tree mid-change. |
| Variety governor | Max 2 iterations per page per session (a three-page fix of one shared block counts once against each page's cap only if it is the same diff pasted thrice — then it is one iteration, one commit, and spends one touch on each). Max 2 iterations on one recurring shape. If the top candidate breaks a cap, take the highest-priority one that doesn't. Tie-break toward the page untouched longest. |
| Page boundary | The loop never starts a new generator page and never wires `mwg.js` into anything. Page seeds are listed, briefed when asked (gate 1), and handed to the maintainer. |

## Rotation rule
Passes are **surface** passes (A, B, C, D, G, H, M — one page per run) or **suite** passes (E, F, I,
L — all three pages over the commit delta since the last run). **Stalest first across both classes**
as `coverage.mjs` computes it: a never-run cell outranks everything, then the lowest last-session
number; the handoff's `⚑ next:` note breaks ties and may override with a one-line reason (the
maintainer's priorities A, B, C outrank an equally stale D). **A clean surface buys a second** — a
surface pass that finds nothing by mid-session takes the next-stalest surface in the same session,
recording both in the coverage table. A suite row whose note says `blocked: <why>` is skipped in the
pick until the note is cleared (L was, until the maintainer confirmed the pages are standalone). Skip the pass only on explicit user direction, recording `pass run: — (skipped; <X> stays stalest)`.

**Roster** (full definitions and arms: `docs/loop-passes.md`):
A performance & speed (surface) · B print & export (surface) · C aesthetics (surface) · D
accessibility (surface) · E errors & robustness (suite; every selector generates) · F cross-page
consistency (suite; against the CLAUDE.md standard) · G math correctness & pedagogy (surface; the
numbers themselves) · H teacher walkthrough (surface; the feature-seed intake) · I first load, saved
data & safety (suite; escaping, the saved payload) · L metadata & discoverability (suite)
· M mobile & touch (surface) · R regression re-run (standing arm at session start, not a letter).

## Decision gates — ask the maintainer (AskUserQuestion, concise options, a recommended default)
Small verified fixes stay autonomous. These decisions are the maintainer's:
1. **Micro-feature selection** — which Feature seed to build, or skip; and whether to write a brief
   for one Page seed instead (a brief is the whole deliverable).
2. **What a student or teacher reads** — any wording change beyond fixing a typo, any change to a level
   or fact description, a new header line, the branding tag, button copy, and any `<title>` or meta
   text. A description that is *wrong* about what the generator does is fixed under G with the fix
   named in the question, not silently.
3. **Dramatic aesthetics** (pass C) — anything a returning teacher would notice at once: palette,
   font, layout restructuring, the worksheet's grid or header redesign. Propose with BEFORE screenshots.
4. **Mobile restructuring** (pass M) — a fix inside a phone-width media query is autonomous; anything
   that changes what desktop users see, hides or reorders controls at phone widths, or adds a
   touch-only interaction is gated. Propose with phone screenshots, stating what changes on both.
5. **`index.html` convergence** — any change that moves `index.html` toward the standard beyond a
   local fix (renaming `mwg-` classes, swapping Georgia, restructuring its advanced format, moving its
   injected styles). Fixing a bug inside its existing patterns is not gated.
6. **Anything that changes the printed artifact's content or layout** — a new line, a moved header
   element, a different problem spacing, a grid change — unless it restores what CLAUDE.md specifies.

**Batching:** collect gate questions at the post-pass selection moment and at iteration boundaries, up
to 4 per call; the three *Awaiting* questions go in the first call of the first session that reaches a
gate moment. Never gate small mechanical fixes; a session with no gated work asks nothing.
**Unattended fallback (no answer can arrive):** gate 1 — skip the micro-feature; gates 2–6 — ship
nothing gated, log the proposal under *Awaiting the maintainer* with its screenshot paths. Record every
deferral in the close-out. A gate degrades gracefully; it never stalls the session.

## Iteration protocol (repeat up to budget)
1. **Discover, then select.** Run the pass the rotation picked, logging everything found as
   Candidates / Feature seeds / Page seeds before fixing anything. Then select the top Candidate the
   variety governor allows.
2. **Ground.** Open the file, grep the exact anchors, read the surrounding conventions (one IIFE, the
   standard helper names, `escapeHtml` on every user value, the U+2212 minus). Ledger line numbers
   drift — locate by pattern. If the same block exists on all three pages, check whether the defect
   does too, and fix it everywhere in one commit (the smoke runs on all three anyway).
3. **Fix minimally.** Smallest diff that resolves the issue; no drive-by cleanups or reformatting; no
   new dependency; no build step.
4. **Verify** per *Probe rules* in `docs/loop-passes.md`: `node scripts/loop/smoke.mjs` (all pages),
   plus the issue-specific check designed before coding; a print or PDF change is proved on the
   artifact (`printBoxes()`, a real `--cdn` PDF, a screenshot); fire a control before trusting a zero.
   Commit the probe under `scripts/loop/probes/S<N>-<slug>.mjs` only when the smoke does not cover it.
5. **Commit**, one concern, a clear message naming the page(s) and the pass that found it.
6. **Log.** Move the item to Done (session, date, commit, file, what, verified how); re-prioritize
   what the fix revealed.

**When a fix fails:** if the correct fix isn't small or the diff balloons past one concern — revert
cleanly (`git checkout -- <file>`), re-log the Candidate with what you learned, record "attempted,
reverted" in Done. A clean revert with better intelligence is a successful iteration; a half-verified
change in the tree is not.

## Micro-feature track
One per session at most, costing 2 iterations, from the ledger's Feature seeds only; selection is gate
1 (unattended: skip and log). What counts as micro, its verification, the dual-audience preference and
the abort rule: `docs/loop-passes.md` → *Micro-feature track*. A seed that needs a new saved field
extends the payload in the same commit and still loads an old payload.

## Prioritization rubric
P1 data loss (a saved roster gone or overwritten), a broken generate / print / PDF, a wrong answer on a
key, a user value reaching HTML unescaped · P2 silently wrong output (a level that does not match its
description, a sheet that breaks across pages, print ≠ PDF), a11y blockers · P3 performance, dead UI,
confusing copy, consistency with the standard, paper-cuts · P4 polish. Tie-breakers: (1) the printed
sheet, (2) a teacher's saved roster, (3) dual-audience beats single, (4) the page untouched longest,
(5) smallest diff.

## Ledger schema
The ledger is **current state**; `node scripts/loop/check-ledger.mjs` fails a close-out that breaks it
(limits and row regexes: `scripts/loop/ledger-rules.mjs`). Write the headline; detail goes to the
archive or the findings file, never the ledger line.
- Candidates `- [ ] P<n> | <file(s)> | <one-sentence defect and the fix shape> | found S<N>`,
  priority-sorted, open fixable work only (a measurement or refutation → `docs/loop-findings.md`; a
  wait on the maintainer → *Awaiting*; a P4 older than 60 sessions → archive; struck → archive with
  why, never a `[x]` line).
- Feature seeds `- [ ] seed | <page(s)> | <what> | from S<N>`; Page seeds `- [ ] page | <name>.html |
  <what> | from S<N>`; open only, struck → archive.
- Awaiting the maintainer: `- [ ] <question or action> | since S<N>`; resolved → Done.
- Done `- [x] S<N> | <date> | <commit|—|reverted> | <file(s)> | <what> | <verified how>` — last 5
  sessions, older rows to the archive verbatim.
- Per-session log `- S<N> | <date> | <pass + surface> | fixes n | <smoke result> | <one note>` — last 20.
- Surface coverage: the table, one `S<N>` or `—` per surface-pass × page cell, updated in place.
- Rotation: one row per pass `- <letter> <name> (surface|suite): last S<N> (<result>)`, updated in
  place; then the single `**Next session (SN+1):**` handoff with its `⚑ next: <letter>[ on <page>]`
  line (what `coverage.mjs --check` reads) and a few `⚑` notes. The previous handoff moves to the archive.

## Session close-out (always, even on early stop)
1. **Ledger:** Done entries, Candidates and seeds re-prioritized, the coverage cell(s) and rotation
   row, the per-session line, the new handoff with its `⚑ next:` line and what the next session must
   know (baselines moved, questions still open, a half-explored lead).
2. **`node scripts/loop/closeout.mjs`** (`--cdn` when a PDF or print path changed) — inline-JS check,
   ledger check, coverage check, the smoke — must come back clean. If CLAUDE.md's standard moved
   (a new shared convention), update CLAUDE.md in the same session, one sentence.
3. **Push** `main` (session-start step 5).
4. **Summary**: iterations, the pass and its result, fixes shipped with their proofs, the
   micro-feature shipped or split, screenshots delivered (C/M rules), gates asked → answers,
   deferrals, protocol divergences to fold into this skill, and what a human must do (merge, answer
   an *Awaiting* question, decide a page seed). Then **"In simple terms, what did this loop session
   do?"** — a short, jargon-free recap for a teacher: what visibly changed on the pages or the
   worksheets, what was checked and found fine, and what to decide next.

If the ledger is missing, stop and ask the maintainer — never bootstrap a new one silently.
