// Probe (loop S31, pass C on index.html; approved S31 at gate 6): a division written across (Long Division, a Mixed
// sheet's division at Grades 5-8) was centred in its problem's room while every other problem written across starts at
// the left: on the sheet it sat ~40 px in, and on the key, whose problem has the answer's room, ~115 px further right
// than the student's. It now starts at the left. Math.random seeded; under print (the page's move to body):
//   arm 1, every Long Division and Mixed sheet and key at Grades 5-8 (30, 2 copies): each division's box at its problem's
//     left, its first glyph within the divisor's slot (0.22in) of it; on the key each division where the student's is
//     (moved as every other key problem is, by the sheet's number column the key has not); its bracket >= 20 px from
//     the answer line or the red answer;
//   arm 2, nothing else moves: the across types and a few stacked grids with arm 1's list, against REF (the page before
//     the change), the same seed: the sheets' markup byte-identical (a CSS change), every cell's box within 0.25 px,
//     every other problem's ink within 0.25 px, each division's ink at the same height (it moves sideways only);
//   arm 3, Save PDF (the two cdnjs libraries stubbed): every division in the PDF clones at its problem's left, as in print.
// Fails before the change (`--control`: REF served as the page under test).
//   node scripts/loop/probes/S31-across-division-left.mjs [--control] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT, replayLater } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref') || '73a7c3a', CONTROL = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = `(() => { let s = 20261109; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const H2C_STUB = `window.html2canvas = function (clone) {
  (window.__clones = window.__clones || []).push([].map.call(clone.querySelectorAll('.mwg-horiz-problem .mwg-division-problem'), function (d) {
    return d.getBoundingClientRect().left - d.closest('.mwg-horiz-problem').getBoundingClientRect().left; }));
  var cv = document.createElement('canvas'); cv.width = 4; cv.height = 4; return Promise.resolve(cv); };`;
const JSPDF_STUB = `window.jspdf = { jsPDF: function () { return { addPage: function () {}, addImage: function () {}, save: function (n) { window.__pdfSaved = n; } }; } };`;
// S35's sheet changes replayed on REF first (harness `replayLater`, S23's rule)
const refBody = replayLater(execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }));

const srv = await serve(); const browser = await launch();
async function open(served) {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (served) await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: served }));
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  await p.page.route(/cdnjs\.cloudflare\.com\/.*html2canvas/, r => r.fulfill({ contentType: 'text/javascript', body: H2C_STUB }));
  await p.page.route(/cdnjs\.cloudflare\.com\/.*jspdf/, r => r.fulfill({ contentType: 'text/javascript', body: JSPDF_STUB }));
  return p;
}
async function generate(p, lines, copies, pdf) {
  const pg = p.page;
  await pg.click('#mwgToggleModeBtn'); await pg.selectOption('#mwgWorksheetsPerStudent', String(copies));
  await pg.setChecked('#mwgAnswerKeyToggle', true); await pg.fill('#mwgAdvancedBox', lines.join('\n'));
  if (pdf) { await pg.click('#mwgSavePdfBtn'); await pg.waitForFunction(() => window.__pdfSaved, null, { timeout: 120000 }); }
  else { await pg.click('#mwgGenerateBtn'); await pg.waitForFunction(() => window.__prints > 0, null, { timeout: 120000 }); }
  await pg.emulateMedia({ media: 'print' });
  await pg.evaluate(() => { const r = document.querySelector('#mwgResults'); r.id = 'mwg-results-print'; document.body.appendChild(r); });
}
const MEASURE = () => {
  const ctx = document.createElement('canvas').getContext('2d');
  const ink = el => {                      // glyphs' own box (canvas measureText) and every drawn border, sheet-relative later
    let t = Infinity, b = -Infinity, l = Infinity, r = -Infinity;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent.trim()) continue;
      const cs = getComputedStyle(n.parentElement); ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText(n.textContent.trim()), g = document.createRange(); g.selectNodeContents(n);
      for (const rc of g.getClientRects()) { if (!rc.width) continue;
        const base = rc.top + (rc.height - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
        t = Math.min(t, base - m.actualBoundingBoxAscent); b = Math.max(b, base + m.actualBoundingBoxDescent); l = Math.min(l, rc.left); r = Math.max(r, rc.right); }
    }
    for (const e of [el, ...el.querySelectorAll('*')]) {
      const cs = getComputedStyle(e), q = e.getBoundingClientRect(); if (!q.width && !q.height) continue;
      if (parseFloat(cs.borderTopWidth)) { t = Math.min(t, q.top); b = Math.max(b, q.top + parseFloat(cs.borderTopWidth)); l = Math.min(l, q.left); r = Math.max(r, q.right); }
      if (parseFloat(cs.borderLeftWidth)) { t = Math.min(t, q.top); b = Math.max(b, q.bottom); l = Math.min(l, q.left); }
    }
    return { t, b, l, r };
  };
  const glyphL = el => { let m = Infinity; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (!n.textContent.trim()) continue; const g = document.createRange(); g.selectNodeContents(n);
      for (const x of g.getClientRects()) if (x.width > 0.5) m = Math.min(m, x.left); } return m; };
  const sheets = [...document.querySelectorAll('#mwg-results-print .mwg-worksheet, #mwg-results-print .mwg-answer-key-sheet')];
  return sheets.map(s => {
    const sr = s.getBoundingClientRect(), key = s.classList.contains('mwg-answer-key-sheet');
    const grid = s.querySelector('.mwg-horiz-grid, .mwg-problems-grid'), across = grid.classList.contains('mwg-horiz-grid');
    const cells = [...grid.children].map(c => {
      const q = c.getBoundingClientRect(), k = ink(c), prob = c.querySelector('.mwg-horiz-problem'), d = prob && prob.querySelector('.mwg-division-problem');
      const out = { box: [q.left - sr.left, q.top - sr.top, q.width, q.height], ink: [k.l - sr.left, k.t - sr.top, k.r - sr.left, k.b - sr.top], div: !!d };
      if (prob) {
        const pl = prob.getBoundingClientRect().left;
        out.glyph = glyphL(prob) - sr.left;
        if (d) {
          out.boxIn = d.getBoundingClientRect().left - pl; out.glyphIn = glyphL(prob) - pl;
          const br = d.querySelector('.mwg-division-bracket').getBoundingClientRect().right;
          const next = key ? [...c.querySelectorAll('[style*="180,0,0"]')].filter(e => !prob.contains(e)).map(e => e.getBoundingClientRect().left)
            : [c.querySelector('.mwg-horiz-answer').getBoundingClientRect().left];
          out.room = Math.min(...next) - br;
        }
      }
      return out;
    });
    return { desc: s.querySelector('.mwg-ws-desc-text').textContent, key, across, cells };
  });
};

const ARM1 = [5, 6, 7, 8].flatMap(g => [`Avi ${g}, ${g}, longdivision, 30, ${g};`, `Noa ${g}, ${g + 10}, mixed, 30, ${g};`]);
// Arm 1
{
  const p = await open(CONTROL ? refBody : null); await generate(p, ARM1, 2, false);
  const m = await p.page.evaluate(MEASURE), n = m.length / 2;
  const divs = m.flatMap(s => s.cells.filter(c => c.div));
  console.log(`index.html${CONTROL ? ` (control: ${REF} served)` : ''}: arm 1, ${m.length} sheets, ${divs.length} divisions written across`);
  check(m.length === 32 && divs.length >= 200 && m.every(s => s.across), `every sheet and key across, with divisions (${m.length} sheets, ${divs.length} divisions)`);
  const boxIn = Math.max(...divs.map(c => Math.abs(c.boxIn)));
  check(boxIn <= 0.25, `each division's box at its problem's left (worst ${boxIn.toFixed(2)} px in)`);
  const glyphIn = Math.max(...divs.map(c => c.glyphIn));
  check(glyphIn <= 21.2, `each division's first glyph within the divisor's 0.22in slot (worst ${glyphIn.toFixed(1)} px in)`);
  // the key's problem where the student's is: every key cell moved as the sheet's other problems are
  let worst = 0, offs = new Set();
  for (let i = 0; i < n; i++) {
    const a = m[i].cells, k = m[n + i].cells;
    const other = a.map((c, j) => c.div ? null : k[j].glyph - c.glyph).filter(x => x !== null);
    const off = other.length ? other.reduce((x, y) => x + y) / other.length : -26; offs.add(off.toFixed(1));
    a.forEach((c, j) => { if (c.div) worst = Math.max(worst, Math.abs(k[j].glyph - c.glyph - off)); });
  }
  check(worst <= 0.25, `on the key each division where the student's is, as every other problem (key − sheet ${[...offs].join('/')} px; worst division ${worst.toFixed(2)} px off it)`);
  const room = Math.min(...divs.map(c => c.room));
  check(room >= 20, `every bracket >= 20 px from the answer line or the red answer (least ${room.toFixed(1)} px)`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
  await p.close();
}
// Arm 2: nothing else moves
{
  const LIST = ARM1.concat(['fractions, 30, 5', 'decimals, 30, 6', 'rounding, 30, 3', 'rounding, 30, 7', 'orderofoperations, 30, 6', 'integers, 30, 7',
    'exponents, 30, 8', 'scientificnotation, 30, 8', 'mixed, 60, 2', 'mixed, 30, 4', 'div3, 30, 4', 'add3, 60, 4', 'mul4, 40, 5', 'div5, 60, 5']
    .map((t, i) => `S${i}, ${i + 20}, ${t};`));
  const now = await open(CONTROL ? refBody : null), was = await open(refBody);
  await generate(now, LIST, 1, false); await generate(was, LIST, 1, false);
  const htmlSame = await Promise.all([now, was].map(p => p.page.$eval('#mwg-results-print', r => r.innerHTML))).then(([a, b]) => a === b);
  const a = await now.page.evaluate(MEASURE), b = await was.page.evaluate(MEASURE);
  let boxW = 0, inkW = 0, divH = 0, divX = 0, nd = 0, no = 0;
  a.forEach((s, i) => s.cells.forEach((c, j) => {
    const o = b[i].cells[j];
    c.box.forEach((v, k) => { boxW = Math.max(boxW, Math.abs(v - o.box[k])); });
    if (c.div) { nd++; divH = Math.max(divH, Math.abs(c.ink[1] - o.ink[1]), Math.abs(c.ink[3] - o.ink[3])); divX = Math.max(divX, Math.abs(c.ink[0] - o.ink[0])); }
    else { no++; c.ink.forEach((v, k) => { inkW = Math.max(inkW, Math.abs(v - o.ink[k])); }); }
  }));
  console.log(` arm 2: ${a.length} sheets (${LIST.length} entries, keys), ${no} other problems and ${nd} divisions against ${REF}`);
  check(a.length === b.length && a.length === LIST.length * 2, `the same sheets on both (${a.length} / ${b.length})`);
  check(htmlSame, 'the sheets\' markup byte-identical (a CSS change)');
  check(boxW <= 0.25, `every problem cell's box where it was, within 0.25 px (worst ${boxW.toFixed(2)} px)`);
  check(inkW <= 0.25, `every other problem's ink where it was, within 0.25 px (worst ${inkW.toFixed(2)} px)`);
  check(divH <= 0.25, `each division's ink at its height, moved sideways only (worst ${divH.toFixed(2)} px up or down; up to ${divX.toFixed(1)} px sideways)`);
  check(now.errors.length === 0 && was.errors.length === 0, '0 page errors');
  await now.close(); await was.close();
}
// Arm 3: Save PDF's clones
{
  const p = await open(CONTROL ? refBody : null); await generate(p, ARM1.slice(0, 4), 1, true);
  const clones = await p.page.evaluate(() => window.__clones || []), all = clones.flat();
  const worst = all.length ? Math.max(...all.map(Math.abs)) : Infinity;
  check(clones.length === 8 && all.length >= 60, ` arm 3: ${clones.length} PDF clones for 8 sheets, ${all.length} divisions`);
  check(worst <= 0.25, `every division in the PDF at its problem's left, as in print (worst ${worst.toFixed(2)} px in)`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS31-across-division-left: ${fails.length} failing` : '\nS31-across-division-left: all green');
process.exit(fails.length ? 1 : 0);
