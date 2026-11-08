// Probe (loop S25, pass B on index.html; approved S25 at gate 6): a division written across (Long Division, a Mixed
// sheet's division at Grades 5-8). Its rows were 54 px in a 43 px track: they overlapped, the 15th ended 0.12in from the
// paper's edge (ink at 804.5 px of 816), and the key drew its own bars down an unnumbered column, each bracket running
// into the next (-0.4 px). Math.random seeded; under print (the page's move to body):
//   arm 1, every Long Division and Mixed sheet and key at Grades 5-8 (30, 5 copies): every across cell inside its row's
//     track, every problem's ink (glyphs and drawn lines) above the paper's inner bottom and >= 2 px from the problem
//     below it, each divisor level with its dividend; every key cell the sheet's own problem (its markup, byte for
//     byte) with the quotient in red, recomputed from the divisor and dividend;
//   arm 2, nothing else moves: every grade x type the form offers (1 copy, keys) against BASE, the same seed: every
//     sheet without an across division byte-identical, every cell's box within 0.25 px;
//   arm 3, Save PDF (the two cdnjs libraries stubbed): every across division clone's cells where print puts them.
// Fails before the change (`--ref abdbd88`).
//   node scripts/loop/probes/S25-across-division.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), BASE = 'abdbd88';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = `(() => { let s = 20261108; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const H2C_STUB = `window.html2canvas = function (clone) { var cr = clone.getBoundingClientRect();
  (window.__clones = window.__clones || []).push([].map.call(clone.querySelectorAll('.mwg-problems-grid > *, .mwg-horiz-grid > *'), function (c) {
    var r = c.getBoundingClientRect(); return [r.top - cr.top, r.bottom - cr.top]; }));
  var cv = document.createElement('canvas'); cv.width = 4; cv.height = 4; return Promise.resolve(cv); };`;
const JSPDF_STUB = `window.jspdf = { jsPDF: function () { return { addPage: function () {}, addImage: function () {}, save: function (n) { window.__pdfSaved = n; } }; } };`;

const srv = await serve(); const browser = await launch();
async function open(ref) {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (ref) {
    const body = execSync(`git show ${ref}:index.html`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
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
  const ink = el => {                      // glyphs' own box (canvas measureText) and every drawn border
    let t = Infinity, b = -Infinity;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent.trim()) continue;
      const cs = getComputedStyle(n.parentElement); ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText(n.textContent.trim()), g = document.createRange(); g.selectNodeContents(n);
      for (const rc of g.getClientRects()) { if (!rc.width) continue;
        const base = rc.top + (rc.height - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
        t = Math.min(t, base - m.actualBoundingBoxAscent); b = Math.max(b, base + m.actualBoundingBoxDescent); }
    }
    for (const e of [el, ...el.querySelectorAll('*')]) {
      const cs = getComputedStyle(e), q = e.getBoundingClientRect(); if (!q.width && !q.height) continue;
      if (parseFloat(cs.borderTopWidth)) { t = Math.min(t, q.top); b = Math.max(b, q.top + parseFloat(cs.borderTopWidth)); }
      if (parseFloat(cs.borderBottomWidth)) { t = Math.min(t, q.bottom - parseFloat(cs.borderBottomWidth)); b = Math.max(b, q.bottom); }
      if (parseFloat(cs.borderLeftWidth)) { t = Math.min(t, q.top); b = Math.max(b, q.bottom); }
    }
    return { t, b };
  };
  const sheets = [...document.querySelectorAll('.mwg-worksheet, .mwg-answer-key-sheet')];
  const nSheets = sheets.filter(s => s.classList.contains('mwg-worksheet')).length;
  return sheets.map((s, i) => {
    const sr = s.getBoundingClientRect(), inner = sr.bottom - parseFloat(getComputedStyle(s).paddingBottom), key = s.classList.contains('mwg-answer-key-sheet');
    const grid = s.querySelector('.mwg-horiz-grid, .mwg-problems-grid'), cells = [...grid.children];
    const tracks = getComputedStyle(grid).gridTemplateRows.split(' ').map(parseFloat), gap = parseFloat(getComputedStyle(grid).rowGap) || 0;
    const across = grid.classList.contains('mwg-horiz-grid');
    const divs = across ? cells.filter(c => c.querySelector('.mwg-division-problem')) : [];
    const twin = key ? sheets[i - nSheets] : null;
    const out = { desc: s.querySelector('.mwg-ws-desc-text').textContent, key, across, divs: divs.length, cells: cells.length,
      overTrack: 0, below: Infinity, lowest: -Infinity, inner: inner - sr.top, level: 0, notOwn: 0, wrongAns: 0, notHoriz: 0,
      html: s.outerHTML, boxes: cells.map(c => { const q = c.getBoundingClientRect(); return [q.left - sr.left, q.top - sr.top, q.width, q.height]; }) };
    if (!divs.length) return out;
    const inks = cells.map(ink);
    const tops = []; let y = grid.getBoundingClientRect().top + parseFloat(getComputedStyle(grid).paddingTop);
    for (const h of tracks) { tops.push(y); y += h + gap; }
    cells.forEach((c, j) => {
      const q = c.getBoundingClientRect(), row = j >> 1;
      if (q.bottom > tops[row] + tracks[row] + 0.5) out.overTrack++;
      if (cells[j + 2]) out.below = Math.min(out.below, inks[j + 2].t - inks[j].b);
      out.lowest = Math.max(out.lowest, inks[j].b - sr.top);
    });
    for (const c of divs) {
      const dv = c.querySelector('.mwg-division-divisor'), dd = c.querySelector('.mwg-division-dividend');
      if (!dd) { out.notOwn++; out.notHoriz++; out.wrongAns++; continue; }   // the key's own bar (before S25)
      const rd = document.createRange(); rd.selectNodeContents(dv); const re = document.createRange(); re.setStart(dd.firstChild, 0); re.setEnd(dd.firstChild, dd.firstChild.length);
      out.level = Math.max(out.level, Math.abs(rd.getBoundingClientRect().bottom - re.getBoundingClientRect().bottom));
      if (key) {
        const j = cells.indexOf(c), mine = twin.querySelector('.mwg-horiz-grid').children[j];
        if (!c.classList.contains('mwg-horiz-cell')) out.notHoriz++;
        const prob = c.querySelector('.mwg-horiz-problem');
        if (!prob || prob.innerHTML !== mine.querySelector('.mwg-horiz-problem').innerHTML) out.notOwn++;
        const d = +dv.textContent, n = +dd.firstChild.textContent, q = Math.floor(n / d), r = n % d;
        const red = [...c.querySelectorAll('[style*="180,0,0"]')].map(e => e.textContent.replace(/ /g, ' ')).join('');
        if (red.trim() !== (r ? `${q} r${r}` : String(q))) out.wrongAns++;
      }
    }
    return out;
  });
};

// Arm 1
const ARM1 = [5, 6, 7, 8].flatMap(g => [`Avi ${g}, ${g}, longdivision, 30, ${g};`, `Noa ${g}, ${g + 10}, mixed, 30, ${g};`]);
{
  const p = await open(REF); await generate(p, ARM1, 5, false);
  const m = await p.page.evaluate(MEASURE), d = m.filter(s => s.divs);
  const keys = d.filter(s => s.key), divCells = d.reduce((a, s) => a + s.divs, 0);
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}: arm 1, ${m.length} sheets, ${d.length} with a division written across (${divCells} problems; ${keys.length} keys)`);
  check(m.length === 80 && d.length >= 40 && keys.length >= 20, 'every Long Division sheet and key holds divisions written across, and Mixed sheets do too');
  const over = d.filter(s => s.overTrack);
  check(over.length === 0, `every across cell inside its row (${over.length} sheets overflow, ${over.reduce((a, s) => a + s.overTrack, 0)} cells)`);
  const low = Math.max(...d.map(s => s.lowest - s.inner));
  check(low <= 0, `every problem's ink above the paper's inner bottom (lowest ${(Math.max(...d.map(s => s.lowest))).toFixed(1)} px of ${d[0].inner} px; 816 is the edge)`);
  const below = Math.min(...d.map(s => s.below));
  check(below >= 2, `>= 2 px of paper between a problem and the one below it (least ${below.toFixed(1)} px)`);
  const level = Math.max(...d.map(s => s.level));
  check(level <= 0.5, `each divisor level with its dividend (worst ${level.toFixed(1)} px)`);
  const nh = keys.reduce((a, s) => a + s.notHoriz, 0), no = keys.reduce((a, s) => a + s.notOwn, 0), wa = keys.reduce((a, s) => a + s.wrongAns, 0);
  check(nh === 0 && no === 0, `every across division key cell is the sheet's own problem, byte for byte (${nh} drawn apart, ${no} differ)`);
  check(wa === 0, `every quotient in red and right, recomputed from its divisor and dividend (${wa} wrong or missing)`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
  await p.close();
}
// Arm 2: nothing else moves
const probe = await open(null);
const pairs = await probe.page.evaluate(async () => {
  const row = document.querySelector('#mwgStudentsContainer .mwg-student-entry'), tick = () => new Promise(r => setTimeout(r, 0));
  const g = row.querySelector('select[name="grade"]'), t = row.querySelector('select[name="problemType"]'), out = [];
  for (const go of [...g.options].filter(o => o.value)) { g.value = go.value; g.dispatchEvent(new Event('change', { bubbles: true })); await tick();
    for (const to of [...t.options].filter(o => o.value)) out.push(`S${out.length}, ${out.length}, ${to.value}, ${to.value === 'mixed' && +go.value < 5 ? 60 : 30}, ${go.value};`); }
  return out; });
