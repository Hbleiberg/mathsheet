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

## S3 (2026-11-05) — pass A (performance & speed) on math-minute.html

Method: the loop harness, fresh context per run, medians of 3 unless stated; 30 advanced students × 5
copies = 150 sheets; long tasks by `PerformanceObserver('longtask')`; cpu4 by CDP
`Emulation.setCPUThrottlingRate(4)` (an order of magnitude, as in S1). Scratch probes, not committed.

**Refuted: the S0 node-count lead.** S0 timed level 5 (40 problems a sheet) against math-facts `+3` (30).
At equal counts the pages are identical: 292 nodes per 30-cell sheet, 382 per 40-cell sheet, 19 in the
header, 9 per stacked cell and 7 per division cell on both. 150 sheets: L1 44,257 nodes (math-facts `+3`
44,800), L5 57,757 (`mix+40` 58,300).

**Generate (150 sheets).** Click-handler / next frame: L9 (60 addition) 44 / 59 ms, L20 (60 division) 45 /
60, L21 mixed 67 / 81 (one 64–76 ms long task: four decks built per sheet), L9 with the key (300 sheets)
87 / 102 (one 85–108 ms task). Click to `window.print` 264–337 ms, of which 200 ms is the fixed timer (the
open P4). cpu4: L9 212 / 281 ms (long tasks 164–226 + 53–69), with the key 377 / 463 (361–420).

**Fine as is.** Roster form at 30 students, click to the next frame: Add Student 17 ms, Fill Down 24,
Duplicate 10, Delete 11, a keystroke 15, Save 17, Generate Advanced Code 16; the same with 150 sheets on
the page; 0 long tasks. Load: DCL 26 ms, load event 38, first paint 56 (59,293 B); a saved 30-student
roster restores in 56 / 80 ms. Memory: 187,201 DOM nodes after each of 6 generates (key on), no growth.

**Save PDF.** Before 6ada9ea: ~400 ms a page up to 30 pages (html2canvas 205–312 ms: its whole-document
copy 84–212 ms, then the render; `toDataURL` 25 ms), but 150 pages took 127–158 s (849–1,053 ms a page,
the copy 777 ms of 885), because every page's copy includes all 150 on-screen sheets. Two long tasks per
page (110–230 ms) keep the page sluggish during any export (inherent to html2canvas). With
`ignoreElements` on the results container: copy 71 ms, page 163 ms; wall clock, page's own code,
libraries pre-fetched: math-minute 3 pages 1,256 → 1,171 ms, 30 pages 11.6 → 7.7 s (medians of 3),
150 pages 127 → 36 s; math-facts 107 → 35 s; index.html 123 → 35 s (one run each). Output identity:
`Math.random` seeded by an init script (mulberry32), 10 mixed students + keys = 20 pages per page, rasters
at 72 dpi compared with ImageMagick `compare -metric AE`: 0 differing pixels on every page of all three,
also with the window scrolled to the bottom throughout the export; controls: two seeded HEAD runs 0, two
different PDFs 46,000–87,000 per page.

**Advanced input after ad456d2 / 3575eed.** "Cohen, Avi", "Ben-David,  Rivka Leah" (inner spacing kept)
and "Levi, Dana, Bat-Sheva" print whole on all pages; a 2-field line is still reported; index.html's
bracket types (`mixed[add2|sub2]`, `fractions[add|sub]`, `decimals[add]`) still parse, and a bracket typed
with commas (`mixed[add2, sub2]`) fails type validation (reported, never misread). Side effect of the
approved rule: a Student Number holding a comma ("12, B") now reads as part of the name.

## S4 (2026-11-05) — pass B (print & export) on index.html

Method: the loop harness; scratch probes; `Math.random` seeded by an init script wherever two runs are
compared; PDFs rasterized at 96 dpi with `pdftoppm`; "ink" = text-node client rects plus the ruled
lines, brackets and answer blanks of each grid cell, measured under emulated print after the page's own
move-to-body trick.

