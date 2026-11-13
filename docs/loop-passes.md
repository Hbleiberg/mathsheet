# Improvement loop — the discovery passes (reference)

> Read only *Probe rules*, *Surfaces* and the section of the pass you are about to run. The protocol
> that chooses the pass (roster, rotation, budget, gates) is `.claude/skills/improveloop/SKILL.md`;
> which pass ran when, and on what, is the ledger (`docs/IMPROVEMENT_LOG.md`) read by
> `node scripts/loop/coverage.mjs`. Measurements and refutations already made: `docs/loop-findings.md`
> — grep it for the page and the pass before re-deriving anything.

## Probe rules (every pass, every fix)

Verify with the harness (`scripts/loop/harness.mjs`): serve the repo root over local HTTP, abort every
foreign origin (the two cdnjs libraries only when the arm needs the PDF), stub `window.print`, drive
the page by real clicks. Every fix runs `node scripts/loop/smoke.mjs` (all three pages, even when one
changed — the pages share conventions and copy-pasted blocks) plus an issue-specific check designed
*before* coding. A print or PDF change is proved on the artifact itself: `printBoxes()` under emulated
print for geometry, a real `--cdn` PDF opened and page-counted for export, a rendered screenshot for
anything visual. Screenshots a person will see at `deviceScaleFactor: 2`.

Three measurement rules:
1. **Fire a control before trusting a zero** — plant the defect (break `escapeHtml`, drop a `rows-`
   class, remove `print-break`), see the probe fail, restore (`git checkout -- <file>`).
2. **A silent control means diagnose, not discard.**
3. **Assert the probe's handle resolves before its result counts** — a non-null selector, a counted
   side effect (`window.__prints`), a sheet count > 0.

