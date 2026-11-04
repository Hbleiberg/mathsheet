# Loop findings — measurements and refutations already made

> Grep this file for the page and the pass you are about to run **before** re-deriving a measurement
> or filing a defect an earlier session refuted. Never read it whole. Entries are records, not open
> work; a session moves a non-actionable Candidate here verbatim. History: `docs/IMPROVEMENT_ARCHIVE.md`.

## S0 (2026-11-04) — bootstrap baselines (the harness's first run; no pass ran)

- Page bytes: `index.html` 104,515 · `math-minute.html` 57,720 · `math-facts.html` 61,777.
- The two cdnjs libraries load eagerly at the end of every page: `html2canvas.min.js` 198,689 B +
  `jspdf.umd.min.js` 364,463 B = 563 KB, used only by "Generate & Save PDF" (the undefined-guard
  notice is the existing fallback). Candidate filed.
- Cold load to the first roster entry (local HTTP, foreign origins aborted, one run): 98 / 69 / 93 ms.
- Default roster (3 students × 1 copy) generate by click to `window.print`: 266 / 250 / 270 ms.
- 30 students × 5 copies (150 sheets) via Advanced input: `index.html` 619 ms, 29,500 DOM nodes;
  `math-minute.html` 870 ms, 38,467 nodes; `math-facts.html` 617 ms, 29,774 nodes (same roster shape,
  level 5 / `+3` / `add2`). Math Minute renders ~9,000 more nodes for the same sheet count — A's first
  target on that page.
- PDF (`--cdn`, 3 sheets, `math-facts.html`): 1,616 ms, 237,497 B, 3 pages, `math-facts-worksheets.pdf`.
- Fields without an accessible name (text inputs, selects, textareas; the hidden sections excluded):
  only the read-only Advanced Code output textarea on each page (`mwgCodeOutput` / `advancedCodeOutput`).
- Smoke control: `escapeHtml` replaced by `return String(text)` on `math-facts.html` fails the XSS arm
  and the saved-roster reload arm (the restored value differs once the markup is live).
- Print geometry under the pages' own move-to-body trick: all sheets and key sheets 1056×816 on all
  three pages (6 of 6 each).
