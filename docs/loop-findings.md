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

## S10 (2026-11-05) — pass C (aesthetics) on index.html

Method: screenshots at 1280 / 800 px (load, a filled roster with the Grade 5 Mixed panel and a Fractions ops panel,
the Advanced Code panel, Advanced with a bad entry, after a Generate, the validation box); 29 type × grade × count
rows with keys under print (seeded); cell geometry per sheet. Scratch probes, not committed.

**UI (teacher, desktop).** Type scale: labels 14 px bold, entry titles 18 px, links 13 px, pill 13 px bold, small
buttons 14 px, the two large 17 px bold — the standard's scale, in Georgia (the font and the `mwg-` names are the
convergence session's, not C's). Button hierarchy right (`.mwg-btn-large` on the two generate actions only);
notices the standard colours; the three toggles stacked right of the settings row with Fill Down under them; the
Grade 5 Mixed panel lists 20 levels, two sub-groups and Other with Select / Deselect All. 800 px: the five form
columns hold (a closed Problem Type select clips its text, as selects do), the Mixed panel wraps to four and three
a row, no horizontal overflow before a Generate (after one, the 11 in sheets: M's). The validation box ("Fix" /
"Generate Anyway") and the skipped-entries box (above the sheets since S7) read well. **Defect:** in the Fractions
/ Decimals ops panels, and the Mixed panel's fraction / decimal groups, each checkbox sits on its own line above
a bold label: `.mwg-ops-grid label{display:flex;…}` loses to the injected `.mwg-setting-group label,.mwg-student-grid
label,…{display:block;font-weight:bold;margin-bottom:4px}` (same specificity, appended after the static sheet),
while `.mwg-mixed-types-grid label` survives on `font-weight:normal!important` / `margin-bottom:0!important`
(computed: ops label `block 700 4px`, mixed label `flex 400`). **Refuted lead:** a blank Problem Count after
choosing Mixed at Grade 5 was the probe's doing (it set 40 where the only option is "30 problems (max for this
type)"); real selections leave "30" selected.

**Worksheet (student, paper).** Header 55 px, description box 384 px; stacked problems 20 px at grades 1–2 and
18 px from grade 3 ("wide"), across problems 16 px with 12 px grey numbers, fractions 14 px. Writing room under
each ruled line: cols-5 rows-6 (30 problems) 69 px, rows-8 40, rows-10 23, rows-12 11 (the standard pages' 10 × 3
grid gives 180 at 30 — a design, gate 3). Keys: rows-6 50–52 px, rows-8 21, rows-10 4–6 (S5's b981031 handled
rows-12 only; nothing overprints), rows-12 3. Division cells 196 / 138 / 81 px. Across grids: the grid box always
ends at 800 px (`height:100%`); the cells end 760–771 for Decimals, Order of Operations, Integers, Exponents and
Scientific Notation, 793 Fractions, 807 Long Division, 816 Rounding (fixed: 780). Grade 5+ Mixed (across):
brackets take two rows' height, so the two columns' rows drift apart; a Rounding problem wrapped there too (fixed).

**Fixes.** 291903c: the progress line per page on all three pages, the status box scrolled into view at the
click (the Generate's own scroll to the sheets is overridden in the same task), the button disabled until "PDF
saved!" or a notice; on HEAD a second click mid-export did start a second pipeline (16 captures, 2 downloads for
8 sheets). a32d3fa: 244 rounding problems (grades 5–8, Mixed 5 and 8, keys) 0 wrap (122 before); blanks 203–256 px
(286); the last row 780 px (816). 2b678e1: 860 brackets, divisor and dividend baselines 0.00 px (3.00) on both
twins; index's `.mwg-division-divisor` has the same 8 px (queued).

## S11 (2026-11-06) — pass E (errors & robustness), the suite: all three pages

Method: `scripts/loop/probes/S11-robustness.mjs` (committed; `--only`, `--skip-selectors`, `--control`), six arms
per page by real clicks, every foreign origin aborted, `window.print` stubbed, dialogs accepted. Arm R first: the
smoke and every S9 / S10 probe green, but `S10-rounding-one-line` failed its own "wrapped before" check because its
reference defaulted to HEAD, which has carried the fix since a32d3fa — a probe defect (fixed, bd961ee: the default
is 2b678e1, as `S9-index-pdf` pins its base).

**Every selector through the Standard form.** One entry, the answer key on, each option selected and Generate
clicked: index 523 combinations (8 grades × their types × the counts the dropdown offers; 191 s), math-minute 21,
math-facts 71. Every one printed one sheet and one key with the count asked, the description's count and the key's
cells equal, 0 page errors, 0 console errors. Probe traps: index's long-division cell nests a second cell element
(count top-level cells only); math-minute's Level 21 description names no count (fall back to the rows class).

**Malformed pastes** (Windows line ends, `;;`, blank lines, tabs, spaces, no trailing `;`, an empty name, a comma
in a name, a wrong field count, an unknown selector, an empty selector, an out-of-range level / grade / count, a
type the grade lacks, a bad bracket name): every bad entry reported with its text and skipped, every good one
printed, nothing thrown. **Lenient reads (new):** math-minute's `parseInt` accepts "7.5" as Level 7 and "1O" (a
letter O) as Level 1; index's grade "2.5" reads 2 (its count "3O" reads 3, an invalid count, so it is reported);
math-facts looks codes up exactly and accepts "X3", "×3", "*5", "÷4" by design. A 4-field line on the twins reads
as a name with a comma ("Dov, 12", the known P4). **Silent cap (new):** index's Advanced "rounding, 60" prints 30
under a header that says 30 (S6 made the header honest) with no message; the form itself offers only "30 problems
(max for this type)". Reports were numbered by raw `;` chunk (7, 9, 11, 13 for the 4th–7th lines: the known P3,
fixed 2abc2e3; now 4, 5, 6, 7).

**500-entry pastes** with Windows line ends and Hebrew names: 500 sheets in 462 / 452 / 351 ms (index / minute /
facts), nothing skipped, 0 errors (one probe draft used "mix+" where math-facts' Mixed codes carry their count,
"mix+30": 71 entries rightly skipped).

**Storage.** `localStorage` denied (the accessor throws SecurityError): the page loads its 3 defaults, Save says
"Unable to save roster in this browser.", Clear Saved says "Unable to clear saved roster[ in this browser].",
Generate prints. Full (setItem throws QuotaExceededError): the same, Clear Saved succeeds. **Bad saved payloads**
(13 shapes under each page's key: `null`, a bare string, not JSON, `[]`, `{}`, a roster that is a string, a null
student, an unknown level / a type the grade lacks, an out-of-range grade and count, every setting out of range,
the legacy v1 shape under the current key, a v1 key beside no current one, 1 MB of advanced text): every one loads
to a usable roster with 0 page errors and Generate prints or says "No valid students found". Notes: a roster that
is a string yields one blank entry per character (10 for "Avi, 1, 5;"), harmless; index loads mwg.js's v1 shape
(same `students` field) while the twins' v1 shape falls to defaults; an unknown saved level leaves its select blank
and the validation box names it.

