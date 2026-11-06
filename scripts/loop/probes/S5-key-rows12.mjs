// Probe (loop S5): index.html answer keys of 60 wide problems (rows-12: Level 3–5 add/sub/mul, Grade 3–4
// Mixed at 60) keep every red answer clear of the problem below it, and nothing else changes.
// Every grade 1–8 × every stacked type and Mixed at 60, keys on, Math.random seeded, under emulated print
// with the page's move trick. Ink is the glyphs' own box (canvas measureText on each text node) plus the
// ruled line:
//   - on every rows-12 key, the ink of a cell ends >= 2 px above the ink of the cell below it;
//   - every key and worksheet that is not a rows-12 key is byte-identical to the control's (the pre-S5 page
//     with later approved generator changes replayed, LATER).
// Fails on the pre-fix page (`--control` serves index.html from `git show 5c3b01a:index.html`).
//   node scripts/loop/probes/S5-key-rows12.mjs [--control]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const control = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = `(() => { let a = 20261105; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();`;
const STACKED = /^(add|sub|mul)\d$|^mixed$/;

async function measure(browser, base, page) {
  const p = await openPage(browser, base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (page) await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: page }));
  await p.page.reload({ waitUntil: 'load' });
  await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry');
  const roster = [];
  for (let g = 1; g <= 8; g++) {
    const types = await p.page.evaluate(g => { const s = document.querySelector('select[name="grade"]'); s.value = String(g);
      s.dispatchEvent(new Event('change', { bubbles: true }));
      return [...document.querySelector('select[name="problemType"]').options].map(o => o.value).filter(Boolean); }, g);
    for (const t of types) if (STACKED.test(t)) roster.push(`G${g} ${t}, ${g}, ${t}, 60, ${g};`);
  }
  await p.page.click(p.spec.modeToggle);
  await p.page.fill(p.spec.advanced, roster.join('\n'));
  await p.page.setChecked(p.spec.key, true);
  await p.page.click(p.spec.generate);
  const anyway = p.page.locator('#mwgValidationGenerate');
  if (await anyway.count() && await anyway.isVisible()) await anyway.click();
  await p.page.waitForFunction(() => window.__prints > 0, null, { timeout: 30000 });
  await p.page.emulateMedia({ media: 'print' });
  const r = await p.page.evaluate(({ results, printId }) => {
    const res = document.querySelector(results); res.id = printId; document.body.appendChild(res);
    const ctx = document.createElement('canvas').getContext('2d');
    const ink = cell => {                       // the glyphs' own box, and the ruled line
      let top = Infinity, bottom = -Infinity;
      const walk = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!n.textContent.trim()) continue;
        const cs = getComputedStyle(n.parentElement); ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const m = ctx.measureText(n.textContent.trim()), g = document.createRange(); g.selectNodeContents(n);
        for (const rc of g.getClientRects()) {
          const base = rc.top + (rc.height - m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2 + m.fontBoundingBoxAscent;
          top = Math.min(top, base - m.actualBoundingBoxAscent); bottom = Math.max(bottom, base + m.actualBoundingBoxDescent);
        }
      }
      const line = cell.querySelector('.mwg-problem-bottom-line');
      if (line) { const b = line.getBoundingClientRect(); bottom = Math.max(bottom, b.bottom); }
      return { top, bottom };
    };
    const sheets = [...document.querySelectorAll('.mwg-worksheet, .mwg-answer-key-sheet')];
    const out = { html: [], keys12: 0, cells12: 0, minGap: Infinity, close: 0, inkBottom: 0 };
    sheets.forEach(s => {
      const grid = s.querySelector('.mwg-problems-grid.mwg-rows-12');
      const isKey12 = s.classList.contains('mwg-answer-key-sheet') && grid;
      out.html.push(isKey12 ? null : s.innerHTML);
      if (!isKey12) return;
      out.keys12++;
      const cols = +[...grid.classList].find(c => /^mwg-cols-/.test(c)).slice(9), cells = [...grid.children];
      const so = s.getBoundingClientRect().top;
      cells.forEach((c, i) => {
        out.cells12++;
        const a = ink(c); out.inkBottom = Math.max(out.inkBottom, a.bottom - so);
        const below = cells[i + cols]; if (!below) return;
        const gap = ink(below).top - a.bottom; out.minGap = Math.min(out.minGap, gap); if (gap < 2) out.close++;
      });
    });
    return out;
  }, { results: p.spec.results, printId: p.spec.printId });
  r.errors = p.errors; r.students = roster.length;
  await p.close();
  return r;
}