await probe.close();
{
  const now = await open(REF), was = await open(BASE);
  await generate(now, pairs, 1, false); await generate(was, pairs, 1, false);
  const a = await now.page.evaluate(MEASURE), b = await was.page.evaluate(MEASURE);
  let html = 0, boxes = 0, other = 0, worst = 0;
  a.forEach((s, i) => {
    if (s.divs || b[i].divs) return; other++;
    if (s.html !== b[i].html) html++;
    s.boxes.forEach((q, j) => q.forEach((v, k) => { const dlt = Math.abs(v - b[i].boxes[j][k]); worst = Math.max(worst, dlt); if (dlt > 0.25) boxes++; }));
  });
  console.log(` arm 2: ${a.length} sheets (${pairs.length} grade × type pairs, keys), ${other} without an across division, against ${BASE}`);
  check(a.length === b.length && a.length === pairs.length * 2 && other > 250, `the same sheets on both (${a.length} / ${b.length})`);
  check(html === 0, `every sheet without an across division byte-identical (${html} differ)`);
  check(boxes === 0, `every problem cell's box where it was, within 0.25 px (worst ${worst.toFixed(2)} px)`);
  check(now.errors.length === 0 && was.errors.length === 0, '0 page errors');
  await now.close(); await was.close();
}
// Arm 3: Save PDF's clones of the across division sheets
{
  const p = await open(REF); await generate(p, ARM1.slice(0, 4), 1, true);
  const clones = await p.page.evaluate(() => window.__clones);
  const printed = await p.page.evaluate(() => [...document.querySelectorAll('.mwg-worksheet, .mwg-answer-key-sheet')].map(s => {
    const sr = s.getBoundingClientRect(); return [...s.querySelectorAll('.mwg-problems-grid > *, .mwg-horiz-grid > *')].map(c => { const q = c.getBoundingClientRect(); return [q.top - sr.top, q.bottom - sr.top]; }); }));
  let worst = 0; clones.forEach((c, i) => c.forEach((cell, j) => { worst = Math.max(worst, Math.abs(cell[0] - printed[i][j][0]), Math.abs(cell[1] - printed[i][j][1])); }));
  check(clones.length === 8 && printed.length === 8, ` arm 3: ${clones.length} PDF clones for ${printed.length} sheets`);
  check(worst <= 0.5, `every across cell of the PDF where print puts it (worst ${worst.toFixed(2)} px)`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS25-across-division: ${fails.length} failing` : '\nS25-across-division: all green');
process.exit(fails.length ? 1 : 0);