**Every control** (Generate with blanks → "No valid students"; a name without a level → the validation box, Fix,
Generate Anyway; Add, Duplicate, Delete to empty → defaults return; Fill Down; Advanced Code open / copy / use /
close; Save, Clear current, Clear saved; every toggle and the header line; index's Mixed Select / Deselect All, the
fraction and decimal "All Operations", one box, the ops panels with one, all and no operation): 0 page errors, 0
console errors on each page. Fractions / Decimals with every operation unchecked print the type's default mix.

**Controls.** `--control` serves each page with three plants (one level's generator throws, the parser throws on a
bad entry, the storage read unguarded): 25 checks fail on the three HEAD pages (every plant caught: 32 / 1 / 1
throwing combinations, the paste and 500-entry arms, the denied-storage load), the fixed pages all green (run after
the close-out; the control's selector arm took 341 s on index). The numbering check fails on the pre-fix pages
(7, 9, 11, 13, 15, 26 on index). HEAD's Decimals: `S6-math-audit` "places shown" {0: 1,016, 1: 10,872}
of 12,000 grade-5 numbers, 1,579 problems short including keys ("89.2 + 82.8 → 172"); fixed: 12,000 of 12,000 at
each grade. HEAD's zero factor: Level 11 19 on top / 0 below of 150 seeded problems; fixed 11 / 20 (0 × 0: 2);
Levels 13–15 16/14, 22/20, 37/25; Levels 1–10, 12, 16–20 byte-identical seeded, 21 (Mixed, multiplication too)
differs as expected.

## S12 (2026-11-06) — pass D (accessibility) on math-facts.html, the shared blocks measured on the twins

Method: a scratch audit (scratchpad `s12/a11y-audit.mjs`, logs `s12/audit-<page>.log`) over the harness: every
visible control's accessible name from Chromium's own accessibility tree (CDP `Accessibility.getPartialAXTree`),
a Tab walk recording `:focus-visible` and the computed outline at each stop, keyboard activation (Enter, Space,
ArrowDown, Escape, Shift+Tab) of every flow, computed text colours against the effective background (WCAG
relative luminance), the bounding box of every control, the live-region attributes, `prefers-reduced-motion`
emulated. Arm R first: the smoke and the four S10 / S11 probes green (`s12/armR.log`; S11-robustness 5 min 25 s).
What D found on math-facts.html holds on math-minute.html and index.html unless noted (the same blocks).

- **Names.** 29 visible controls in Standard mode, 6 unnamed: Student Name and Level in every row (the `<label>`s
  carry no `for` and wrap nothing), Student Number named only by its placeholder "Any text", Student Name by
  "Optional" / "Prints blank" (the placeholder `applyNameBlankToggle` sets) once the roster changes. index.html:
  12 of 29 unnamed (Grade Level, Problem Type, Problem Count too). Every button, checkbox, setting and the paste
  box is named. This refutes the S0 baseline ("only the Advanced Code textarea"): that census must have taken a
  preceding label as a name. Fixed, 4b10d20: ids per row, `for` on the labels, `aria-labelledby` the row heading
  and the label ("Student 2 Level"), which follows a renumbering.
- **Keyboard.** The Tab order follows the visual order (29 stops, none hidden); every stop shows the UA focus
  ring (`outline: auto 1px`, `:focus-visible` true); Enter and Space fire every button; ArrowDown changes a Level;
  Enter in a text field submits nothing (no submit button, several text fields). Focus drops to `<body>` after
  Delete student (the button is removed), after Close on the code panel and after Fix on the validation box; the
  code panel opens with focus still on its button, 9 Tabs from Close, and Escape does nothing (the panel is in
  view, by its own smooth scroll); the validation box appears with focus on Generate, Fix is 2 Shift+Tabs back,
  and the red-bordered Level carries no `aria-invalid`. Candidate P3.
- **Live regions.** None on any page: `#statusMessages`, `#errors`, the validation box, `#studentCounter` and
  the mode pill change in silence. Fixed, 07f115f: polite on the three boxes, `role="alert"` on the validation box,
  `aria-busy` on the status box through the PDF page counts, `pdfDone()` ahead of the final message.
- **Contrast** (text on its effective background, all ≥ 4.5:1): body 17.9, `#444` 9.7, the links 8.1, the
  delete red 6.2, error box 8.2, notice 6.7, success 6.6, the mode pill 17.0, buttons 18.3, Chromium's
  `#757575` placeholders 4.6, the answer key's red on white 7.1. index.html the same (Georgia changes nothing).
- **Targets.** Duplicate / Delete student are 100 × 16 and 84 × 16 px (13 px text, no padding; index 91 / 75 ×
  16), the three checkboxes 16 × 16; `.btn-small` 34 px tall, the fields 36, the big buttons 48. AA's 24 px
  passes only by the spacing exception; D's 44 px floor fails for the links. Candidate P4.
- **Reduced motion.** The five `scrollIntoView({ behavior: "smooth" })` animate under
  `prefers-reduced-motion: reduce` (the code panel's scroll runs 567 → 806 px over the second after the click on
  a 1,467 px page; index 615 → 843); no media query on any page. Candidate P4.
- **Structure.** `lang="en"` and a `<title>`; the UI's only headings are the row h3s (no h1, no landmark;
  "Level Reference" and "Advanced Input Code" are bold divs); two `title`-only hints; the mode pill's change is
  not announced (the toggle's own label flips, which a screen reader re-reads on focus). Candidate P4.

**Controls.** S12-a11y on the pages served from 9eb4248: 25 failing (13 names, 12 live); from 4b10d20: the 12
live checks only; the fixed tree all green. S10-pdf-progress green after the PDF path's reorder (the button
still re-enables with the message). The probe's busy check reads the MutationObserver's record order within the
"PDF saved!" batch, since a batch's post-state alone cannot tell which of two same-task writes came first.

## S13 (2026-11-06) — pass F (cross-page consistency), the suite: all three pages against the CLAUDE.md standard

Method: textual, not a browser audit. The two standard pages diffed line by line (`diff math-minute.html
math-facts.html`, scratchpad `s13/twin.diff`, 464 lines); index.html compared affordance by affordance with the
standard CLAUDE.md writes down — the advanced parser, the toggle UI, the settings labels and button copy, the saved
payload, the notice boxes, the description box and branding snippet, the print CSS block, the PDF pipeline
constants, the utilities, the style constants; the shared helpers (`loadScriptOnce`, `loadPdfLibs`, `pdfDone`,
`fitLongNames`) lifted from each page by name and diffed after index's names were normalised (`s13/fnx.mjs`).
Arm R first: the smoke (60 checks), S11-robustness and S12-a11y green (`s13/armR-*.log`).