Recorded traps: the pages render nothing until a generate, so "0 problems found" on a fresh load is
not a result; `index.html`'s default entries carry no grade/type/count and the standard pages' no
level — the harness's `prepare` fills them (pass `{ raw: true }` to audit the untouched first paint);
the grid class is `rows-N` on the standard pages but `mwg-cols-N mwg-rows-N` on `index.html`, so a
count expectation from the rows class alone is wrong there; under emulated print the results sit
inside the hidden app until the page's own move-to-body trick runs (`printBoxes()` re-applies it).
`page.pdf()` renders screen CSS when `emulateMedia({ media: 'screen' })` ran last (`printBoxes()` ends
there) — emulate print first, or the page count is wrong (S2). A wrapper put on `window.html2canvas`
before the first Save PDF click is overwritten when the page loads the library itself — hook it with an
`Object.defineProperty` setter; compare two PDFs only with `Math.random` seeded by an init script (S3).
Pass plain fields, never the harness `spec`, into `page.evaluate` (its `prepare` function cannot be
serialized). A header text that overflows inside its box can sit under a sibling without making the box
scroll: measure the text span, not the box. To see what Save PDF captures without the network, stub the
two cdnjs files as `probes/S4-pdf-print-parity.mjs` does (S4). A script that moves the results for print puts them back at their saved `parentNode` / `nextSibling`: after the app root they lose its scoped `box-sizing`, the header widens and the next generate sizes names differently (S19: S18's false Hebrew-PDF finding). Never `git stash` while a probe runs in the background: the harness serves the working tree, so the run reads the stashed files (S20). To edit while a long probe runs, run it from a `git worktree` of the commit in the scratchpad (S21). `S9-name-fit` compares every sheet with HEAD byte for byte: a fix that changes sheet markup reads red there until it is committed (S22). A focused button that is disabled drops focus to the page's start: read `document.activeElement` after any action that disables its own button (S22). Compare layout boxes within 0.25 px, never as rounded strings: under CPU load one cell's height read 47.6 or 47.7 px from run to run, the base against itself (S23). A byte-for-byte arm against an old commit (later changes replayed) proves its own session's fix and decays with every later approved change to the sheet's markup: keep it behind `--identity` and let arm R measure the property (S23). A cloud session's clone is shallow: `git show <old commit>` fails until `git fetch --unshallow origin main` (S23). A tag Chromium's fast innerHTML parser does not take (`<bdi>`) sends each sheet's whole markup through the full parser: S18's name wrapper made every generate 1.3–1.9× as slow on all three pages for six sessions, because nothing timed a generate against the markup without it; time a new sheet element against a `<span>`, and assert a timing as a ratio to the same page with the change undone, alternated, never in ms (S24). index.html's sheets print and export outside `#mwg-app` (the move to body, the PDF stage), so its scoped `box-sizing: border-box` is lost there: measure them under print, never on screen. A grid item taller than its track (`min-height: 0` in a grid of set height) overflows into the next row unseen, and an "ink inside its cell" check passes because the cell box overflows with it: compare each cell's box with its track (S25). A mouse click by coordinates at a point below the viewport lands nowhere: scroll the element in first; a full-page screenshot leaves the `content-visibility: auto` sheets past the first screen blank, and one taken within a second of a smooth scroll catches it mid-way (S26). A textarea keeps a pasted CRLF as LF. A check that filters controls by their group passes vacuously on a page without groups: count them in the DOM and the tree first; a probe that describes focus by `id` reads otherwise once a row's control gains one, so describe a row's controls by class (S37). `emulateMedia({ media: 'print' })` keeps the viewport's width, so a phone's width query still styles the "printed" page: set the viewport to the paper's 1056 px to see what prints; compare a phone's sheets with a desktop's at the same `deviceScaleFactor` (a small name's line height is measured on screen and differs by density alone) (S38). Playwright's `page.click` scrolls its target into view, so a walkthrough that clicks through it never sees a control leave the window (S18, S20 and S21 counted no scroll for Add Student × 19): count a teacher's scrolls by clicking the box's coordinates with `page.mouse`, following the control (S39). `openPage` opens a fresh context each call: read a save back by reloading the same page (S40). A hidden panel keeps its boxes: a row-wide query reaches them, so check a reader against a row that changed type (S40). A sheet's `innerText` reads empty while `content-visibility: auto` skips it off screen: set it `visible` or read `textContent`; after a reload the harness's print counter is 0 again (S41). A layout arm against an old reference decays with an approved layout change in its band (S40's two rows turned S30-row-targets red at 800 px): replay the approved rule into the reference, as `replayLater` does for index's markup (S42). Playwright's `fill` on a field off the window in mobile emulation leaves it at top −10: read a field's place after a tap (`touchscreen.tap`). A screenshot pair across a held html2canvas: wait until the click's smooth scroll stops (`scrollY` holds), and scroll the window to the top, since the strip of the stage an export leaves in view may be only the clone's blank margin; taking out a composited layer moves 6-11 pixels of anti-aliasing at a rounded box's edge, so count differing pixels, never compare PNG bytes (S43). Since S44 Generate & Print calls `window.print()` one frame after the click, before the smooth scroll reaches the sheets: a sheet off the window still lays out lazily, so read its `textContent` after the print count moves, never `innerText` (the smoke read "" in 3-4 checks a run). S8-minute-print's "names cut with an ellipsis" counts every header field, the Number too: Numbers made as `100 + code` read as cut names. `page.screenshot`'s `clip` is in window coordinates: a header below the window fails, so shoot the element (`locator.screenshot`) and crop. Generate's ratio at three runs drifted ×0.65-1.25 on unchanged code: re-time a suspect ratio at seven before calling it (S44). index's problem cells are 4 px taller than their tracks in print (their padding, content-box outside `#mwg-app`): an "inside its track" check reads every cell over by 4 px, so check a problem's ink against the track. A raster crop that ends at a row cuts a comma's tail into a period ("7.300.000"): read a number at a larger crop. Chromium paints a select with any author border or box-shadow from its `background-color` (rgb(239,239,239) unless set): judge a marked control by its pixels, not its computed style (S45). A probe whose selectors were listed when it was written misses a branch added later: S6-math-audit never reached Rounding at grades 3-4 (S28) until S46; widen an audit to every grade × type the form offers (`GRADE_TYPES`), and add a selector when a generator gains a branch (S46). A change to a description's text moves what is fitted beside it: a key's long description shrinks half a pixel for a wider sign, and with the Number removed the name beside it gets less room; an identity arm against an old commit then reads red (S23-name-fit-layout, S32-line-breaks): replay the label into the reference (S47). The Edit and Write tools put any `\uXXXX` escape in new text as the raw character: build such escapes with a script, then grep for raw marks (S32, S34); a scroll that jumps can move once more when content grows above the anchor (S33). Measure overprint with glyph ink (canvas
`measureText` on each text node, as `probes/S5-key-rows12.mjs` does), not text rects, which carry the
font's leading; compare a key problem with its sheet within the cell, since a long key description wraps
and lowers the whole grid (S5).

## Surfaces

Three: `index.html` (Custom Math Sheet Generator, grades 1–8), `math-minute.html` (21 numeric levels),
`math-facts.html` (fact codes). A **surface** pass (A, B, C, D, G, H, M) takes one per run, the
least-recently-audited as `coverage.mjs` reports it; a **suite** pass (E, F, I, L) takes all three over
the commit delta since its last run. A clean surface buys a second in the same session. `mwg.js` is
legacy and loaded by nothing — never a surface; a pass that finds it referenced files a P2.

## A — Performance & speed (surface)

Cold load bytes and time; the eager cost of the two cdnjs libraries (563 KB, needed only by Save PDF);
a 30-student × 5-copies generate (150 sheets) timed by `smoke.mjs --json`'s method, with DOM node
count; main-thread blocks > 200 ms during generate and during the PDF capture (one page's
`html2canvas` at scale 1.5 is the heavy step — measure per page, never guess); `innerHTML` churn and
layout thrash in the roster form (Add Student × 30, Fill Down, Duplicate); the roster-load path on a
saved 30-student roster. Baselines: `docs/loop-findings.md` → S0. A fix is proved by the same
measurement repeated on HEAD and on the fix, three runs each, medians.

## B — Print & export (surface)

The artifact a student holds. Print: every sheet exactly one landscape Letter page (`printBoxes()`
1056×816, `print-break` on all but the last, the key sheets included), header rows and the ruled lines
intact, nothing clipped at the 10-column grid for the widest problems (3–5 digit stacks, long division,
fractions, decimals), the blank-name line and the removed-number field, the answer key's red answers,
A4 behaviour (the `@page` is Letter — record how Chromium scales it, propose only if a student sheet
breaks). PDF (`--cdn`): file name, page count = sheet count, the raster's legibility at scale 1.5
(zoom a problem cell in the opened PDF), file size per page, parity with print (same sheet, same
place). Also the Advanced Code export/paste round-trip and the saved-roster payload. Divergences
between print and PDF are usually P2.

## C — Aesthetics (surface)

Two audiences, judged separately. **The UI** (teacher, desktop): typography scale and hierarchy,
spacing rhythm, button hierarchy (`.btn-large` for the two generate actions only), alignment of the
roster grid, the modal, the notices; consistency judged against the suite's best existing page
(convergence beats invention — `math-facts.html` is the reference). **The worksheet** (student,
paper): problem spacing for young handwriting, line weights, the header's balance, the description
box, the branding tag. Small refinements ship as iterations; palette, font, layout restructuring or a
redesign is gate 3. **Screenshot rule:** BEFORE and AFTER at 1280 and ~800 px for the UI, plus a
rendered sheet (print emulation) for the worksheet, saved in the scratchpad and delivered at close-out.

## D — Accessibility (surface)

Keyboard-only walkthrough of the whole flow (add, fill, fill-down, duplicate, delete, mode toggle,
generate, the Advanced Code modal: focus moves in, Escape closes, focus returns); every field named
(label, `aria-label` or `aria-labelledby`); visible focus; contrast of text and of the red/yellow/green
notices; touch-target size (44 px floor) on the small links; `aria-live` on the notice containers;
`prefers-reduced-motion` for the smooth scrolls. The worksheet is paper, out of D's scope except
the answer key's red on white.

## E — Errors & robustness (suite)

`node scripts/loop/smoke.mjs` plus: every selector option of every page generates (loop the level /
fact / type lists by selecting each and generating — count sheets and cells, 0 page errors); malformed
advanced input (wrong field count, unknown selector, empty name, stray semicolons, Windows line ends,
a 500-entry paste) is reported and skipped, never fatal; the CDN-absent path shows the notice and does
not throw; `localStorage` disabled or full (a quota throw) degrades to defaults; a saved payload from
the previous key version (`_v1` → `_v2`) does not crash the load.

## F — Cross-page consistency (suite)

One affordance per run compared across the three pages against the CLAUDE.md standard: the advanced
parser, the toggle UI, the settings labels, the saved payload shape, the notice boxes, the header
description and branding snippet, the print CSS block, the PDF pipeline constants, the button copy.
Converge on the standard. `index.html`'s known exceptions (`mwg-` classes, Georgia, 5-field advanced
input) are **not** drift to fix autonomously — they are gate 5; F logs each divergence once and asks.
Settled in S1: the convergence happens in one dedicated, maintainer-approved session outside the
loop (screenshots before anything ships), so F only records `index.html` divergences and never
converges that page itself.

## G — Math correctness & pedagogy (surface)

The numbers themselves. For every selector of the surface, generate ≥ 200 sheets headless and assert
the invariants its description promises: operand ranges ("sums less than ten"), no negative
differences, exact division, the stated count, no duplicate fact on one sheet where a deck is dealt,
the mixed levels' operator share, decimals' place alignment, fractions in lowest terms where the key
says so; the answer key's answers equal to the problems' (recompute independently). A description
that overstates or understates what the generator does is a P2 (silently wrong output); a level that
is pedagogically off for its grade is a P3 with the reasoning, never changed without gate 2.

## H — Teacher walkthrough (surface)

Role-play preparing a real class set end-to-end: a new class of 22, a Friday Math Minute, two students
on different levels, one on an IEP, the answer key for a parent helper, a substitute's blank sheets,
Hebrew names in the roster. Log every friction (extra clicks, missing defaults, unclear copy, dead
ends, data re-entered that another page already has). Frictions → P3 Candidates; missing small
affordances → Feature seeds; a whole new kind of worksheet → Page seeds. Never re-log a seed the
maintainer struck.

## I — First load, saved data & safety (suite)

A fresh context (empty localStorage): the default roster, no crash on absent keys, the mode pill and
toggles in their defaults. Then the saved-data contract: Save → reload → identical roster and
settings; Clear Current vs Clear Saved confirm and do only what they say; the payload of one page never
read by another; every user-entered value escaped on its way into HTML (`escapeHtml` / `esc` — grep
every `innerHTML =` and `+= '<` site for an unescaped variable); `JSON.parse` of the saved payload
inside a `try` with a defaults fallback; no inline event handler built from user text.

## L — Metadata & discoverability (suite)

Titles, meta descriptions, `lang`, a favicon, `rel=canonical`, OG tags, one `h1` per page, a
`robots`/sitemap only if the maintainer wants one. The pages are standalone files (maintainer, S1), so a
`<head>` edit reaches GitHub Pages — but the public pages are mathsheet.io's WordPress pages, which embed
the three files in iframes and carry the public titles, descriptions and search metadata; the repo pages are
`noindex` (S15). Any title or description text is gate 2; L audits and batches the
questions, then ships what was approved.

## M — Mobile & touch (surface)

A real device descriptor (`devices['iPhone 13']`, `devices['iPad Mini']`), both orientations: the
roster form reflows without horizontal scroll (`scrollWidth <= clientWidth`), the button row's
overflow is reachable, the number-field wrap and selects are tappable, the modal fits with its close
reachable, the keyboard does not hide the focused field, `inputmode` on numeric-looking fields is not
forced (student number is free text by rule). Print from mobile is Chromium's print preview — record,
don't fix. A fix inside a phone-width media query is autonomous; anything that changes the desktop is
gate 4. **Screenshot rule:** a phone contact sheet every run, BEFORE/AFTER per fix.

## Standing arm R — Regression (session start)

`node scripts/loop/smoke.mjs` on HEAD before anything else; then every probe under
`scripts/loop/probes/` from the last two sessions. A failure is a P2 ahead of the rotation pass. A fix
commits its probe (`S<N>-<slug>.mjs`, built on `harness.mjs`) only when the smoke does not already
cover it.

## Micro-feature track (an iteration type, not a pass)
- **Source:** the ledger's Feature seeds only (from H or the maintainer). Never invent one in-session.
- **Micro:** one page (the declared Math Minute ↔ Math Facts roster handshake is the sole two-page
  exception), ≤ ~150 lines of diff, no dependency, no build step, single-file conventions, both the
  Standard and Advanced paths if it touches input, the saved payload extended in the same commit (new
  field read with `??`-style defaults so an old payload still loads), `escapeHtml` on every new
  user-entered value, the smoke green, and the printed artifact re-proved if the header or grid changed.
- **Budget:** max 1 per session, costs 2 iterations. Skip when a P1 exists. Selection is gate 1;
  unattended default is skip and log.
- **Dual audience:** prefer seeds that serve the Jewish day school and the secular classroom alike at
  equal size (a free-text header line beats a parasha dropdown).
- **Abort:** diff trending past ~150 lines or outside the declared scope → revert, split the seed in
  the ledger, log "attempted, split".

## Page-seed track (never built inside the loop)
A new generator page is the maintainer's decision and a session of its own (CLAUDE.md → *Adding a new
generator page*). The loop only keeps the list current: H adds a seed with the audience, the grade
band and the selector idea in one line; a session may, when asked at gate 1, write a one-page brief for
one seed into `docs/page-briefs/<page>.md` (selectors, problem objects, rows classes, open questions)
— that brief is the whole deliverable, no page is started.
