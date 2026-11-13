// Probe (loop S45, pass C on math-facts.html; approved at gate 3): Advanced mode's Level Reference lays its fact codes in
// as many columns as fit. In two columns the card ran ~1,200 px tall at 1280 px and the Generate buttons sat ~1,420 px
// down, below a column of short codes. At 1280 / 800 / 390 px, in Advanced mode:
//   - the codes take at least 4 / 6 / 3 columns, and the card is at most 800 / 600 / 1,000 px tall;
//   - every code whole in its cell (nothing cut), no sideways scroll;
//   - each group heading and the legend span the whole card (a row of their own);
//   - the codes read in the order they show (left to right, then down: the DOM order a screen reader follows), every
//     group's codes under its own heading.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S45-level-reference.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const REF = (i => i > 0 ? process.argv[i + 1] : null)(process.argv.indexOf('--ref'));
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const WANT = { 1280: { cols: 4, card: 800 }, 800: { cols: 6, card: 600 }, 390: { cols: 3, card: 1000 } };
const srv = await serve(); const browser = await launch();
try {
  for (const width of [1280, 800, 390]) {
    const p = await openPage(browser, srv.base, 'math-facts.html', { raw: true, viewport: { width, height: 900 } });
    if (REF) {
      const body = execSync(`git show ${REF}:math-facts.html`, { cwd: ROOT, encoding: 'utf8' });
      await p.page.route(/\/math-facts\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await p.page.reload({ waitUntil: 'load' });
    }
    await p.page.waitForSelector('#studentsContainer .student-entry', { state: 'attached' });
    await p.page.click('#toggleInputModeButton');
    const m = await p.page.evaluate(() => {
      const grid = document.getElementById('levelReferenceGrid'), gr = grid.getBoundingClientRect();
      const card = grid.closest('.level-reference-card').getBoundingClientRect();
      const items = [...grid.children], codes = items.filter(e => e.children.length === 1 && e.firstChild.tagName === 'CODE');
      const wide = items.filter(e => !codes.includes(e));
      const boxes = codes.map(e => e.getBoundingClientRect());
      const cols = new Set(boxes.map(b => Math.round(b.left))).size;
      const cut = codes.filter(e => e.scrollWidth > e.clientWidth + 1 || e.firstChild.getBoundingClientRect().right > e.getBoundingClientRect().right + 1).map(e => e.textContent);
      const span = wide.filter(e => { const b = e.getBoundingClientRect(); return b.left > gr.left + 1 || b.right < gr.right - 1; }).map(e => e.textContent.slice(0, 20));
      // reading order: each item after the previous one, left to right on its row, then down
      let order = 0;
      for (let i = 1; i < items.length; i++) {
        const a = items[i - 1].getBoundingClientRect(), b = items[i].getBoundingClientRect();
        if (!(b.top > a.top + 1 || (Math.abs(b.top - a.top) <= 1 && b.left > a.left))) order++;
      }
      return { n: codes.length, headings: wide.length, cols, card: Math.round(card.height), cut, span, order,
        sw: document.documentElement.scrollWidth, gen: Math.round(document.getElementById('generatePrintButton').getBoundingClientRect().top + scrollY) };
    });
    console.log(`math-facts.html${REF ? ` (${REF})` : ''} at ${width} px: ${m.n} codes, ${m.headings} headings and legend, ${m.cols} columns, the card ${m.card} px, Generate at ${m.gen} px`);
    check(m.n >= 69 && m.headings === 6, `the reference holds its codes and six full rows (${m.n} codes, ${m.headings})`);
    check(m.cols >= WANT[width].cols, `the codes take at least ${WANT[width].cols} columns (${m.cols})`);
    check(m.card <= WANT[width].card, `the card at most ${WANT[width].card} px tall (${m.card})`);
    check(m.cut.length === 0 && m.sw <= width, `every code whole in its cell, no sideways scroll (${m.cut.join(', ') || 'none cut'}; ${m.sw} px)`);
    check(m.span.length === 0, `each heading and the legend span the card (${m.span.join(', ') || 'all'})`);
    check(m.order === 0, `the codes read in the order they show (${m.order} out of place)`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS45-level-reference: ${fails.length} failing check(s)` : '\nS45-level-reference: all green');
process.exit(fails.length ? 1 : 0);