**The twins (math-minute.html vs math-facts.html).** Identical outside the selector system. Every differing line is
the title, the app id, the paste-box placeholder and its help text, `STORAGE_KEY` (`_v2` / `_v1`, as CLAUDE.md names
them), the level tables and problem generators, the parser's selector validation and its message
(`parseInt` 1–21 / `normalizeFactCode` against `FACTS`), and the PDF filename. The six sessions of shared-block
edits (S7–S12: the header line, the PDF guard and progress, the entry numbering, the row ids, the live regions)
landed on both identically. `stack()` tests its three operators in a different order on the two pages — equal
results.

**All three pages against the standard.** One divergence: the escaping helper's apostrophe step replaced `'` with
a string that is itself `'` (so a single quote reached the markup raw; no sink takes a user value into a
single-quoted attribute or a script string — the grep of every `value="' +` / `=' +` site — so it was a gap, not a
hole). Fixed 854a805. The utilities are otherwise the standard's (`randomInt` / `escapeHtml` / `shuffle` on the
twins; `esc` / `rand` / `randFrom` are index's legacy names — gate 5, not drift).

**index.html against the standard** (its known exceptions aside: `mwg-` classes, injected styles, Georgia, the
5-field advanced input, `worksheets.pdf`, `mwgRosterData_v2`):
- Style constants match in value: container 1100 px; radii 8 / 12 / 999 px; `.mwg-btn-small` 7px 12px 14px,
  `.mwg-btn-large` 12px 20px 17px bold; the error / notice / success boxes, the mode pill and the student entry in
  `rgb()` equivalents of the standard's hex; the worksheet Arial; the description box 13 px italic in a #222 box;
  the branding snippet byte-identical at all six call sites.
- PDF pipeline constants identical: the two cdnjs URLs, 1056 × 816, scale 1.5, JPEG 0.92, `px_scaling`, `FAST`,
  the stage and clone `cssText`, the 300 ms / 50 ms timers, the `loadPdfLibs` guard and the `pdfDone` paths.
- Print CSS: the standard's rules plus `box-shadow:none`, `content-visibility:visible`, header / body flex rules
  and the variable grid's columns and rows 6–12; rows-3/4/5 are not fixed (the S4 P4). `#mwg-results-print` only
  (the move trick renames the id, so `#results` is not needed).
