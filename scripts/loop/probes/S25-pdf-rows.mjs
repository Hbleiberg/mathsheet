// Probe (loop S25; found S4, re-measured S25 in pass B on index.html): Save PDF lays index.html's stacked grids out at
// print's rows. The PDF clone kept the screen's `minmax(…, 1fr)` rows while print fixes rows-6…12 and lets rows-3/4/5
// fall to their minimum, so every stacked problem sat lower in the PDF than on paper: 4,043 of 5,880 cells more than
// 3 px off in a real export, up to 13 px. Offline (the two cdnjs libraries stubbed: the html2canvas stub measures every
// clone it is handed), every stacked grid class, sheets and keys: each clone's problem cells sit where print puts them
// (within 0.5 px, top and bottom, against the sheet's top), and the written-across sheets are left as they were.
// Fails before the change (`--ref 2f9a38f`).
//   node scripts/loop/probes/S25-pdf-rows.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = `(() => { let s = 20261108; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
// every row class: division (cols-10 rows-3…6), narrow (cols-5 rows-6/8/10, cols-6 rows-10), wide (cols-5 rows-6/10/12,
// cols-4 rows-10), Mixed; and two written-across types
const ROSTER = [...[['div1', 3], ['add1', 3], ['add4', 5]].flatMap(([t, g]) => [30, 40, 50, 60].map(c => `${t} ${c}, 1, ${t}, ${c}, ${g};`)),
  'mixed 60, 2, mixed, 60, 3;', 'mixed 40, 3, mixed, 40, 2;', 'fractions, 4, fractions, 30, 5;', 'longdivision, 5, longdivision, 30, 5;'].join('\n');
const CELLS = '.mwg-problems-grid > *, .mwg-horiz-grid > *';
const H2C_STUB = `window.html2canvas = function (clone) {
  var cr = clone.getBoundingClientRect();
  var cells = [].map.call(clone.querySelectorAll(${JSON.stringify(CELLS)}), function (c) {
    var r = c.getBoundingClientRect(); return { t: r.top - cr.top, b: r.bottom - cr.top }; });
  var g = clone.querySelector('.mwg-problems-grid, .mwg-horiz-grid');
  (window.__clones = window.__clones || []).push({ cells: cells, cls: g.className, rows: g.style.gridTemplateRows });
  var cv = document.createElement('canvas'); cv.width = 4; cv.height = 4; return Promise.resolve(cv);
};`;
const JSPDF_STUB = `window.jspdf = { jsPDF: function () { return { addPage: function () {}, addImage: function () {},
  save: function (n) { window.__pdfSaved = n; } }; } };`;

const srv = await serve(); const browser = await launch();
try {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (REF) {
    const body = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  await p.page.route(/cdnjs\.cloudflare\.com\/.*html2canvas/, r => r.fulfill({ contentType: 'text/javascript', body: H2C_STUB }));
  await p.page.route(/cdnjs\.cloudflare\.com\/.*jspdf/, r => r.fulfill({ contentType: 'text/javascript', body: JSPDF_STUB }));
  await p.page.click('#mwgToggleModeBtn');
  await p.page.fill('#mwgAdvancedBox', ROSTER);
  await p.page.setChecked('#mwgAnswerKeyToggle', true);
  await p.page.click('#mwgSavePdfBtn');
  await p.page.waitForFunction(() => window.__pdfSaved, null, { timeout: 60000 });
  const clones = await p.page.evaluate(() => window.__clones);
  await p.page.emulateMedia({ media: 'print' });
  const printed = await p.page.evaluate(cells => {
    const r = document.querySelector('#mwgResults'); r.id = 'mwg-results-print'; document.body.appendChild(r);
    return [...document.querySelectorAll('.mwg-worksheet, .mwg-answer-key-sheet')].map(s => {
      const sr = s.getBoundingClientRect(), g = s.querySelector('.mwg-problems-grid, .mwg-horiz-grid');
      return { desc: s.querySelector('.mwg-ws-desc-text').textContent, cls: g.className,
        cells: [...s.querySelectorAll(cells)].map(c => { const q = c.getBoundingClientRect(); return { t: q.top - sr.top, b: q.bottom - sr.top }; }) };
    });
  }, CELLS);
  check(clones.length === 32 && clones.length === printed.length, `${clones.length} PDF clones for ${printed.length} sheets (16 students + keys)`);
  const classes = new Set(), off = [];
  let stacked = 0, across = 0, worst = 0;
  clones.forEach((c, i) => {
    const pr = printed[i]; if (!pr || pr.cells.length !== c.cells.length) { off.push(`sheet ${i + 1} cell count`); return; }
    const horiz = /mwg-horiz-grid/.test(pr.cls);
    if (horiz) across++; else { stacked++; classes.add(pr.cls.replace('mwg-problems-grid ', '')); }
    let w = 0; c.cells.forEach((cell, j) => { w = Math.max(w, Math.abs(cell.t - pr.cells[j].t), Math.abs(cell.b - pr.cells[j].b)); });
    if (!horiz) worst = Math.max(worst, w);
    if (w > 0.5) off.push(`${pr.desc} [${pr.cls.replace('mwg-problems-grid ', '')}] ${w.toFixed(1)} px`);
  });
  console.log(`       ${stacked} stacked sheets over ${classes.size} grid classes (${[...classes].sort().join(', ')}), ${across} written across`);
  check(classes.size === 10 && across === 4, 'the roster reaches every stacked grid class and the written-across grid');
  check(off.length === 0, `every PDF problem cell where print puts it, within 0.5 px (worst stacked ${worst.toFixed(1)} px; ${off.length} sheets off${off.length ? ': ' + off.slice(0, 4).join(' / ') : ''})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
  await p.close();
} catch (e) { check(false, e.message.split('\n')[0]); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS25-pdf-rows: ${fails.length} failing` : '\nS25-pdf-rows: all green');
process.exit(fails.length ? 1 : 0);
