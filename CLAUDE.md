# CLAUDE.md — MathSheet.io worksheet generators

Guidance for working in this repo. It defines the **standard** conventions every generator
page should follow, and flags the places where current files diverge so you recognize them
rather than copy them.

## Git workflow — Always push to `main`

**Commit and push directly to `main` for all changes.** This project does not use a
feature-branch / pull-request workflow — skip branching and PRs unless explicitly asked.
Make focused commits with clear messages and push to `main`.

## Project overview

MathSheet.io is a set of **self-contained, static HTML worksheet generators**. There is no
build step, no framework, and no bundler — each page is one `.html` file you can open
directly in a browser. The only external dependencies are two CDN scripts (html2canvas +
jsPDF) used for PDF export, fetched on the first Save PDF click rather than with the page.

| File | Purpose |
|------|---------|
| `index.html` | "Custom Math Sheet Generator" — grade-based (grades 1–8), many problem types. |
| `math-minute.html` | Roster-based timed "Math Minute" generator (21 numeric levels). |
| `math-facts.html` | Fact-family "Math Minute" generator (Addition / Subtraction / Mixed). |
| `mwg.js` | **Legacy, unused.** Orphaned precursor to `index.html`'s inline script — not referenced by any page. Reference only; do not wire it into a page. |
| `scripts/loop/` | Dev-only tooling (Node 22 + the preinstalled Playwright): `smoke.mjs` is the regression floor for all three pages; `closeout.mjs` runs every check. Nothing here is loaded by a page. |
| `docs/` | The improvement loop's files: `IMPROVEMENT_LOG.md` (live state), `IMPROVEMENT_ARCHIVE.md` (history), `loop-passes.md` (pass definitions), `loop-findings.md` (measurements). |

Each page embeds everything: a `<style>` block (or JS-injected styles), the markup, and a
single IIFE `<script>`. When adding a feature, edit the relevant page in place.

## Code & file layout standard

- **One self-contained file** per generator. Root wrapper `<div id="<page>-app">` (e.g.
  `#math-facts-app`); all CSS lives in an embedded `<style>` block scoped under that id.
- **All JS in one IIFE:** `(function () { "use strict"; … })();`. No globals leak.
- **Init pattern** — poll for the form container, with a `DOMContentLoaded` fallback:
  ```js
  function waitAndInit() {
    if (document.getElementById("studentsContainer")) {
      assignDomRefs(); wireButtons(); init();
    } else { setTimeout(waitAndInit, 50); }
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", waitAndInit);
  else waitAndInit();
  ```
- **Naming:** unprefixed CSS classes (`.worksheet`, `.problems-grid`, `.rows-3`,
  `.problem-cell`, `.problem-stack`) and plain `camelCase` DOM ids (`studentsContainer`,
  `results`, `worksheetsPerStudent`).
- **Utilities** (define per page; keep these names):
  ```js
  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function escapeHtml(text) { return String(text)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#x27;"); }
  ```
  **Always `escapeHtml(...)` any user-entered value** (names, numbers, descriptions) before
  inserting it into HTML.
- **Problem objects** — plain data, rendered separately:
  ```js
  { kind: "stack",    operator: "+"|"−"|"×", a, b, answer }   // a over b, ruled line
  { kind: "division", divisor, dividend, answer }              // long-division bracket
  ```
  The minus sign is U+2212 (`"−"`), not a hyphen. Render with `renderProblem(problem)` and,
  for keys, `renderAnswerProblem(problem)` (answers in red `rgb(180,0,0)`).

## Advanced input (standard)

Every generator offers a Standard form **and** an Advanced paste box. Keep both in sync.

- **Format — 3 comma fields per student, `;`- or newline-separated:**
  `Name, Number, Selector;` where **Selector** is that page's level/fact code (e.g.
  `19` for math-minute's numeric levels, `+10` for math-facts).
- **Parsing algorithm (reuse verbatim — `getStudentsFromAdvancedInput`):**
  ```js
  var normalized = raw.trim().replace(/\n+/g, ";");   // newlines act as ";"
  var chunks = normalized.split(";");
  // for each chunk: trim; skip if empty; split(",");
  // more than 3 parts: rejoin all but the last two with "," as the name ("Cohen, Avi", S3);
  // trim each part; require 3 fields; require name; validate the selector;
  // on any failure push a human-readable message to errors[] and `continue`
  // (invalid entries are SKIPPED, never fatal, and listed back to the user).
  ```
- **Reverse — "Generate Advanced Code"** (`buildAdvancedCodeFromStandardRoster`): serialize
  the standard roster back to the paste format, one `Name, Number, Selector;` per line.
- **Toggle UI:** a `.mode-pill` (`#modeIndicator`) plus a button that flips
  `"Advanced Input"` ↔ `"Back to Standard Input"` (`setInputMode`). In advanced mode, hide
  **Add Student**, **Generate Advanced Code**, and **Fill Down**.
- Provide a reference list of valid selectors next to the paste box.

## Print behavior (standard)

Worksheets print as **landscape US Letter (11in × 8.5in)**, one worksheet per page.

