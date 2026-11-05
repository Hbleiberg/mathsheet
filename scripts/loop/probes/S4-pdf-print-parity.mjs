// Probe (loop S4): Save PDF mirrors print, offline. The two cdnjs libraries are replaced by stubs: the
// html2canvas stub measures every clone the page hands it (cell boxes, the body's clip), the jsPDF stub
// records the save. Then the same sheets are measured under emulated print with the page's move trick.
//   - math-minute / math-facts: every problem cell sits where print puts it (the clone's rows were 1fr,
//     4-19 px low; b8d2304).
//   - index.html: no written-across cell is clipped by the clone's body (Rounding / Long Division lost
//     their last row from the PDF; 2d59570), and a Grade 5 Mixed sheet writes its stacked problems
//     across instead of stacking them into that grid (7774975).
// Fails on the pre-fix pages (`--control` serves each page from `git show c9b5853:<page>`).
//   node scripts/loop/probes/S4-pdf-print-parity.mjs [--control]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const control = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const ROSTERS = {
  'math-minute.html': 'A, 1, 1;\nB, 2, 5;\nC, 3, 7;\nD, 4, 9;',                       // rows-3 .. rows-6
  'math-facts.html': 'A, 1, +3;\nB, 2, mix+40;\nC, 3, mix+50;\nD, 4, mix+60;',        // rows-3 .. rows-6
  'index.html': 'R, 1, rounding, 30, 5;\nL, 2, longdivision, 30, 6;\nM, 3, mixed, 30, 5;\nA, 4, add3, 60, 3;',
};
const CELLS = '.problems-grid > .problem-cell, .mwg-problems-grid > *, .mwg-horiz-grid > *';
const H2C_STUB = `window.html2canvas = function (clone) {
  var cr = clone.getBoundingClientRect();
  var body = clone.querySelector('.worksheet-body, .mwg-ws-body, .mwg-ak-body');
  var clip = getComputedStyle(body).overflow === 'visible' ? cr.bottom : Math.min(cr.bottom, body.getBoundingClientRect().bottom);
  var cells = [].map.call(clone.querySelectorAll(${JSON.stringify(CELLS)}), function (c) {
    var r = c.getBoundingClientRect(); return { t: r.top - cr.top, b: r.bottom - cr.top, horiz: !!c.closest('.mwg-horiz-grid') }; });
  (window.__clones = window.__clones || []).push({ clip: clip - cr.top, cells: cells });
  var cv = document.createElement('canvas'); cv.width = 4; cv.height = 4; return Promise.resolve(cv);
};`;
const JSPDF_STUB = `window.jspdf = { jsPDF: function () { return { addPage: function () {}, addImage: function () {},
  save: function (n) { window.__pdfSaved = n; } }; } };`;

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(ROSTERS)) {
    console.log(file);
    const p = await openPage(browser, srv.base, file);
    if (control) {
      const body = execSync(`git show c9b5853:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await p.page.reload({ waitUntil: 'load' });
      await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
    }
    await p.page.route(/cdnjs\.cloudflare\.com\/.*html2canvas/, r => r.fulfill({ contentType: 'text/javascript', body: H2C_STUB }));
    await p.page.route(/cdnjs\.cloudflare\.com\/.*jspdf/, r => r.fulfill({ contentType: 'text/javascript', body: JSPDF_STUB }));
    await p.page.click(p.spec.modeToggle);
    await p.page.fill(p.spec.advanced, ROSTERS[file]);
    await p.page.setChecked(p.spec.key, true);
    await p.page.click(p.spec.pdf);
    await p.page.waitForFunction(() => window.__pdfSaved, null, { timeout: 30000 });
    const clones = await p.page.evaluate(() => window.__clones);
    await p.page.emulateMedia({ media: 'print' });
    const printed = await p.page.evaluate(({ results, printId, sheets, cells }) => {
      const r = document.querySelector(results); r.id = printId; document.body.appendChild(r);
      return [...document.querySelectorAll(sheets)].map(s => {
        const sr = s.getBoundingClientRect();
        return { cells: [...s.querySelectorAll(cells)].map(c => { const q = c.getBoundingClientRect(); return { t: q.top - sr.top, b: q.bottom - sr.top }; }),
          stacksAcross: s.querySelectorAll('.mwg-horiz-grid .mwg-problem-stack').length };
      });
    }, { results: p.spec.results, printId: p.spec.printId, sheets: `${p.spec.sheet}, ${p.spec.keySheet}`, cells: CELLS });
    check(clones.length > 0 && clones.length === printed.length, `${clones.length} PDF clone(s) for ${printed.length} sheet(s)`);
    if (p.spec.fixedGrid) {
      let worst = 0;
      clones.forEach((c, i) => c.cells.forEach((cell, j) => { worst = Math.max(worst, Math.abs(cell.t - printed[i].cells[j].t)); }));
      check(worst <= 1.5, `every PDF problem cell sits where print puts it (worst ${worst.toFixed(1)} px off)`);
    } else {
      let cut = 0, horiz = 0;
      clones.forEach(c => c.cells.forEach(cell => { if (cell.horiz) { horiz++; if (cell.b > c.clip + 0.5) cut++; } }));
      check(horiz > 0 && cut === 0, `no written-across cell clipped in the PDF (${cut} of ${horiz} cut)`);
      const across = printed.reduce((a, s) => a + s.stacksAcross, 0);
      check(across === 0, `Mixed with fractions writes stacked problems across (${across} stacks in the across grid)`);
    }
    check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS4-pdf-print-parity: ${fails.length} failing` : '\nS4-pdf-print-parity: all green');
process.exit(fails.length ? 1 : 0);
