// Probe (loop S6, micro-feature on math-minute.html): the optional "Header line" — free text printed under
// the header row of every sheet and answer key (a week, a unit, a parasha).
//   - left blank (the default) the sheets and keys are byte-identical to the pre-feature page's (seeded);
//   - a line with Hebrew, markup and quotes prints literally, once per sheet and key, dir="auto";
//   - under emulated print with the move trick every sheet stays 1056×816, the line is one row, and the
//     lowest problem of every row count (rows-3…rows-6) still ends on the paper; an 80-character line fits;
//   - Save PDF's clones (cdnjs stubbed) carry the line and put every cell where print does;
//   - the line is saved with the roster and restored; a payload saved before the feature loads blank.
// Fails on the pre-feature page (`--control` serves math-minute.html from `git show dd8609a:math-minute.html`).
//   node scripts/loop/probes/S6-header-line.mjs [--control]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const control = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const FILE = 'math-minute.html';
const BEFORE = execSync(`git show dd8609a:${FILE}`, { cwd: ROOT, encoding: 'utf8' });
const SEED = `(() => { let s = 20261105; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const ROSTER = 'A, 1, 1;\nB, 2, 5;\nC, 3, 7;\nD, 4, 9;';                 // rows-3 .. rows-6
const LINE = 'Unit 3 review · פרשת נח <b>x</b> & "q"';
const LONG = 'WEEK OF 12 NOVEMBER — UNIT 3 REVIEW: ADDITION AND SUBTRACTION FACTS TO 20, TIMED'.padEnd(80, 'W');   // 80 wide characters
const H2C_STUB = `window.html2canvas = function (clone) {
  var cr = clone.getBoundingClientRect(), line = clone.querySelector('.worksheet-header-line');
  (window.__clones = window.__clones || []).push({ line: line ? line.textContent : null,
    cells: [].map.call(clone.querySelectorAll('.problems-grid > .problem-cell'), function (c) { return c.getBoundingClientRect().top - cr.top; }) });
  var cv = document.createElement('canvas'); cv.width = 4; cv.height = 4; return Promise.resolve(cv);
};`;
const JSPDF_STUB = `window.jspdf = { jsPDF: function () { return { addPage: function () {}, addImage: function () {},
  save: function (n) { window.__pdfSaved = n; } }; } };`;

async function open(browser, base, body, storage) {
  const p = await openPage(browser, base, FILE, { raw: true, storage });
  await p.context.addInitScript(SEED);
  if (body) await p.page.route(/\/math-minute\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.route(/cdnjs\.cloudflare\.com\/.*html2canvas/, r => r.fulfill({ contentType: 'text/javascript', body: H2C_STUB }));
  await p.page.route(/cdnjs\.cloudflare\.com\/.*jspdf/, r => r.fulfill({ contentType: 'text/javascript', body: JSPDF_STUB }));
  await p.page.reload({ waitUntil: 'load' });
  await p.page.waitForSelector('#studentsContainer .student-entry');
  return p;
}
async function generate(p, line) {
  await p.page.click('#toggleInputModeButton');
  await p.page.fill('#advancedInputBox', ROSTER);
  await p.page.setChecked('#answerKeyToggle', true);
  if (line !== null) await p.page.fill('#headerLineInput', line);
  const n = await p.prints();
  await p.page.click('#generatePrintButton');
  await p.page.waitForFunction(n => window.__prints > n, n, { timeout: 15000 });
}
// Under emulated print with the page's move trick: each sheet's box, its header line and its lowest stack.
const measure = async p => { await p.page.emulateMedia({ media: 'print' }); const out = await p.page.evaluate(() => {
  const r = document.querySelector('#results'); const parent = r.parentNode, next = r.nextSibling;
  r.id = 'results-print'; document.body.appendChild(r);
  const out = [...document.querySelectorAll('#results-print .worksheet')].map(s => {
    const sr = s.getBoundingClientRect(), line = s.querySelector('.worksheet-header-line');
    const grid = s.querySelector('.problems-grid');
    const low = Math.max(...[...s.querySelectorAll('.problem-stack, .division-problem')].map(e => e.getBoundingClientRect().bottom - sr.top));
    return { w: Math.round(sr.width), h: Math.round(sr.height), rows: grid.className.match(/rows-\d/)[0], low,
      gridTop: grid.getBoundingClientRect().top - sr.top, cells: [...grid.children].map(c => c.getBoundingClientRect().top - sr.top),
      lineH: line ? line.getBoundingClientRect().height : 0, lineFits: line ? line.scrollWidth <= line.clientWidth : true };
  });
  r.id = 'results'; parent.insertBefore(r, next);
  return out;
}); await p.page.emulateMedia({ media: 'screen' }); return out; };

const srv = await serve(); const browser = await launch();
try {
  console.log(FILE);
  // 1. Blank: byte-identical to the pre-feature page.
  const ref = await open(browser, srv.base, BEFORE);
  await generate(ref, null);
  const refHtml = await ref.page.$eval('#results', r => r.innerHTML);
  await ref.close();
  const blank = await open(browser, srv.base, control ? BEFORE : null);
  const hasInput = await blank.page.$('#headerLineInput') !== null;
  check(hasInput, 'the settings row has a Header line field (#headerLineInput)');
  await generate(blank, hasInput ? '' : null);
  check(await blank.page.$eval('#results', r => r.innerHTML) === refHtml, 'left blank, every sheet and key is byte-identical to the pre-feature page\'s');
  await blank.close();
  if (!hasInput) throw new Error('no #headerLineInput: the remaining arms need the field');

  // 2. A line with Hebrew, markup and quotes.
  const p = await open(browser, srv.base, control ? BEFORE : null);
  await generate(p, LINE);
  const lines = await p.page.$$eval('#results .worksheet', ss => ss.map(s => { const l = s.querySelectorAll('.worksheet-header-line');
    return { n: l.length, text: l[0] ? l[0].textContent : null, dir: l[0] ? l[0].getAttribute('dir') : null, tags: l[0] ? l[0].children.length : -1 }; }));
  check(lines.length === 8, `${lines.length} sheets and keys (4 + 4)`);
  check(lines.every(l => l.n === 1 && l.text === LINE.trim()), `every sheet and key prints the line once, literally (${lines.filter(l => l.n === 1 && l.text === LINE.trim()).length} of ${lines.length})`);
  check(lines.every(l => l.tags === 0 && l.dir === 'auto'), 'the line is escaped (no element inside) and dir="auto"');

  // 3. Print geometry.
  const m = await measure(p);
  check(m.every(s => s.w === 1056 && s.h === 816), `print: every sheet 1056×816 (${m.filter(s => s.w !== 1056 || s.h !== 816).length} off)`);
  check(m.every(s => s.lineH > 0 && s.lineH <= 18), `the line is one row (${[...new Set(m.map(s => s.lineH.toFixed(1)))].join(', ')} px)`);
  const byRows = {}; m.forEach(s => { byRows[s.rows] = Math.min(byRows[s.rows] ?? 1e9, 816 - s.low); });
  check(Object.keys(byRows).length === 4 && Object.values(byRows).every(v => v >= 8), `the lowest problem ends on the paper for every row count (paper left below: ${Object.entries(byRows).map(([k, v]) => `${k} ${v.toFixed(0)} px`).join(', ')})`);

  // 4. Save PDF: every clone carries the line, every cell where print puts it.
  await p.page.click('#savePdfButton');
  await p.page.waitForFunction(() => window.__pdfSaved, null, { timeout: 30000 });
  const clones = await p.page.evaluate(() => window.__clones);
  let worst = 0; clones.forEach((c, i) => c.cells.forEach((t, j) => { worst = Math.max(worst, Math.abs(t - m[i].cells[j])); }));
  check(clones.length === m.length && clones.every(c => c.line === LINE.trim()), `Save PDF: ${clones.length} clones, each with the line`);
  check(worst <= 1.5, `Save PDF: every cell where print puts it (worst ${worst.toFixed(1)} px off)`);

  // 5. An 80-character line stays on one row.
  await p.page.fill('#headerLineInput', LONG);
  await p.page.click('#generatePrintButton');
  await p.page.waitForFunction(() => window.__prints > 1, null, { timeout: 15000 });
  const ml = await measure(p);
  check(LONG.length === 80 && ml.every(s => s.lineFits && s.lineH <= 18 && s.w === 1056 && s.h === 816), `an 80-character line fits one row on every sheet (${ml.filter(s => !s.lineFits).length} overflow)`);
  check(await p.page.$eval('#headerLineInput', i => i.maxLength) === 80, 'the field takes at most 80 characters');

  // 6. Saved with the roster, restored on reload; a pre-feature payload loads blank.
  await p.page.fill('#headerLineInput', LINE);
  await p.page.click('#saveRosterButton');
  const saved = JSON.parse(await p.page.evaluate(() => localStorage.getItem('mathMinuteRosterData_v2')));
  check(saved.headerLine === LINE, `Save Roster stores headerLine (${JSON.stringify(saved.headerLine)})`);
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector('#studentsContainer .student-entry', { state: 'attached' });
  check(await p.page.$eval('#headerLineInput', i => i.value) === LINE, 'reload restores the line');
  check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
  await p.close();
  const oldPayload = JSON.stringify({ inputMode: 'standard', worksheetsPerStudent: '1', answerKey: false, removeNumber: false, nameBlank: false,
    advancedInput: '', standardStudents: [{ name: 'Avi', number: '1', level: '3' }] });
  const o = await open(browser, srv.base, control ? BEFORE : null, { mathMinuteRosterData_v2: oldPayload });
  check(await o.page.$eval('#headerLineInput', i => i.value) === '' && await o.page.$eval('input[name="studentName"]', i => i.value) === 'Avi',
    'a roster saved before the feature loads, its line blank');
  check(o.errors.length === 0, `0 page errors on the old payload (${o.errors.join(' | ')})`);
  await o.close();
} catch (e) { check(false, e.message.split('\n')[0]); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS6-header-line: ${fails.length} failing` : '\nS6-header-line: all green');
process.exit(fails.length ? 1 : 0);
