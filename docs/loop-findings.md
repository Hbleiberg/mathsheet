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

## S1 (2026-11-04) — pass A (performance & speed) on index.html

Method unless stated: the loop harness (local HTTP, foreign origins aborted, print stubbed), fresh
context per run, medians of 3; throttling by CDP `Network.emulateNetworkConditions` (1.5 Mbps / 10 Mbps,
40 ms RTT) and `Emulation.setCPUThrottlingRate(4)` (which slowed a JS busy loop only ×2.3 here — read
"cpu4" as a slower-machine order of magnitude, not a calibrated 4×). The "+CDN" runs went through the
sandbox proxy. Scripts lived in the session scratchpad; the methods are recorded here instead.

**Load.** S0's "563 KB" for the two PDF libraries is the decoded size; on the wire they are 38,648 +
96,409 B brotli = 135 KB (whole page 239,779 B with the CDN vs 104,708 without). As parser-blocking
tags they delayed the first roster entry 615 → 1,372 ms at 1.5 Mbps, 141 → 340 ms at 10 Mbps, ~57 →
248 ms unthrottled, while first paint stayed the same (the form looked ready but every button was
inert) — fixed in 9304f31 (after: 624 / 372 / 398 ms on the three pages at 1.5 Mbps). Parse+execute of
the libraries ≈ 35 ms (derived, ±15). **Refuted:** the `waitAndInit` 50 ms poll never runs (0 polls in
12 runs; the container exists at DOMContentLoaded; DCL → init 4–11 ms); `injectStyles()` costs 0.1–0.2
ms of JS, 0.7 ms with the recalc — its defect is duplication (0 of 1,493 elements change any computed
style when the injected sheet is removed; one rule, `.mwg-delete-link:hover`, has no static twin).

**Generate (150 sheets, 30 advanced students × 5).** Click-handler 178 ms (add2) to 413 ms
(fractions@g5), ≈85 % of it one forced layout inside `scrollIntoView` plus a second layout in the next
frame; two long tasks of 150–660 ms per generate. With `content-visibility:auto` on the sheets (served
copy): fractions 345 → 39 ms, add2 178 → 31 ms, long tasks gone, geometry / scrollY / printBoxes / PDF
bytes identical. The fixed 200 ms timer before `window.print` is 196–216 ms of every generate and
settles nothing (rAF frames tick throughout). Critic's extras on HEAD: cpu4 add2 handler 838 ms,
fractions 1.6 s, key-on (300 sheets) 2.3 s; count 60 ≈ 1.5× count 30 (linear in cells); the
print-media layout a real `window.print()` forces (move-to-body + one layout) is 274 ms at 150 sheets,
355 ms at 300, 0.7–1.7 s at cpu4, and is **not** removed by content-visibility (the print rule keeps
the sheets visible) — the bound on that fix. **Refuted:** no node or heap retention across 10 generates
(CDP Nodes flat at 44,646; a planted retention control grows by 43,800 per cycle); roster-form
responsiveness is unchanged with 150 or 300 sheets in the DOM (Add Student 1.5 ms, grade change 2 ms,
typing 16–40 ms per keystroke, 0 long tasks). The standard pages measured the same shape in S1
(handler 156 / 162 ms → 26 / 24 ms with the rule, commit 0ff238e).

**PDF.** html2canvas clones the whole document per page: 3 pages 1.6 s, 24 pages ~12 s, 150 pages 114
s (~42 s if linear). The 50 ms inter-page timer is ~24 % of a 150-page export; a bare rAF replacement
failed a paint probe (the clone must still paint before capture). JPEG 0.92 → 0.8 cuts the file ~20 %
with no visible difference at 300 dpi; a lower scale is not recommended. The stage's bottom ~108 px
are in the desktop viewport (clones flicker there). No re-entrancy guard (a second click runs a second
pipeline). The "please wait" box is static for the whole export.