// Later approved changes to what the sheets hold, replayed onto the reference page so the identity arm
// still isolates S5's change (one generator change shifts the seeded stream for every sheet after it).
const LATER = [
  // S6: Division Levels 3-4 draw 2-digit dividends; the header states the count printed.
  ['function makeDiv3() { var d=rand(2,9),q=rand(10,99);', 'function makeDiv3() { var d,q; do{d=rand(2,9);q=rand(10,49);}while(d*q>99);'],
  ['var d=rand(2,9),q=rand(10,99),r=rand(1,d-1);', 'var d,q,r; do{d=rand(2,9);q=rand(10,49);r=rand(1,d-1);}while(d*q+r>99);'],
  ['var desc = descriptionFor(type, grade, count);', 'var desc = descriptionFor(type, grade, problems.length);'],
  ['desc:descriptionFor(student.type,student.grade,student.count)', 'desc:descriptionFor(student.type,student.grade,result.problems.length)'],
  // S8: fraction keys write whole and mixed numbers (Mixed at grades 5-8 holds fractions).
  ['function fractionStr(n, d) { var g = gcd(Math.abs(n), Math.abs(d)); return (n/g) + "/" + (d/g); }',
   'function fractionStr(n, d) { var g = gcd(Math.abs(n), Math.abs(d)); n = n / g; d = d / g; var whole = Math.floor(n / d), rest = n - whole * d; return rest === 0 ? String(whole) : (whole ? whole + " " : "") + rest + "/" + d; }'],
  // S10: rounding problems stay on one line (a nowrap span; Mixed at grades 5-8 holds rounding).
  ['  return {html:horizHtml("Round "+n+" to nearest "+label),answer:Math.round(n/place)*place,kind:"horiz"};',
   '  return {html:horizHtml(\'<span style="white-space:nowrap">Round \'+n+\' to nearest \'+label+\'</span>\'),answer:Math.round(n/place)*place,kind:"horiz"};'],
  // S11: the Decimals type shows the level's places on every number, sheet and key (Mixed at grades 5-8 holds decimals).
  ["  if(op===\"+\") return {html:horizHtml(a+\" + \"+b+\" =\"),answer:+(a+b).toFixed(pl),kind:\"horiz\"};",
   "  if(op===\"+\") return {html:horizHtml(a.toFixed(pl)+\" + \"+b.toFixed(pl)+\" =\"),answer:(a+b).toFixed(pl),kind:\"horiz\"};"],
  ["  return {html:horizHtml(hi+\" \\u2212 \"+lo+\" =\"),answer:+(hi-lo).toFixed(pl),kind:\"horiz\"};",
   "  return {html:horizHtml(hi.toFixed(pl)+\" \\u2212 \"+lo.toFixed(pl)+\" =\"),answer:(hi-lo).toFixed(pl),kind:\"horiz\"};"],
];
const replay = body => LATER.reduce((b, [from, to]) => {
  if (!b.includes(from)) throw new Error(`replay anchor missing: ${from}`); return b.replace(from, to); }, body);

const srv = await serve(); const browser = await launch();
try {
  const old = execSync('git show 5c3b01a:index.html', { cwd: ROOT, encoding: 'utf8' });
  const r = await measure(browser, srv.base, control ? old : null);
  const ref = control ? r : await measure(browser, srv.base, replay(old));
  check(r.keys12 > 0 && r.cells12 > 0, `${r.students} students at 60: ${r.keys12} rows-12 key(s), ${r.cells12} cells measured`);
  check(r.close === 0, `every red answer >= 2 px clear of the problem below (${r.close} closer; min gap ${r.minGap.toFixed(1)} px)`);
  check(r.inkBottom <= 816, `rows-12 key ink ends on the paper (${r.inkBottom.toFixed(0)} of 816 px)`);
  const diff = r.html.filter((h, i) => h !== ref.html[i]).length;
  check(r.html.length === ref.html.length && diff === 0, `every other sheet byte-identical to the control's (${diff} of ${r.html.filter(h => h !== null).length} differ)`);
  check(r.errors.length === 0, `0 page errors (${r.errors.join(' | ')})`);
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS5-key-rows12: ${fails.length} failing` : '\nS5-key-rows12: all green');
process.exit(fails.length ? 1 : 0);