- **CSS** (copy as-is; two lengths already mean landscape — `11in 8.5in landscape` is invalid
  CSS that browsers drop silently, so the dialog fell back to portrait and A4 split every sheet, S2):
  ```css
  @page { size: 11in 8.5in; margin: 0; }
  @media print {
    html, body { margin: 0 !important; padding: 0 !important; }
    body > * { display: none !important; }                 /* hide the app UI */
    #results, #results-print { display: block !important; width: 11in !important;
      margin: 0 !important; padding: 0 !important; }
    .worksheet { display: flex !important; flex-direction: column !important;
      border: none !important; margin: 0 !important; padding: 0.25in 0.3in !important;
      width: 11in !important; height: 8.5in !important; overflow: hidden !important;
      box-sizing: border-box !important; }
    .problems-grid { grid-template-columns: repeat(10, 1fr) !important; }
    .rows-3 { grid-template-rows: repeat(3, 2.4in)  !important; }
    .rows-4 { grid-template-rows: repeat(4, 1.8in)  !important; }
    .rows-5 { grid-template-rows: repeat(5, 1.44in) !important; }
    .rows-6 { grid-template-rows: repeat(6, 1.2in)  !important; }
    .worksheet.print-break { page-break-after: always !important; break-after: page !important; }
    .worksheet:last-child  { page-break-after: avoid  !important; break-after: avoid !important; }
  }
  ```
  The grid is **always 10 columns**; the row count sets problem count (30/40/50/60 ⇒
  `rows-3`/`-4`/`-5`/`-6`). Mark every worksheet except the last with `print-break`.
- **JS print flow (the "move to body" trick — `doGenerateAndPrint`):** generate worksheets,
  then after `setTimeout(…, 200)`: save `results.parentNode`/`nextSibling`, set
  `results.id = "results-print"`, `document.body.appendChild(results)`, `window.print()`,
  then restore the id and original DOM position. This is what makes `body > *{display:none}`
  reveal only the worksheets.

## PDF saving (standard)

PDF is a rasterized mirror of the print layout (so output matches print exactly).

- **Libraries — loaded lazily, never with the page.** No `<script src>` tags: `PDF_LIB_URLS` names
  the two cdnjs files and `loadPdfLibs()` (per-URL cached `loadScriptOnce`) injects them on the first
  Save PDF click, resolving `true` when both are present and `false` on a failed fetch (which is
  forgotten so the next click retries). Only Save PDF needs them; as blocking tags they delayed the
  roster and every button by the whole download (loop S1).
  ```js
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
  ```
- **Pipeline (`doGenerateAndSavePdf` → `capturePdf(sheets)`):**
  1. Guard: `doGenerateAndSavePdf` calls `loadPdfLibs()` before generating, waits for it after the
     300 ms settle, and on `false` shows the "PDF library not loaded yet" notice and bails;
     `capturePdf` runs only once both libraries exist.
  2. Build an off-screen **stage** `div`: `position:absolute; top:0; left:0;
     width:1056px; height:816px; overflow:hidden; z-index:-1000; pointer-events:none;
     background:white;` (1056 × 816 = 11in × 8.5in @ 96 dpi).
  3. For each `.worksheet` (and answer-key sheet): clone it, size the clone
     `width:1056px; height:816px; padding:24px 29px; background:white;
     box-sizing:border-box; display:flex; flex-direction:column;`, remove `print-break`,
     give its `.problems-grid` print's fixed rows (`rows-3` → `repeat(3,2.4in)` … `rows-6` →
     `repeat(6,1.2in)`; the screen's `1fr` set every PDF problem up to 19 px lower than on paper, S4),
     place it in the stage.
  4. `html2canvas(clone, { scale: 1.5, useCORS: true, allowTaint: true, width: 1056,
     height: 816, windowWidth: 1056, windowHeight: 816, backgroundColor: "white",
     ignoreElements: function (el) { return el === results; } })` →
     `canvas.toDataURL("image/jpeg", 0.92)`. (html2canvas copies the whole document per page;
     skipping the results container cut a 150-page export from ~2 min to ~35 s, S3.)
  5. First page: `new jsPDF({ orientation: "landscape", unit: "px", format: [1056, 816],
     hotfixes: ["px_scaling"] })`; later pages `addPage([1056, 816], "landscape")`; add with
     `addImage(imgData, "JPEG", 0, 0, 1056, 816, "", "FAST")`.
  6. Drive it with a recursive `captureNext(idx)` (≈50 ms between pages, ≈300 ms initial
     delay so layout settles).
  7. Save as **`<page>-worksheets.pdf`** (e.g. `math-facts-worksheets.pdf`).

## Style constants

- **Fonts:** worksheets are **always `Arial, sans-serif`**. UI font is also `Arial` (the
  standard). *(Exception: `index.html` uses `Georgia, serif` for its UI.)*
- **Layout:** app container `max-width: 1100px; margin: 0 auto;`. Border-radius **8px**
  (modal **12px**, mode-pill **999px**).