**Roster / saved data.** Fill Down lost Student 1's subsets and left the ops panel dead; saved or
duplicated grade ≥ 5 mixed entries at 40/50/60 came back at 30 (the all-checked first render capped
the select before the deferred re-render) — both fixed in 62e6338 (probe `roster-subset.mjs`). Fill
Down on a mixed Student 1 is a ~100 ms single task at 30 students, mostly style/layout of the rebuilt
boxes (not a defect at that size). Restored fraction/decimal entries still render their ops panel
twice (candidate). A corrupt saved roster falls back silently and is never cleared (candidate). A slow
CDN delayed a saved roster's first paint one-for-one before 9304f31. `esc()`'s apostrophe step is a
no-op — audited: all 21 call sites land in text nodes or double-quoted attributes, so no exploitable
sink today (candidate, P3).

## S2 (2026-11-05) — pass B (print & export) on math-facts.html

Method: the loop harness; scratch probes (not committed — the smoke's new paper and font arms carry the
regressions). PDFs rasterized with `pdftoppm`, page sizes from `pdfinfo`.

**Paper.** `@page{size:11in 8.5in landscape}` is invalid (lengths and an orientation keyword cannot be
combined): Chromium's CSSOM keeps only `margin:0`, so `page.pdf({preferCSSPageSize:true})` came out
612×792 pt (portrait Letter; the 11 in sheet shrunk onto the top of the page) and A4 landscape made 24
pages for 12 sheets (page 1 the header alone, page 2 blank). `size:11in 8.5in` and `letter landscape`
both parse; after 48a610d: 792×612, 12 pages for 12 sheets, A4 landscape scaled to fit (12 for 12), and
an A4-portrait request still comes out landscape (Chromium honours the CSS orientation).

**Font.** On both standard pages the header labels, name and description printed and PDF'd in Times New
Roman (the app wrapper holds `font-family`; print moves the results to body and the PDF stage clones onto
body). index.html sets Arial on its sheet classes and was clean. After fb36ea5 every worksheet text node is
Arial on screen, in print and in a stage clone; Arial is wider, so a long description can wrap to two lines
(header 55 → 61 px) — the bottom-most ink stays ≥ 73 px above the sheet's inner bottom.

**Geometry (math-facts, 100 sheets: every rows class, stacks and long division, keys, 5 copies, removed
number, long names; math-minute 104 sheets, all 21 levels).** Every sheet 1056×816, `print-break` on all
but the last, 0 clipped cells, 0 horizontal overflow at the widest problems (×12, ÷12 with 3-digit
dividends, 3-digit key answers); bottom-most ink 674–754 of 792 px. Header 55 px, 61 when a key description
wraps ("ANSWER KEY — … (Key 3 of 5)").

**Print vs PDF.** Print rows are fixed (2.4 / 1.8 / 1.44 / 1.2 in, grid 81–772 px, ~20 px unused at the
bottom); the PDF clone is under screen CSS, rows 1fr (grid 82–791 px): problems sit 11–18 px lower in the
PDF, dx ≤ 2 px (P4 candidate). One math-minute key description wraps in the clone but not in print
(sub-pixel width difference; harmless).

**Save PDF.** `math-facts-worksheets.pdf`, page count = sheet count (12), one 1584×1224 JPEG per page
(144 ppi at scale 1.5), ~122 KB per page; zoomed cells crisp, answer-key red legible. Refuted: the S1
`content-visibility:auto` on the sheets does not blank PDF pages captured while the page is scrolled to
the results (scrollY 1455 and 760; every page carries ink, also on index.html after 7e0e32f).

**Advanced Code round trip.** "Cohen, Avi" exports as 4 fields and is skipped on paste; "Levi; Dana"
splits and prints as "Dana" with no error for it; a number "12, B" is skipped; the error list counts the
empty chunks a newline after `;` makes ("Entry 10" for the 6th line). Apostrophes and quotes survive.

**Long names.** The Student Name field is ~207 px at 18 px bold: ~22 characters, then "…"
("Bat-Sheva Rivka Gol…", "Yehonatan Avraham …"); same `text-overflow:ellipsis` on index.html.

**index.html (fix 3, 7e0e32f).** 150 sheets (30 advanced students × 5), medians of 3, click → handler
end / → next frame: add2 220 / 267 → 33 / 46 ms; fractions@g5 433 / 530 → 47 / 67; with the key (300
sheets) add2 675 / 792 → 71 / 87, fractions 862 / 1,024 → 69 / 89. Side observation: the fraction
key prints whole-number results as "0/1" and "1/1" (candidate for G).