- Toggle UI: the same copy ("Advanced Input" ↔ "Back to Standard Input"), the same three buttons hidden in
  advanced mode. Settings labels: the same five; no "Header line (optional)" (deferred to the convergence session,
  S7's handoff).
- Saved payload: `students` where the standard says `standardStudents`, and no `headerLine` (CLAUDE.md now says
  so, 074ec5e; a P4 candidate carries the migration shape — read either key on load).
- Copy: four strings differed. The Generate Advanced Code empty-roster notice (the twins' said "with a name and
  level" though a name is optional and the code needs only a level; index's "complete student" said nothing) —
  fixed 12c44be on all three, approved S13. The code panel's help line, the "moved" success message and the two
  clear-roster confirms — approved S13 (index takes the standard's wording), queued.
- Shared helpers identical after name normalisation; `fitLongNames` differs only where index's header grid does
  (its `auto` column and the set label).
- The notice strings a teacher sees most ("Roster saved.", "Unable to save roster in this browser.", "Some entries
  were skipped:", the PDF notices, "Print Answer Key" and the other labels) are the same on all three pages.

**Controls.** `S13-escape-html --ref aadebcc` fails its static arm on all three pages (the helper returns the
apostrophe raw) and passes its live arm before and after — the entity is invisible once decoded, which is the
point. `S13-gencode-notice --ref 854a805` fails 3 (the old wording).

## S14 (2026-11-06) — pass I (first load, saved data & safety), the suite: all three pages

Method: a scratch audit over the harness (scratchpad `s14/i-audit.mjs`, logs `s14/audit-<page>.log`), 47 checks on
each standard page and 46 on index.html, all green. Arm R first: the smoke (60 checks), S12-a11y and the two S13
probes green (`s14/armR-*.log`). The static part: one `JSON.parse` per page, inside a `try` with the defaults as
the fallback; one `localStorage.getItem`, of `STORAGE_KEY` only; no inline event handler built by concatenation.
Every `innerHTML` site read by hand: the user values (name, number, header line, the validation list, the
skipped-entry list, the description) pass through `escapeHtml` / `esc`; the rest is static markup or option
lists built from the page's own tables (a saved value only selects, never prints).

**Fresh context** (empty localStorage, the untouched first paint): 3 empty rows, Standard mode, worksheets per
student 1, every toggle off, the paste box and header line empty, no status message, Add Student / Generate
Advanced Code / Fill Down shown, Generate and Save PDF enabled, nothing written to localStorage, 0 page errors.

**Save → reload.** A 4-student roster with a name, a number, every toggle on, 3 per student, a header line and a
paste-box text saves "Roster saved." under the standard payload keys (the twins: the eight CLAUDE.md names;
index: its seven with `students`) and comes back identical after a reload, "Saved roster loaded." shown, the
Remove 'Student Number' state re-applied. Saved in Advanced mode, the page reloads in Advanced mode with the
paste box kept and the three buttons hidden; the Standard roster is intact underneath.

**The two Clear buttons.** Cancelled, either confirm changes nothing. Clear Current rebuilds 3 empty rows, empties
the paste box and the results, returns to Standard mode and leaves the saved payload byte-identical (a reload
brings the saved roster back); it leaves the settings as they were (per student, the three toggles, the header
line) — by design, "roster" meaning the students. Clear Saved removes the page's key and leaves the current
roster untouched; the next load is the 3 defaults with no message.

**Isolation.** With all three keys seeded and every `localStorage` call logged (an init script wrapping
`Storage.prototype`), each page restores its own roster, reads only its own key on load, and Save / Clear Saved
touch only its own key; the other two payloads are byte-identical afterwards.

**Hostile values.** A saved payload with `<img src=x onerror=…>` in the name, number, level (grade, type, count,
`mixedTypes`, `fracOps` on index), header line, paste box, `inputMode` and `worksheetsPerStudent` loads to a
usable roster with the hostile name held literally in its input, prints it literally on sheet and key, writes it
as is into the advanced code: no image element is ever created, the handler never runs, 0 page errors. Typed
at every input — name, number, header line, a duplicated row, Generate Advanced Code → Use in Advanced Input,
a malformed advanced entry echoed by the skipped list, an unfilled row named in the validation box, Save →
reload — the same.

**Open.** The fallback on an unreadable payload is silent on all three pages (the S1 candidate named index
only), and on index a saved `mixedTypes` that is not an array throws inside `renderMixedCheckboxes` → the whole
saved roster is replaced by the defaults on screen (the payload itself is kept) — a shape the page never writes;
both folded into the one P4. Nothing else to fix: the session's three slots went to queued approvals.

**Controls** for the fixes: `S14-index-copy --ref 9030fbe` fails 4; S11-robustness on math-minute with the new
paste expectations fails 3 on the old parse (9 sheets, 4 reports) and is green after (7 sheets, 6 reports).

## S15 (2026-11-06) — pass L (metadata & discoverability), the suite: all three pages, and how they are deployed

Method: the three `<head>`s read from the live document over the harness (scratchpad `s15/l-audit.mjs`), the repo
root listed, and the public site fetched: mathsheet.io, its robots.txt and sitemaps, the pages the sitemap
names, and the GitHub Pages copies (`curl`, logs in `s15/`). Arm R first: the smoke (60 checks), the two S13
probes and S14-index-copy green (`s15/armR-*.log`).

**Deployment (new to the loop).** mathsheet.io is a WordPress site (Yoast SEO, Site Kit, AdSense). Its pages
`/custom-math-sheet-generator/`, `/math-minute-elementary/` and `/math-facts/` each hold one
`<iframe loading="lazy" width="100%" height="1400px">` whose `src` is `https://hbleiberg.github.io/mathsheet/`,
`…/math-minute.html` or `…/math-facts.html`; `mathsheet.io/math-minute.html` is a 404. The GitHub Pages copies
were byte-identical to `origin/main` (d52bf7d) at audit time, so GitHub Pages publishes `main` and merging the
branch is what deploys S6–S15. The public titles ("Free Math Minute Worksheet Generator – Elementary |
MathSheet.io"), descriptions, canonical, OG tags, robots.txt (`Disallow:` nothing) and sitemaps are WordPress's.
The maintainer confirmed the picture (gate, S15); CLAUDE.md carries it now.

**The repo pages' heads.** All three: `lang="en"`, `<meta charset="UTF-8">`, the viewport tag, a `<title>`
("Custom Math Sheet Generator", "Math Minute", "Math Facts"), nothing else — no description, canonical, OG,
robots or icon; no `<h1>`, no landmark (the only headings are the row h3s; the validation box is the one
`role`); no anchors at all (the pages link nowhere, the WordPress parent supplies navigation). GitHub Pages
answers 404 for `/mathsheet/favicon.ico` and `/robots.txt` (no robots → indexable). Searches for
`site:hbleiberg.github.io mathsheet` and for the product name returned no mathsheet.io or github.io result
(the search index used may not honour `site:`), so whether the copies are indexed today is unknown. Decided:
the copies are `noindex` (69deb36), since the WordPress pages carry the public metadata; a description or
canonical on the repo pages would be moot.

**The production shape works.** Each page inside a cross-origin `<iframe>` (a second local origin as the parent,
`s15/iframe-probe.mjs`, the cdnjs libraries allowed): Generate & Print reaches `window.print` once (the frame's
own document prints), and Save PDF delivers the download ("math-facts-worksheets.pdf", "worksheets.pdf", "PDF
saved!") in under 2 s with no console complaint about downloads or frames — in headless Chromium; a desktop
browser's download policy for cross-origin frames is the one residual unknown. The 1400 px frame scrolls
internally once sheets are generated (a Feature seed: post the document height to the parent).

**Candidates.** A favicon for the GitHub Pages copies (P4; the icon is the maintainer's choice — nothing is
shown inside the iframe). The silent fallback on an unreadable roster, approved and shipped (see Done).

**Controls.** `S15-head --ref 658ede3` fails 6 (no robots tag, two metas); `S15-unreadable-roster --ref 69deb36`
fails 12 (no notice, the value kept). The S15-unreadable-roster probe plants the value by hand and reloads: the
harness's `storage` seed re-plants on every navigation, so a "next load is clean" check can never pass through it
(a trap for the Probe rules).

## S16 (2026-11-06) — pass D (accessibility) on index.html: its own blocks

Method: a scratch audit over the harness (scratchpad `s16/d-index.mjs`, log `s16/d-index.log`) of what S12 did not
measure on index.html — the Mixed panel, the Fraction / Decimal Operations panel, the code panel and the
injected styles: accessible names and ancestors from Chromium's accessibility tree (CDP), focusable controls per
row shape, computed text colour against the effective background, `:focus-visible` and the computed outline,
bounding boxes, keyboard operation, then a generate. S12's index log (`s12/audit-index.log`) re-read for the shared
blocks. Arm R first: the smoke (60 checks), S14-index-copy, S15-head and S15-unreadable-roster green.

**Names.** Every Mixed checkbox is named by its label ("Level 1 — sums < 10"), every ops checkbox likewise, the
Select All / Deselect All / Select All Operations / All Operations buttons by their text. None sits inside a named
group: "Include in Mixed:" is a `<div>`, "Fraction Operations" a `<span>`, no fieldset, legend or `role="group"`,
so a screen reader hears "Level 1 — sums < 10, checkbox" with no word of which student or which panel (P4,
queued). The code textarea had no name (the S0 P4): fixed, see Done.

**Tab stops.** 17 focusable controls in a Mixed row (grade 1: 8 checkboxes, 2 buttons, the 5 fields, Duplicate and
Delete), 13 in a Fractions row, 7 in a plain row — a 30-student Mixed roster is some 510 Tab stops. By design of
the panels; noted, not a candidate.

**Contrast** (computed, on the panel's rgb(238,243,255) and the row's rgb(249,249,249)): the ops title
rgb(37,99,235) 13 px bold 4.65 (AA passes at 4.5), the group `<strong>` rgb(85,85,85) 12 px bold 6.71, "Include in
Mixed:" 11.4, the labels 15.7, the small buttons 18.3. Georgia changes nothing (S12).

**Focus and targets.** Every panel control shows the UA ring (`auto 1px rgb(16,16,16)` under `:focus-visible`, no
outline rule anywhere in index.html). Select All / Deselect All / All Operations are 67–123 × 23 px (12 px text,
2 px 8 px padding): 1 px under AA's 24 px minimum; the Mixed checkboxes 13 × 13; an ops checkbox's box is
196.8 × 13 because `.mwg-student-grid input { width: 100% }` reaches it — the same rule that puts the box above its
label (the C P3, S10). Folded into the P4 target-size candidate and the ops-panel P3's text.

**Keyboard.** Space toggles a Mixed checkbox, Enter on Deselect All leaves 0 of 8 checked and on Select All 8 of
8, a Mixed + Fractions + plain roster then generates 3 sheets with 0 page errors.

**Focus after actions** (the S12 P3, measured again before the fix): Delete by Enter → body; Generate Advanced
Code → focus stays on the button, the textarea unnamed; Close → body. Fixed on all three pages (6daf036): the
probe reads `document.activeElement` after every action. While building it, Fix's "scroll to the first
highlighted field" turned out to have never run: the highlight is set as `"2px solid rgb(204,0,0)"` but the inline
style serialises as `rgb(204, 0, 0)`, so `[style*="rgb(204,0,0)"]` matched nothing on any page — Fix only hid
the box. The fix matches the computed `style.border` with a regex and focuses the field.

**Controls.** `S16-focus --ref 196dd4a` fails 27 (focus on body everywhere, the panel opening without focus,
Escape idle, no name); `--ref 6daf036` fails the 3 name checks only. A `display:none` node has no accessible
name: the name arm reads with the panel open (a trap for the Probe rules).

## S17 (2026-11-07) — pass M (mobile & touch) on math-facts.html, the shared rows measured on all three

Method: scratch `s17/m-audit.mjs` (Playwright's `iPhone SE`, `iPhone 13`, `iPhone 13 landscape`, `iPad Mini`,
`iPad Mini landscape` descriptors on Chromium — no WebKit in the sandbox — and a 350 × 1400 touch viewport for the
production frame; five states: fresh, the validation box, the code panel open, Advanced mode, after a generate;
per state the document's scroll width, every element past the viewport, every scrolling box and the children it
cannot reach at `scrollLeft` 0, every control's box, font size and `inputmode`, fixed elements, `title`-only
hints); `s17/rows.mjs` (the button rows and field fonts on all three pages); `s17/iframe-m.mjs` (each page inside a
real cross-origin 100 % × 1400 px iframe, 20 px column padding, on an iPhone 13: the frame is 350 px wide).

**The button row** (`.button-row` / `.mwg-button-row`: `nowrap`, `overflow-x:auto`, `justify-content:center`):
the five roster buttons are 746 px wide with their gaps, so under a ~752 px box (a ~762 px viewport) the row
overflows on both sides, and a scroll box cannot scroll to its negative side. Unreachable at `scrollLeft` 0 on
every page: iPhone SE, iPhone 13 and the 350 px frame — Add Student wholly (−221…−116 px at 320 px), Generate
Advanced Code half; Clear Current / Clear Saved Roster past the right edge (scrollable, but no visible scrollbar
on a touch screen); Advanced mode cut Save Roster. iPhone 13 landscape (734 px box) cut Add Student by 6 px on
the twins; index's box (726 px) holds its narrower Georgia row. iPad Mini and desktop: fits. Fixed (8e40f96) by
wrapping in the ≤860 px query; desktop screenshots at 1280 / 1024 / 880 px pixel-identical before and after.

**index.html's responsive block was dead at every width.** `injectStyles()` appends `.mwg-student-grid` (five
`1fr` columns) and `.mwg-advanced-layout` (`minmax(0,1.5fr) minmax(280px,1fr)`) after the static sheet, so the
static ≤860 / ≤700 / ≤480 rules lost at equal specificity: an iPhone 13 showed five 60 px roster columns (the
selects read "Gra", "Sele", "Cou"; 38 px on an iPhone SE) and a 46 px paste box (18 px on the SE) beside a
280 px Grade Reference. Fixed (13bcc9b) with `#mwg-app` on the three rules; the Mixed and Fraction-ops panels fit
at 320 and 390 px with nothing past the edge. The S10 ops-label P3 is the same mechanism.

**Clean.** The code panel (340 px textarea, Copy / Use / Close 34 px tall, Close wraps to its own line at 390 px)
and the validation box (Fix / Generate Anyway) fit at every shape; opening the panel focuses the read-only
textarea inside the viewport (344–464 of 568 px on the SE; read-only, so no keyboard). No `position:fixed`
element anywhere, so the keyboard has nothing to cover; the student number is `type="text"` with no `inputmode`.
The Level Reference card fits at 320 px (its `min-width:250px` grid inside 278 px). No horizontal document scroll
before a generate at any shape; 0 page errors; Generate & Print reaches `window.print` on every shape (mobile
print preview itself is the browser's and was not exercised).

**Queued.** Every roster field, select and the paste box is 14 px (index's too): iOS Safari zooms the page when
a field under 16 px takes focus — documented WebKit behaviour, not reproducible on Chromium; the fix is 16 px in
the phone query, proved by computed size. After a generate the 1056 px sheets give the page (and the iframe) a
1064 px scroll width at every shape under 1064 px, the iPad in landscape included. Controls at phone width:
buttons 34 px tall, fields 36 px, the three checkboxes 16 px, Duplicate / Delete 16 px (the target P4); the
Header line and Name blank hints are `title`-only (the S12 P4).

**Controls.** `S17-phone-layout --ref e2bb697` fails 20 (arm 1), `--ref 8e40f96 --only index.html` fails 8
(arm 2), `--ref 13bcc9b --only math-facts.html` fails 1 (arm 3); the desktop one-line check passes on both sides.

**Seen on the contact sheet afterwards.** After the validation box's Fix, the red "missing" borders stay on fields
the teacher then fills, until the next Generate clears them: with every field filled, 9 still red on index.html,
3 on each twin (scratch `s17/red.mjs`, change events fired). Queued as a three-page P3.

## S18 (2026-11-07) — pass H (teacher walkthrough) on index.html, the frictions measured on all three pages

**Method.** Real clicks and keys at 1280 × 900 (scratch `s18/walk.mjs`): Student 1 filled by hand (Avi Cohen, 1,
Grade 3, Multiplication Level 2, 40), Add Student × 19, Fill Down, 21 names typed (five Hebrew: "יעל לוי",
'מאיר כ"ץ', "שרה בת-אל", "רחל פרידמן.", "אורי (אורי) כהן"), Student 7 moved to Grade 2 Addition 2, Student
15 to Grade 4 Division 2, the IEP student's counts read, Print Answer Key, Generate & Print, then a reload with no
Save Roster. `walk2.mjs` repeated the save and Fill Down findings on the twins, `walk3.mjs` / `walk4.mjs` pasted
every example and type the Advanced help names.

**Building the class: 52 actions, and gone on reload.** No autosave on any page: Generate & Print, then a
reload, gives three empty rows and an empty storage (`[]`) on all three pages. Shipped (fde4b66, approved): a
notice after Generate & Print or Save PDF when the roster on screen is not the saved one (standard rows by
`JSON.stringify` against the saved list, Advanced by the trimmed text; storage denied → no notice).

**The Advanced help taught a format the page rejects.** The help was written for mwg.js's types: its placeholder,
its Example line and its empty-name example ("…, addition, 30, 3;") were each skipped as "invalid type for grade
3: addition", the first four names of its type list ("addition, subtraction, multiplication, division") at every
grade, and its brackets as written ("fractions[add|sub]" → "invalid type for grade 5: add"; the page took only
"fractions[fractions-add]", the spelling Generate Advanced Code writes). No level code (add1 … div5) appeared
anywhere in the help. Fixed (e71f8fc, approved): the help names the codes; both bracket spellings read.

**Hebrew names.** "רחל פרידמן." printed its period at the name's right, the start for a Hebrew reader (the
field's base direction is the page's); parentheses rendered correctly. `<bdi>` fixes the order and keeps the name
at the left of its line; `dir="auto"` on the span would right-align it (offered as the second option). Shipped on
the twins (36f71e4); the real print and the real cdnjs Save PDF were rasterized before and after (scratch
`s18/bidi-artifact.mjs`): the Hebrew names corrected in both, "Avi Cohen." and every other header pixel identical.

**Save PDF and long names (logged P2).** On the same rasters: a name still too long at the 11 px floor ends in "…"
in print but is cut mid-letter in Save PDF ("Alexandria Montgomery-Washington th", "Chaya Mushka Bat-Sheva
Schneerson-(") — html2canvas draws no `text-overflow` ellipsis — and "אלישבע רחל בת-שבע פרידמן-גולדשטיין.", which
fits at 11 px in print, loses its first letter in the PDF. Identical before and after 36f71e4.

**Fill Down.** It copies Student 1's grade / type / count (the level on the twins) over every row, including
rows set differently (before 2,2,8 → after 2,2,2 on index; 1,1,21 → 1,1,1 and +0+1,+0+1,mixmd60 → all +0+1 on
the twins), with "Settings filled down from Student 1." and no undo. So the order matters: fill first, then set
the exceptions, and a later Fill Down for a new student resets them. Approved S18: confirm first; queued.

**Smaller frictions.** Add Student numbers from the last row only: Student 1 = 1, rows 2–22 blank (the twins do not
number at all; P4). A Grade change keeps a still-valid type and count (Student 7: mul2 / 40 kept at Grade 2). The
smallest count is 30 on every page (index's VALID_COUNTS; the twins' rows-3), so an IEP sheet of 20 is the Large
print seed. Seven Tab presses from one name to the next (number, grade, type, count, the next row's Duplicate and
Delete). A names column pasted into Advanced is skipped line by line ("needs 5 fields"): the Paste names seed.
Generate Anyway prints the complete rows and drops a half-filled one silently, but the box listed it just before.

**Clean.** Enter in a name field submits nothing (two text fields per row block implicit submission). Keys print
after all the sheets (22 S then 22 K), so a parent helper's stack is one range. A blank-name row with 5 per student
gives a substitute 5 unnamed sheets (Duplicate for more); Name blank empties every sheet's name line and keeps the
keys named. 0 page errors throughout.

**Controls.** `S18-advanced-help --ref 1f80a43` fails 7, `S18-unsaved-reminder --ref e71f8fc` fails 12 (the
storage-denied arm asserts the denial took), `S18-hebrew-name --ref fde4b66` fails 8. `S9-name-fit` failed its
byte-identical arm against HEAD while 36f71e4 was uncommitted (every name now carries `<bdi>`), green once committed.

## S19 (2026-11-08) — pass M (mobile & touch) on index.html; the S18 long-name P2 re-measured

**Method.** Scratch `s19/m-index.mjs` (S17's audit adapted to index: Playwright's `iPhone SE`, `iPhone 13`, `iPhone 13
landscape`, `iPad Mini`, `iPad Mini landscape` on Chromium and a 350 × 1400 touch frame; states fresh, the validation
box and Fix, the Mixed / Fraction / Decimal panels on three rows, the code panel, Advanced, after a generate; per
state the scroll width, elements past the edge, scrolling boxes, every control's box, font and `inputmode`, selects
whose chosen text is cut, fixed elements); `s19/cp.mjs` (the code panel's focus after the smooth scroll);
`s19/cut.mjs` and `s19/desk.mjs` (the selects at 481–1280 px); `s19/contact.mjs` (the iPhone 13 contact sheet).

**Clean.** No horizontal document scroll before a generate at any shape; nothing past the edge, no scroll box hiding
a control; no `position:fixed` element; the student number stays `type="text"` with no `inputmode`. Fix focuses the
first highlighted field inside the viewport (265–302 of 568 px on the SE). The code panel's textarea settles in view
once its smooth scroll ends (304–424 of 568 on the SE, 444–564 of 664 on the iPhone 13; mid-scroll at 250 ms it
read 560–680, a timing artifact). The Mixed and ops panels fit at 320 px; Advanced fits; 0 page errors.

**Confirmed, queued already.** 16 fields and selects at 14 px (17 with the code panel) at every shape: the iOS zoom
P3. Duplicate / Delete 16 px tall, the three checkboxes 16 px, the ops and Mixed checkboxes 13 px, Select All /
Deselect All 23 px (the target P4). After a generate the page scrolls sideways (1068 px). The ops checkboxes sit
above their labels (the S10 P3); at phone width each one sits above-right of its label, between two labels.

**New (P4).** The Problem Count select cuts "30 problems (max for this type)" at every width (178 px of text in a
~167 px inner box at 1280; "30 problems (ma" at 768), and in the five-column layout at 701–860 px the Type select cuts
"Scientific Notatio", "Order of Operatio". Shorter option text is gate 2; two rows of fields there is gate 4.

**The S18 P2, re-measured (scratch `s19/long.mjs`, `hook.mjs`, `h2c-field.mjs`, `h2c-width.mjs`).** html2canvas 1.4.1
draws Hebrew and English names at the browser's own width (ink within 1.6 px of the DOM at 11, 15.5 and 18 px, with
and without `<bdi>`, alone and in the real clone). S18's "a long Hebrew name that fits in print loses its first letter
in the PDF" was the test script's own doing: it moved the results back *after* the app root, outside
`#math-facts-app *{box-sizing:border-box}`, so the regenerate inside Save PDF measured a 227 px name box and sized the
names 12 / 17 px where print had 11 / 15.5. With the results restored to their place, every name that fits is the same
in print and PDF. Real, on all three pages: a name still too long at 11 px is cut mid-letter in Save PDF ("Alexandria
Montgomery-Washington th"; "Bartholomew Montgomery-Washington", its "Jr" gone with nothing to say so), since its "…"
is CSS; and a Hebrew name too long at 11 px loses its first name in print as well — in an LTR line its overflow and
the CSS "…" fall at the right, its start ("…שבע פרידמן-גולדשטיין הכהן מירושלים").

**Fixed (84025f7).** `fitLongNames()` writes the cut at the floor: the longest start that fits in the room less 1 px,
plus "…", into the text (the `<bdi>`), so print and the PDF agree and every name keeps its start. Rasters of the real
print and the real cdnjs Save PDF, 14 pages a page, before and after: print differs only on the long Hebrew name
(the English floor names print pixel-identical: the written cut falls where the CSS one did); the PDF differs only
inside the four floor names' boxes. On index, without a `<bdi>`, the Hebrew "…" then sat beside the first letter —
fixed with index's `<bdi>` (bf9f2c7): "שרה כ.", "רחל פרידמן." and the cut name end correctly in print and PDF, "Avi
Cohen." pixel-identical.

**Fill Down (c68f197, the twins).** A row with a level that is set and differs from Student 1's is named in the
approved question; Cancel leaves every row and says nothing; empty and matching rows fill unasked; a Student 1 with
no level names the rows it would blank. Index's grade / type / count rows (and their ops and Mixed picks) wait for
its next touch.

**Controls.** `S19-long-name --ref f9e7b6a` fails 42 (14 a page); `S18-hebrew-name --ref 84025f7 --only index.html`
fails 4; `S19-fill-down --ref bf9f2c7` fails 10. `S9-name-fit` stayed green before and after each commit (the change
touches only floor names; its byte-identity arm compares names that fit).

## S20 (2026-11-08) — pass H (teacher walkthrough) on math-minute.html

**Method.** Real clicks and keys at 1280 × 900 (scratch `s20/walk.mjs`, `s20/walk2.mjs`): Student 1 typed by hand (Avi
Cohen, 1, Level 5), Add Student × 19, Fill Down, 21 names and numbers typed (five Hebrew: "יעל לוי", 'מאיר כ"ץ',
"שרה בת-אל", "רחל פרידמן.", "אורי (אורי) כהן"), Student 7 (an IEP) moved to Level 1, Student 15 to Level 13, Print
Answer Key, Generate & Print, Save Roster; then next week (a reload, Student 1 to Level 7, Fill Down), a new student,
the Hebrew round trip through Generate Advanced Code, a spreadsheet paste, a substitute's blanks.

**Building the class: 112 actions** (1 + 19 Add Student + Fill Down + 21 × (click, name, Tab, number) + the two
exceptions). Five Tab presses from one name to the next (number, level, the next row's Duplicate and Delete). Add
Student leaves the number empty (Duplicate adds one): 42 of the 112 actions typed 2…22. Type-ahead in the Level select:
"5" picks nothing, "05" picks Level 5 (the options read "05 - 40 Addition"; 10–21 work as typed).

**Fill Down after S19 (found, fixed, approved).** The week the class moves up (Student 1 from 5 to 7, then Fill Down),
S19's question read "Fill Down will change Students 2, 3, 4, … 22, which have their own settings. Continue?" — true
of 2 of 21; OK reset the IEP student and the advanced one, Cancel left the class on 5. A new student (row 23) and Fill
Down: "…Students 7 and 15…", and OK reset both while Cancel left the new row empty. Shipped (aafa34e, approved): no
question; the empty rows and the rows still on Student 1's earlier level follow, a row on its own level keeps it, and
the message names it; index's half in the same shape (8083292), its settings being grade, type, count, Mixed picks and
operations.

**A spreadsheet paste (found, fixed, approved).** Three columns copied from a spreadsheet arrive tab-separated: every
line skipped, the error quoting "Avi Cohen 1 5" (the tabs shown as spaces). "Avi Cohen, 5" (no number field) is
skipped too (the help shows ", 2, 19;" for an empty name; two fields would be ambiguous: "2, 19"). Shipped (b7eb193, approved): a
line short of its fields by commas is read by its tabs, a name in two columns joined by a space; a stray tab inside a comma
line stays whitespace (`S11-robustness`'s "Eli\t, 9, 10"). A spreadsheet row with an empty name cell loses its leading
tab to the entry's trim and is reported as invalid (not silent).

**Smaller frictions.** With 22 rows the page is 3,144 px tall: Fill Down at y = 146, Add Student at 2,966 and Generate at
3,014 (rows 113 px), so a new student's Fill Down is a scroll to the top. The sheet header has nothing for the time or
the score (Name, Number, the description, the branding): the Time / Score seed is the one a timed sheet most lacks.
The parent helper's 22 keys are one per student (each sheet is dealt on its own): the compact-key seed, on math-minute
too.

**Clean.** The unsaved-roster notice after Generate & Print (S18); Save → reload restores every level; keys after all
sheets (22 S then 22 K); the Hebrew names print isolated (S18) and round-trip through Generate Advanced Code and the
Advanced box unchanged; a substitute's three nameless Level 5 rows × 5 print 15 sheets "Worksheet k of 5"; a named row
with no level is caught by the validation box ("Student 2: missing Level"). 0 page errors.

**Controls.** `S20-fill-down --ref f14b27e` fails 14 on the twins, `--ref b7eb193 --only index.html` fails 7;
`S20-spreadsheet-paste --ref aafa34e` fails 30. The first paste shape ("a line with a tab is read by its tabs") failed
`S11-robustness` 9 times (its "Eli\t, 9, 10" read as two fields); green once reshaped. `S7-bracket-names` (1) and
`S7-skipped-list` (6) fail on HEAD and on f14b27e alike: stale comparisons, not this session's.

## S21 (2026-11-08) — pass H (teacher walkthrough) on math-facts.html

**Method.** Real clicks and keys at 1280 × 900 (scratch `s21/walk.mjs`, `s21/walk2.mjs`): a second-grade class of 22,
Student 1 typed by hand (Avi Cohen, 1, +3), Add Student × 19, Fill Down, 21 names and numbers typed (the five Hebrew
names of S20), Student 7 (an IEP) on "+0  +1", Student 15 on "30 mixed +/-", Print Answer Key, Generate & Print, Save
Roster; next week (a reload, Arrow Down from +3 to +4, Fill Down); Generate Advanced Code; then the Advanced box as a
teacher writes codes, a spreadsheet's level column, a substitute's blanks, Duplicate.

**Building the class: 112 actions**, as on math-minute (42 typed numbers; Add Student leaves the number empty,
Duplicate adds one but copies the name too). 44 pages, sheets then keys; every single-fact level prints 30 problems.

**Next week by fact family (clean).** Arrow Down moves +3 to +4 (the menu runs +0 +1, +2, Doubles, Doubles +1, +3 …);
Fill Down: "Level filled down from Student 1. Students 7 and 15 kept their own levels." (S20's rule held). The message
sat at y = 3,074 with the button at 146: S20's P3, fixed on all three pages (516b2d4).

**The codes a teacher writes (found, fixed).** 34 plausible spellings pasted one per line: 15 skipped as "invalid fact
code", 9 of them a real code written otherwise — "+0 +1" (as the level menu shows it), "Doubles", "Doubles +1", "Mix+30",
"mix +30", "mix+ 30", "x 3", "–3" (an en dash) and "−3" (the minus sign). Shipped (caedad5): the code is lower-cased,
its spaces dropped and any dash read as a hyphen; still skipped: "3", "+1", "fr10", "mix+/-30", "mix±30", "mixx/30".
Index reads its Advanced type case-sensitively too ("Add1", "Fractions"): queued P4.

**A spreadsheet's level column (approved, queued).** Excel and Google Sheets store a typed "+3" as the number 3 (not
testable in the sandbox), so a pasted column reads "Avi Cohen 1 3" and each line is skipped with no reason; approved
S21 (gate 2): when the code is a bare whole number the skipped line says a spreadsheet turns +3 into 3. math-facts was on
its cap.

**Smaller frictions.** Type-ahead in the Level select: "+1" picks "+10 (Teens Rule)", "3" picks "30 mixed +", "x3"
and "m" pick nothing (the options read "×3", "30 mixed"); "+3", "+4", "-3", "d" work. A Hebrew line in the Advanced box
(and the code panel, both LTR) shows in Hebrew order: "יעל לוי, 3, +4;" displays as "4+ ,3 ,יעל לוי;" — the data is right
(S20's round trip); per-line direction is a display choice (P4, gate 3). The header has nothing for time or score (the
seed, as on math-minute).

**Clean.** Save → reload restores every level; the unsaved-roster notice; the Hebrew names round-trip through Generate
Advanced Code; three nameless rows print 3 blanks; "×3", "*3", "X3", "÷3", "/3", "-self", "-fr10", "mix×30", "mix÷30",
"mix*30" read as documented; the Level select cuts no option (longest 123 px in 349). 0 page errors, no dialog.

**Fixes' controls.** `S21-fact-codes --ref f5a60c2` fails 22; `S21-fill-down-status --ref caedad5` fails 39;
`S21-fraction-sub --ref 516b2d4` fails 9 (26 % of "Fractions — Subtraction" and 34 % of the Fractions type's
subtractions x − x, ½ − ½ at d = 2; after: 0 of 5,528). `S11-robustness` green on caedad5, run from a frozen worktree so
the next fix could be edited meanwhile. Stale before S21: `S8-index-key-division` (2, seeded identity to d3ef5c6) fails
on caedad5 too; `S5-key-rows12`'s reference 5c3b01a is not in the repository; `S7-bracket-names` (1) and
`S7-skipped-list` (6) unchanged.

## S22 (2026-11-08) — pass D (accessibility) on math-minute.html

Method: a scratch audit over the harness (scratchpad `s22/d-mm.mjs`, `s22/d-mm2.mjs`, logs beside them): every
interactive node's role and name from Chromium's full accessibility tree (CDP) in four states (fresh Standard, the
validation box shown, the code panel open, Advanced), Tab walks in both modes recording `:focus-visible`, the computed
outline and whether the stop is in view, every flow by keyboard, text colour against its effective background (WCAG
luminance, placeholders by `::placeholder`), the box of every control, the live regions, WCAG 1.4.12 text spacing
injected, 1280 × 900 at 200 % (640 px). Arm R first: the smoke, the two S20 and three S21 probes green. S12 measured
the shared blocks on the twins and S13 found them identical outside their selectors, so D read math-minute's own parts
(its Level select and reference) and what changed since S12 (the S16 focus moves, the S18 notice, the S20–S21 Fill Down
line).

- **Names.** 29 interactive nodes in Standard, 36 with the validation box, 38 with the code panel, 12 in Advanced: none
  unnamed. The row fields read "Student 2 Level" (S12 holds), the code textarea "Advanced Input Code" (S16), Fill Down's
  status line is polite. "Fill Down Settings ↓" is read with its arrow ("downwards arrow"): noted, not a candidate.
- **Keyboard.** 29 Tab stops in the visual order, every one with the UA ring and in view; Enter / Space fire every
  button; ArrowDown changes a Level; Delete moves focus to the next row's Delete, the code panel opens on its textarea,
  Escape closes it back to the opener, Fix lands on the empty Level, Use in Advanced Input on the Advanced box, both
  Clears keep focus on themselves after their confirm. **Save PDF dropped it**: the button is disabled for the export
  (S10) and a disabled focused button loses focus to the page's start, so after "PDF saved!" the next Tab was the mode
  toggle at the top (all three pages; with 22 students ~120 Tabs back to Save PDF). Fixed, 7dbcdb9 (see Done); the first
  shape also focused after a mouse click and scrolled a 22-row page ~470 px at the save's end, so it is limited to a
  button showing its focus ring (`:focus-visible`), which a click does not.
- **Reading order.** The Level Reference shows two columns (1–11, 12–21) but was written row by row: a screen reader read
  1, 12, 2, 13, … 10, 21, 11 (math-facts' reference reads by rows of codes, as it looks). Fixed, a458824: written in level
  order, `grid-auto-flow: column` over 11 rows, the same pairs per row, pixel-identical at 1280, 800 and 390 px.
- **Option text.** The Level options read "11 - Easy X" (the letter X), "16 - Easy ÷", "05 - 40 Addition"; type-ahead "5"
  picks nothing, "1" picks "10 - 60 Subtraction", "12" Level 12. Option text is gate 2, and the letter X was kept by the maintainer in S9: not a candidate.
- **Contrast** (lowest first): placeholders 4.61, the delete red 6.15, the unsaved notice 6.66, the success line 6.63,
  the links 8.10, the help 9.25; the answer key's red rgb(180,0,0). **Targets**: Duplicate / Delete 100 / 84 × 16, the
  three checkboxes 16 × 16, `.btn-small` 34 tall (the S12 P4). **Text spacing**: nothing clips, no sideways scroll; 200 %:
  no sideways scroll. **Still open** (P4s, confirmed): no `aria-invalid` with the red border, no heading or landmark but
  the row h3s, the six smooth scrolls under reduced motion.

**Also shipped.** math-facts' approved spreadsheet hint (3589e48): a bare whole-number code adds "A spreadsheet turns +3
into 3: type it as '+3 there, or fix it here."; "fr10", "plus 3", "3.5", "-3x" read as before. index's approved description
shrink (ef52c67), measured first over every grade × type the form offers: with 5 copies and keys 1,045 of 1,510
descriptions ran past their room (a sheet's under "Worksheet 3 of 5", overprinting it; a key's under the branding tag,
"(Key 3 of 5)" lost), 44 of 302 with one copy and a key, none with the Number removed (the column is `auto`). The longest,
Division Level 4's key, needs 9.5 px of 13; the floor is 9 px, the branding tag's size.

**Controls.** `S22-pdf-focus --ref ac0a2e4` fails 15; `S22-level-reference --ref 7dbcdb9` fails 6 and a planted 10-row grid
fails its geometry and pixel checks; `S22-spreadsheet-hint --ref a458824` fails 4; `S22-desc-fit --ref 3589e48` fails 3.
`S10-pdf-progress` fails 3 on ac0a2e4 as on HEAD: it expects the status to end on "PDF saved!", which S18's unsaved-roster
line follows (stale, listed). `S9-name-fit` compares every sheet with HEAD byte for byte, so it flags a description's new
style until the commit lands, then reads green.

**After the close-out.** The maintainer declined the Time / Score strip ("No time/score"): the seed is struck to the archive.
