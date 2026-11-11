# scripts/loop — tooling for the MathSheet improvement loop

Dev-only Node scripts (Node 22, ESM). Nothing here is loaded by a page; the site stays three
self-contained HTML files. Playwright and Chromium are preinstalled in the cloud sandbox (never run
`playwright install`); locally, `npm i -g playwright && npx playwright install chromium` once.

| Script | What it does |
|---|---|
| `harness.mjs` | Serves the repo root, opens a page with every foreign origin aborted (`{ cdn: true }` lets the two cdnjs PDF libraries load), stubs `window.print` with a counter, knows each page's DOM contract (`PAGES`), and offers `generate()`, `cellCounts()`, `printBoxes()`, and `replayLater(body)`, which replays later approved sheet changes on an old `index.html` so a byte-for-byte arm against it measures its own change only (S35). Import it from a probe. |
| `smoke.mjs` | The regression floor: per page — load clean, generate by a real click, answer key, print geometry (every sheet 1056×816 under the page's own print trick), advanced input with a nameless entry, save/reload roster, an XSS control name. `--cdn` adds the PDF arm (filename, `%PDF-`, page count). `--only <file>`, `--json` (load/generate/PDF timings and bytes for pass A). |
| `check-inline-js.mjs` | Compiles every inline `<script>` of every root page; one syntax error kills a page's whole JS while the HTML still renders. |
| `check-ledger.mjs` | The ledger's schema and size rules (`ledger-rules.mjs`). |
| `coverage.mjs` | Names the stalest pass/surface for the next session; `--check` validates the handoff's `⚑ next:` note. |
| `closeout.mjs` | Runs all of the above (`--cdn` for the PDF arm). Must pass before a session ends. |
| `probes/` | Issue-specific probes a fix commits (`S<N>-<slug>.mjs`) when the smoke does not cover it. Build on `harness.mjs`. |

Measurement rules (every probe): fire a control before trusting a zero (plant the defect, see the
probe fail, restore); a silent control means diagnose, not discard; assert the probe's handle
resolves (a non-null selector, a counted side effect such as `window.__prints`) before its result
counts. The smoke's own control: replace `escapeHtml`'s body with `return String(text)` and the XSS
and reload arms fail.