**Geometry (1,208 sheets: every grade 1–8 × every type × 30/40/50/60, keys on).** Every sheet 1056×816,
header 55 px, `print-break` on all but the last worksheet. Stacked grids (cols-10 rows-3…6, cols-4/5/6
rows-6…12) fit: bottom-most ink 693–785 px on worksheets, 700–790 on keys, no clipped or out-of-cell
problem, wide division (min-width 1.3 in in a 1.04 in column) never touches its neighbour. Defects: (1)
Grade 5–8 Mixed (any pool holding a written-across type, the default included) dropped its stacks into
the 2-column across grid: 7–25 overlapping problems a sheet, 23–25 on the key, ink to 814 px; (2) keys of
60 wide problems (rows-12: Level 3–5 add/sub/mul, Grade 3–4 Mixed at 60): every red answer overprints the
top number below by 8.4 px (rows are 62 px, stack + answer ~66); (3) Rounding wraps every problem to two
lines (the answer blank is 60 % of the cell): ink 806 px, 0.1 in from the paper's edge; Long Division keys
799, Fractions 793. Pure across types otherwise fit (Decimals, Order of Operations, Integers, Exponents,
Scientific Notation ≤ 771).

**Headers.** At 5 copies the description runs under "Worksheet 3 of 5" (the text span overflows inside the
box, so the box's own scrollWidth does not show it) and a key's "(Key 3 of 5)" is cut by the box, the
branding tag on top of it: 160 of 500 keys at Grade 5 (Subtraction 1–4, Multiplication 3–5, Division 4),
every long-description worksheet. Remove Number and Name blank render cleanly. The last answer-key sheet
carries `print-break` (`buildAnswerKeySheet(allAnswers, !doKey)` is always false with keys), harmless:
`.mwg-answer-key-sheet:last-child` comes later in the print block with the same specificity.

**Save PDF vs print (seeded, 16 pages).** `worksheets.pdf`, page count = sheet count, ~170 KB a page.
The clone's `.mwg-ws-body` / `.mwg-ak-body` clip (screen CSS) while print lets them overflow: Rounding lost
the second line of problems 29–30 ("nearest thousands"), Long Division keys the bottom half of the last
dividends, Mixed problem 29's second line. After 2d59570 the PDF changes only below y 792 and matches
print there (Rounding bottom-band ink 0 → 738 / 620 dark px, print 785 / 669); the 7 pages that did not
overflow are pixel-identical. index's stacked grids sit 5–6 px lower in the PDF than in print
(`minmax(…, 1fr)` vs print's fixed rows-6…12; rows-3/4/5 are not fixed in index's print block at all).

**Standard pages' PDF rows (b8d2304).** Before: ruled lines 4 → 17 px low down a rows-3 page, 3 → 19 on
rows-6 (the clone's `1fr` rows); after: 1–2 px everywhere, the same constant offset the header's top
border already had (rasterization). Print path pixel-identical; PDF bytes −0.4 / −0.8 %.

**Advanced Code round trip and saved payload.** Six students (fraction and decimal op subsets, a Mixed
subset, a Mixed with fraction/decimal ops, "Cohen, Avi", `O'Brien "Bo"`): Standard generate and Generate
Advanced Code → Use code → generate give byte-identical sheets (seeded). The saved payload keeps the
standard keys (`students` for `standardStudents`, the known index exception). Defect: a Mixed entry with
only some fraction / decimal operations ticked (clicks: fractions × and decimals + only) saves exactly
that (`mul4 fractions-mul decimals-add`) but Duplicate and a reload tick all 11 operations:
`renderMixedCheckboxes` checks an op when `checked` holds it `|| fracChecked` (true whenever any
`fractions-*` is saved). Also seen: a horizontal type's count is capped to 30 on save (by design).

**Fix A (7774975).** Seeded 7 Mixed rosters at Grades 5–8: 218 stacks in the across grid → 0; 46 Mixed
sheets and keys: 0 overlapping problems, 0 lost, ink ≤ 805 (Rounding's two-line rows remain); the 133
other rosters (every type at Grades 3/5/8, subsets; 266 sheets) byte-identical.

## S5 (2026-11-05) — pass C (aesthetics) on math-facts.html

Method: the loop harness; scratch screenshot probes (UI at 1280 / 800 px, rendered sheets at DSF 2 under
emulated print with the move trick); committed probes for each fix (`S5-*.mjs`). Ink = the glyphs' own box
(canvas `measureText` on each text node: `actualBoundingBox*` against the baseline from the text rect)
plus ruled lines.

**UI (teacher, desktop).** Type scale consistent (entry titles 18 px, labels 14 px bold, inputs and small
buttons 14 px, the two `.btn-large` actions 17 px bold, mode pill 13 px); spacing and the roster grid
aligned; no horizontal overflow at 800 px (the button row fits at 800, scrolls below ~770 — M's). The
page has no heading (`#student-form-title` styles an element that does not exist) — L's question, not C's.
Refuted lead: the Advanced-mode Level Reference shows bare codes (`-self`, `-fr10`), but its legend under
the grid explains them. Defects: (1) on all three pages the "Some entries were skipped" box renders after
`#results`: 20 sheets put it at y 9,735 px (math-minute 8,945, index 8,988) while the page scrolls to the
results' top (1,455 / 665 / 708); (2) the Advanced Code panel is an inline div after the results and the
error box, so it opens under every generated sheet (3,400 px down after 3 sheets) and scrolls there; the
`.modal-*` rules (~75 lines) style nothing.

**Worksheet (student, paper).** The header frame (top, left and right borders, open at the bottom) is the
same on all three pages — a design, not a defect (gate 3 if ever changed). Sign gap: one-digit bottom
numbers sit 7.2 px from the sign (an 18 px box around a 12.8 px digit plus a 2 px margin), two-digit 2.0 px
("×12", "+10" crowded; math-facts only — math-minute has no two-digit bottom number). Worksheet division:
the divisor's baseline is 3.0 px below the dividend's. Long names truncate with "…" (S2's candidate).

**Answer keys.** Both standard pages drew key division as its own construction: a bar under the red
quotient, the bracket's stroke through it, the divisor beside the quotient, the bracket's width set by the
quotient (different from the sheet's). index.html's key division has the same shape (queued). A long key
description ("ANSWER KEY — Mixed facts: …") wraps and lowers the whole grid 5.9 px (S2): compare a key
problem with its sheet within the cell.

**Fixes.** 2a74f54: 805 division cells (every division level, both pages) match the sheet within 0.00 px
in their cells, quotients right, above the bar, right edge on the dividend's, inside the cell; real Save
PDFs (math-facts /7, math-minute 20 at rows-6) rasterized: quotients over the bar. 6011727: 5,040 stacks,
every gap 7.2 px, one-digit signs within 0.1 px of before (20.0 px from the stack's right edge).
5c3b01a: the S4 click sequence keeps "fractions-mul decimals-add" through Duplicate and Save → reload; the
reloaded sheet has 0 ÷ / − (15 before). b981031: rows-12 keys (44 keys, 2,640 cells at every grade ×
stacked type and Mixed at 60): smallest glyph gap under an answer −3.4 → 2.6 px (S4's 8.4 px was text
rects, which include the font's leading); ink to 790 of 816 px; the 152 other sheets byte-identical with
`Math.random` seeded.

## S6 (2026-11-05) — pass G (math correctness & pedagogy) on index.html

Method: `scripts/loop/probes/S6-math-audit.mjs` — Advanced Input, 51 selectors (the 20 levels; Fractions and
Decimals at grades 5 and 6 and each of their 11 operations; Rounding, Long Division 5/6, Order of Operations,
Integers 7/8, Exponents, Scientific Notation; Mixed at grades 1–8) × 200 sheets, counts rotating 30/40/50/60,
answer key on. Sheets and keys are read back from the DOM (fractions as `[n/d]`, powers as `^e`, brackets as
`DIV d n`) and every key answer recomputed with BigInt rationals. 378,000 problems, ~60 s. `--control` plants a
wrong Level 3 quotient, a wrong fraction denominator and the asked count: 2 checks fail.

**Refuted / clean.** Every key answer is right (0 of 378,000 wrong), every key problem is its sheet's own,
no negative difference anywhere (subtraction levels, fraction and decimal subtraction), every Order of
Operations, Integers, Exponents and Scientific Notation key right. Addition / Subtraction / Multiplication
Levels 1–5 and Division 1, 2, 5 keep their labels; Division 1–2 exact with quotients 1–10.

**Defects.** (1) Division Levels 3–4 ("2-digit ÷ 1-digit") had 3-digit dividends in 7,635 / 7,713 of 9,000
(quotient drawn 10–99) — fixed b1e456f. An evenly drawn divisor with a 2-digit dividend makes 35 % of
problems ÷ to 10 or 11 (99 ÷ 9, 66 ÷ 6) and 23 distinct problems per 30; drawing evenly over all 106 valid
problems gives 15 % and 26.3 distinct, with ÷2 38 %, ÷3 23 %, ÷9 2 % — the shape shipped. (2) The header
stated the count asked: 4,050 of 10,200 sheets (every across type at 40–60; Mixed 5–8) — fixed dd8609a;
also reachable from the Standard form via Mixed → Deselect All → 60. (3) Advanced bracket names are never
validated: `fractions[fractions-ad]` → "Fractions" header over "2 + 3 =", `mixed[foo]` → Addition Level 1,
`mixed[scientificnotation]` at grade 1 runs; no error (queued P2).

**Pedagogy measured (queued).** Fraction keys at grade 5: 0/x 1,009, n/1 1,051, improper 1,005 of 6,000.
Fraction subtraction x − x = 0 in 1,612 of 6,000 (27 %); addition sums to exactly 1 in 1,632 (27 %); d = 2
always ½ ± ½. Operands not in lowest terms ~20 % (normal for like denominators; no candidate). Decimals type:
1,082 of 11,864 grade-5 numbers have no decimal point, 68 problems all-whole; the grade-6 level shows 2
places on 10,817 of 12,000 numbers. Integers: hyphen-minus in 74 % of problems and every negative key.
Rounding: 232 of 6,000 ask a number below the place, 131 round to 0; "to nearest tens" wording. Addition
Level 2 sums 10–18 (label 10–20); Level 5 / Subtraction 5 never take a 1-digit number. Grade 1–2 Mixed
includes × and ÷ by default (GRADE_TYPES; a product choice, no candidate).

**Micro-feature (math-minute, Header line).** Print with the line: lowest problem 104 / 75 / 58 / 46 px
above the paper's bottom for rows-3…rows-6 (the line costs ~21 px); an 80-character all-caps line fits one
row; PDF clones within 1.0 px of print. The settings row's left block sized itself from the fields'
min-widths (434 px for two 260 px fields) and wrapped the second: `.settings-left{flex:1 1 auto}`.

## S7 (2026-11-05) — pass G (math correctness & pedagogy) on math-facts.html, then math-minute.html

Method: `scripts/loop/probes/S7-facts-audit.mjs` — every level the dropdown offers (71 on math-facts, 21 on
math-minute) × 200 students through Advanced Input, key on, read back from the DOM. Per level: count and rows
class, description, key problem = sheet problem, key answer recomputed, the description's promise (PROMISE),
membership in the documented family (re-enumerated from the page's comments), the deck (min(count, family)
distinct facts a sheet, each floor/ceil(count / family) times, no fact twice in a row, a fact dealt twice
written both ways when it can be, every family fact dealt somewhere), the split levels (mixpm / mixmd half
and half; math-minute Level 21 one row per operation). `--control` (a ×7 key off by one, a deal with
replacement, a family outside its promise) fails 7 checks on each page. ~2 min (math-facts) at 200 a level.

**Clean.** math-facts 498,000 problems, math-minute 176,000: 0 wrong keys, 0 outside a family or a promise,
0 negative answers, every deck as documented, every split exact. The comments' fact counts hold (64
addition, 109 subtraction, 91 multiplication, 156 division facts in the Mixed pools).

**Pedagogy measured (math-facts).** "+10 (Teens Rule)" deals 9 facts, 10 + 0 … 10 + 8 (the page caps
addition at 18): approved S7, include 10 + 9. "-self" answers 0 on 34 % (a − a is 10 of its 29 facts, by
design). "+0+1" has 19 facts, each 1–2 times a sheet. Mixed ×: 14 % ×0 and 14 % ×1 (25 of 91 facts); Mixed ÷:
8 % 0 ÷ n; Mixed +: 17 % +0 (no candidate: the pools are the families' union, as the comment says). The
operator's own number stands on top ~55 % on +N / ×N (both orders dealt).

**Pedagogy measured (math-minute).** Level 12 "hard multiplication" is 1–9 × 6–9: tops 1…9 at 13 % each, 4 of
30 facts ×1. Level 17 "hard division" includes ÷ to 1 and 10. Levels 11 and 13–15: every zero factor on top
(0 × b only; 17 % of 13–15). Level 4 "numbers through twenty": minuends 10–18. Level 1: 33 % have a 0 addend
(10 of 30 facts with 0 + n / n + 0, by design). Levels 6/8/10 (Forty–Sixty subtraction) are all teen
subtraction, the same 45 facts as Level 4.

**Fixes.** Skipped-entries box: at 1280 px after 20 sheets it was at y 16,560 on every page while the page
scrolled to the first sheet (S5 measured 9,735 with fewer sheets); now top 0 (flush) with the first sheet
30 px below, at 1280 and 390 px. The probe's 11th line reads "Entry 21" on all three pages (the queued P3:
the error count numbers raw chunks). Bracket names: Mixed accepts the grade's types plus, where the grade
has them, single fraction / decimal operations (`mixed[fractions-add]` at grade 4 is now refused; it printed
fraction additions on a grade-4 sheet). Header line on math-facts: the same geometry as math-minute's
(104 / 75 / 58 / 46 px of paper left, rows-3…rows-6 with divisions on rows-6); settings row 82 px at 1280
and 800 (unchanged), +70 px at 390 where the field stacks, no horizontal scroll.

## S8 (2026-11-05) — pass B (print & export) on math-minute.html

Method: `probes/S8-minute-print.mjs` (emulated print with the page's move trick, element rects per cell;
Chromium's `page.pdf` for the page count), `probes/S8-minute-pdf.mjs` (a real Save PDF through cdnjs, both
PDFs rasterized with `pdftoppm -r 96`, dark-pixel boxes per cell), scratch probes for the clone's DOM against
print (html2canvas stubbed, both standard pages, 1–5 copies), the Advanced Code round trip and the payload.

**Print.** Three configurations × 21 levels with keys: plain (1 copy), heavy (5 copies, an 80-character
Hebrew / Latin header line, 31-character names) and bare (3 copies, line, no Number, Name blank) — 378 sheets,
every one 1056 × 816 with `print-break` on all but the last, 0 problems' ink outside its cell or under the
paper's inner bottom, the closest pair of problems 47 px apart. Paper left under the lowest ink, plain:
rows-3…6 110 / 82 / 64 / 53 px (keys 101 / 72 / 55 / 43); heavy: down to 32 (keys 22) at rows-6. Header
55–61 px, 76–82 with the line (the grid's 691 px then runs 7 px past the body, ink clear). Print-to-PDF one
Letter page (792 × 612) per sheet; an A4 request, landscape or portrait, gives one 842.88 × 595.92 page per
sheet (Chromium keeps the CSS orientation and scales). Names of 31 characters end in "…" on every sheet (the
S2 P3); the 80-character line prints whole.

**Save PDF.** `math-minute-worksheets.pdf`, 42 pages for 42 sheets, one 1584 × 1224 JPEG a page, 116 KB a
page, 9.0 s from the click; scrolled to the bottom mid-export every page carries every problem; red answers
legible at 144 ppi. Before 6bebbdb every page had a 1px #bbb frame (the clone kept the screen `.worksheet`
border; print sets none) and the clone's content box was 996 px against print's 998.4 (border 2 + padding
29 vs 28.8), so "ANSWER KEY — Thirty subtraction facts, numbers through twenty" wrapped in the PDF only
(header 55 → 61 px, its problems 7–9 px lower); with 1–5 copies no other header wrapped differently, every
other cell sat 1 px off. After: clone = print 0.0 px on every sheet of both standard pages, no frame, 4,887 →
4,520 KB. html2canvas draws digits about 3 px lower at their top edge than Chromium's print (0–4 by glyph,
the same layout), so raster parity is measured against that common offset. index.html's clone has the same
border (Candidate).

**Round trip and payload.** Ten Standard students → Generate Advanced Code → Use → Generate: eight
identical; "Levi; Dana" splits (S2 P4) and a Number "12, B" turns into the name "Noa, 12" and Number "B" with
no error (new, folded into that P4); the error list says "Entry 13" for the 7th line (S2 P3). Save → reload
restores every setting, the header line and Advanced mode; payload keys = CLAUDE.md's plus `headerLine`.

**Fix measurements.** d3ef5c6 (fraction keys): grade 5 keys 1,024 mixed, 1,991 whole, 2,985 proper of
6,000; grade 6 660 / 1,365 / 3,975. 8e46ade (index key division): 582 division cells on 16 keys (rows-3…8),
bracket and divisor 0.00 px from the sheet, quotients ≥ 14 px clear of the problem above (100 with a
remainder, "49 r1"). In rows-10 / rows-12 Mixed keys the new drawing overprinted the problem above by
3.3–11.3 px where the old one kept 2.1–10.1 px, and written-across rows are as tall as their text: both keep
the old drawing. f0ba0e8 (Teens Rule): +10 deals 10 unordered facts to 19; mix+ keeps 64, max 18.

## S9 (2026-11-05) — pass A (performance & speed) on math-facts.html, then C (aesthetics) on math-minute.html

Method (A): the loop harness, fresh context per run, medians of 3; 30 advanced students × 5 copies; click →
handler return → next frame (rAF + setTimeout 0); long tasks by `PerformanceObserver('longtask')`; cpu4 by CDP.
Scratch probes, not committed. Measured with nothing else running (an overlapping arm-R run was stopped first).

**Load.** DCL 22 ms, load event 31, first contentful paint 44; 66,848 B; 525 nodes, 221 `<option>`s for 3
students (73 a level menu). No foreign request at load (the smoke's eager-CDN check).

**Generate, 150 sheets (300 with keys).** Handler / next frame: `+3` 21 / 27 ms (key 49 / 58), `x7` 22 / 28
(44 / 52), `/7` 18 / 23 (41 / 47), `mix+60` 44 / 53 (81 / 90), `mixpm60` 52 / 60 (98 / 107), `mixmd60` 54 / 62
(100 / 112); one long task of 50–127 ms on the 60-problem and keyed runs. cpu4: `+3` 100 / 128, `mixmd60` with
keys 484 / 526 (math-minute S3: 377 / 463 for L9 with keys). Cost is linear in problems (the deck is rebuilt per
sheet but the HTML dominates). Nodes: 29,250 for 150 thirty-problem sheets, 112,350 for 300 sixty-problem.

**Fine as is.** Roster form at 30 students, frame after click: Add Student 6 ms, Fill Down 28, Duplicate 6,
Delete 4, a keystroke 15, Save 15, Generate Advanced Code 4; the mode toggle 30 a flip (style recalc of the 30
menus, under 50 ms, no long task); the same with 300 sheets on the page. A saved 30-student roster restores by
DCL 32 / load 72 ms. Memory: 112,875 nodes after each of 6 keyed generates, no growth; 10 MB heap.

**Save PDF (real cdnjs, libraries warmed).** 3 pages 969 ms; 30 pages 6.7 s (222 ms a page); 150 pages 30.7 s
(205 ms a page: html2canvas 124–143, the 50 ms timer, `toDataURL`); one 71–161 ms long task a page (inherent).
The 50 ms timer is ~24 % of a long export: the open P4.

Method (C): screenshots at 1280 / 800 px (load, the code panel, Advanced with a bad entry, after a Generate);
all 21 levels' sheets and keys under print with a header line and a 24-character name; cell geometry.

**math-minute = math-facts.** The two pages' `<style>` blocks differ only in the root id; the markup only in the
Advanced help text. S5's C findings carry over. Writing room under each ruled line: rows-3 180 px, rows-4 123,
rows-5 88, rows-6 65 (keys 162 / 105 / 70 / 47); division 15 px more. The Mixed key's description wraps to two
lines (grid 6 px lower, 17 px of paper left). Known: long names cut (fixed, f98327b), the divisor 3 px low.
Copy nits: the menu says "11 - Easy X" with a letter X beside "16 - Easy ÷" (the maintainer keeps X, S9) and
"01 - Easy Addition" where the Level Reference says "1 – Easy Addition". **For M:** at 800 px the on-screen
sheets (11 in wide by design) make the page scroll sideways (scrollWidth 1,064); print is unaffected.

**Fixes.** f98327b: in print and the PDF the sheets sit outside the app wrapper, so the name line is
content-box (27 px tall); a baseline kept by padding-top dropped the underline up to 6.4 px there, so the fix
sets a line height measured per size (a baseline moves half as far as its line height): 0.00 px. Chrome rounds
a size's ascent to a whole pixel (an em-ratio model was off by up to 0.8 px). `removeAttribute("style")` after
CSSOM writes can serialize as `style=""` (a lazily synced attribute; a MutationObserver hides it), so the measure
runs on an empty copy of the line. Screen headers stay 45.9 px with 16 and 11 px names. ae14c70: index PDF pages
framed 16 / 16 → 0; the S9-index-pdf "worst cell" (~387 px on fraction sheets, before and after) is the thin grey
answer line crossing the ink threshold in print but not after JPEG — not a layout difference (rasters checked).
936850d: Level 12 deals 22 facts (was 30), Level 17 32 (was 40); 0 % one-operand problems on Level 12.