- **Color palette:**

  | Role | Value |
  |------|-------|
  | Body text | `#111` *(index: `#1a1a1a`)* |
  | Secondary text | `#444` |
  | Link / action blue | `rgb(6,69,173)` *(index hex `#0645AD` — same blue)* |
  | Delete-link red | `rgb(185,28,28)` |
  | Answer-key red | `rgb(180,0,0)` |
  | `.error-box` | border `#d33`, bg `#fff3f3`, text `#900` |
  | `.notice-box` | border `#d6aa00`, bg `#fff8db`, text `#6b5600` |
  | `.success-box` | border `#3c9a49`, bg `#eefbf0`, text `#23652d` |
  | `.mode-pill` | bg `#eef3ff`, border `#c7d6ff` |
  | `.student-entry` | bg `#f9f9f9`, border `#ccc` |
  | Worksheet header borders | `#222` |

- **Buttons:** `.btn-small` = `padding:7px 12px; font-size:14px;`. `.btn-large` =
  `padding:12px 20px; font-size:17px; font-weight:bold;`.
- **Worksheet header description box:** italic, 13px, with the fact/level description plus a
  branding tag. **Use this exact branding snippet:**
  ```html
  <span style="font-size:9px;color:rgb(187,187,187);font-style:normal;margin-left:8px;flex-shrink:0;font-family:Arial,sans-serif">MathSheet.io</span>
  ```
- **Settings & toggles** (shared labels): "Worksheets per student" (1–5), "Print Answer
  Key", "Remove 'Student Number' Field", "Name blank", "Fill Down Settings".
  - **Student Name is always optional** in both Standard and Advanced input (an advanced
    entry may start with an empty field: `, 2, +10;`). A blank name just prints an empty
    Student Name line — never skip a student or flag them as invalid for a missing name.
  - **"Name blank"** (`nameBlankToggle`, helper `isNameBlank()`): prints an empty Student
    Name line on every worksheet even when a name is entered (answer keys still show the
    name). Student Number is always free text — never validate it as numeric.
- **localStorage:** one key per page, named `"<page>RosterData_v<N>"` (e.g.
  `mathFactsRosterData_v1`, `mathMinuteRosterData_v2`). Saved payload:
  ```js
  { inputMode, worksheetsPerStudent, answerKey, removeNumber, nameBlank, advancedInput, standardStudents }
  ```

## Known exceptions (recognize, don't copy)

- **`index.html`** predates this standard and differs: CSS classes are **`mwg-` prefixed**
  and **injected from JS** (`injectStyles()`) rather than a static `<style>`; DOM ids are
  `mwg*`; UI font is **Georgia**; problem objects are a hybrid `{ html, answer, kind, … }`;
  the grid is variable (`mwg-cols-N` / `mwg-rows-N`, plus a `mwg-horiz-grid` for inline
  problems); advanced input is **5 fields** — `Name, Number, Type, Count, Grade;` with
  optional brackets (`mixed[…]`, `fractions[…]`, `decimals[…]`, `|`-separated; a name may hold commas — all
  but the last four fields, S3); PDF saves as
  `worksheets.pdf`; storage key `mwgRosterData_v2`. Its print/PDF/color values still match
  the standard above. Don't propagate the `mwg-`/Georgia/5-field patterns to new pages.
- **`mwg.js`** is standalone legacy code, **loaded by nothing**. It uses `{ html, answer }`
  problem objects and `esc`/`rand`/`randFrom` helpers and key `mwgRosterData_v1`. Treat it
  as historical reference only.

## Improvement loop (`/improveloop`)

`.claude/skills/improveloop/SKILL.md` runs one bounded session: the stalest discovery pass (A
performance, B print & export, C aesthetics, D accessibility, E errors, F consistency, G math
correctness, H teacher walkthrough, I saved data & safety, L metadata, M mobile), up to four small
verified fixes, optionally one micro-feature from the ledger's seeds. State lives in
`docs/IMPROVEMENT_LOG.md`; the loop never starts a new page. **After editing any page, run
`node scripts/loop/smoke.mjs`** (all three pages: load, generate, answer key, print geometry,
advanced input, saved roster, an XSS control) — it must stay green; `--cdn` adds the PDF arm.

## Adding a new generator page (checklist)

1. Start from `math-facts.html` (the cleanest standard implementation) and rename the root
   id (`#<page>-app`), title, `STORAGE_KEY`, and PDF filename.
2. Replace only the **selector system**: the per-student dropdown options, the
   description/`rowsClass` lookup, and the problem generators (returning the standard
   problem objects). Keep roster, advanced input, print, and PDF code intact.
3. Keep advanced-input parsing, the print CSS + move-trick, and the PDF pipeline byte-for-
   byte; only the selector validation and filename change.
4. Reuse the style constants and the branding snippet above.
5. Sanity-check: generate each option (correct count and 10-col grid), toggle the answer
   key, run Print (landscape 11×8.5), and Save PDF.
6. Add the page to `PAGES` in `scripts/loop/harness.mjs` and to `SURFACES` in
   `scripts/loop/ledger-rules.mjs` (plus a column in the ledger's Surface coverage table), so the smoke
   and the loop cover it.
7. Commit and **push to `main`**.
