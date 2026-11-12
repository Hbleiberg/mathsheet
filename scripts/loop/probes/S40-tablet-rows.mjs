// Probe (loop S40, pass M on index.html; S19's P4, approved S40, gate 4): an iPad upright or a phone on its side puts a
// student's five fields on two rows. At 701-860 px the five fields shared one row, so Problem Type had 84-116 px for
// its text: "Level 2 — factor" without its level, "Scientific Notatio", and Problem Count "30 problems (ma". At 701,
// 750 (an iPhone 13 on its side), 768 (an iPad Mini upright), 820 and 900 px: Name, Number and Grade share the first
// row, Type and Count the second, together as wide as the first; every Problem Type a grade offers (grades 1-8) and
// every count fits its select when chosen; with the Number removed nothing overlaps and every field stays in its row;
// the Mixed and Operations panels keep the row's whole width. At 390, 480, 700, 901, 1024 and 1280 px every field's box
// is where it was before the change. 0 page errors. Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S40-tablet-rows.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, devices, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const BAND = [['701 px', { viewport: { width: 701, height: 900 } }], ['iPhone 13 landscape', devices['iPhone 13 landscape']],
  ['iPad Mini', devices['iPad Mini']], ['820 px', { viewport: { width: 820, height: 900 } }], ['900 px', { viewport: { width: 900, height: 900 } }]];
const OUTSIDE = [['iPhone 13', devices['iPhone 13']], ['480 px', { viewport: { width: 480, height: 900 } }], ['700 px', { viewport: { width: 700, height: 900 } }],
  ['901 px', { viewport: { width: 901, height: 900 } }], ['1024 px', { viewport: { width: 1024, height: 900 } }], ['1280 px', { viewport: { width: 1280, height: 900 } }]];
// before the change: the commit before the one that brought the 701-900 px rule, or HEAD while uncommitted
const fixAt = execSync('git log -1 --format=%h -S"(min-width: 701px) and (max-width: 900px)" -- index.html', { cwd: ROOT, encoding: 'utf8' }).trim();
const BEFORE = fixAt ? `${fixAt}~1` : 'HEAD';
const ROW = '#mwgStudentsContainer .mwg-student-entry';

async function open(browser, base, dev, ref) {
  const p = await openPage(browser, base, 'index.html', { raw: true, device: dev });
  if (ref) {
    const body = execSync(`git show ${ref}:index.html`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(ROW);
  }
  return p;
}
// each field's box in Student 1 (and the grid's), rounded to a quarter pixel
const boxes = page => page.evaluate(sel => {
  const row = document.querySelector(sel), grid = row.querySelector('.mwg-student-grid');
  const q = v => Math.round(v * 4) / 4;
  const b = e => { const r = e.getBoundingClientRect(); return { x: q(r.left), y: q(r.top + scrollY), w: q(r.width), h: q(r.height) }; };
  return { grid: b(grid), fields: ['studentName', 'studentNumber', 'grade', 'problemType', 'count'].map(n => ({ n, ...b(row.querySelector(`[name="${n}"]`)) })) };
}, ROW);
// the chosen text of a select against its text box (its width less padding and the arrow), measured in its own font
const fit = (page, name) => page.evaluate(([sel, name]) => {
  const e = document.querySelector(`${sel} [name="${name}"]`), s = getComputedStyle(e), span = document.createElement('span');
  span.style.cssText = `font:${s.font};white-space:pre;position:absolute;visibility:hidden`;
  span.textContent = e.options[e.selectedIndex].text; document.body.appendChild(span);
  const tw = span.getBoundingClientRect().width; span.remove();
  return { text: span.textContent, tw: Math.round(tw), room: Math.round(e.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) - 22) };
}, [ROW, name]);

const srv = await serve(); const browser = await launch();
try {
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}: 701-900 px`);
  for (const [shape, dev] of BAND) {
    const p = await open(browser, srv.base, dev, REF); const { page } = p;
    const s1 = `${ROW}:nth-child(1)`;
    let cut = [], tried = 0;
    for (let g = 1; g <= 8; g++) {
      await page.selectOption(`${s1} [name="grade"]`, String(g));
      const types = await page.$$eval(`${s1} [name="problemType"] option`, os => os.map(o => o.value).filter(Boolean));
      for (const t of types) {
        await page.selectOption(`${s1} [name="problemType"]`, t);
        const counts = await page.$$eval(`${s1} [name="count"] option`, os => os.map(o => o.value));
        for (const c of counts) {
          await page.selectOption(`${s1} [name="count"]`, c);
          const f = await fit(page, 'count'); tried++;
          if (f.tw > f.room) cut.push(`count "${f.text}" ${f.tw}/${f.room}`);
        }
        const f = await fit(page, 'problemType'); tried++;
        if (f.tw > f.room) cut.push(`grade ${g} type "${f.text}" ${f.tw}/${f.room}`);
      }
    }
    cut = [...new Set(cut)];
    check(tried > 300 && cut.length === 0, `${shape}: every Problem Type and count shows its whole text (${tried} choices; ${cut.length} cut${cut.length ? ': ' + cut.slice(0, 3).join(' | ') : ''})`);
    const b = await boxes(page), [nm, nu, gr, ty, co] = b.fields;
    const bot = f => f.y + f.h;   // the row aligns its fields at the bottom (a select is 2 px shorter than an input)
    const rowOne = Math.abs(bot(nm) - bot(nu)) < 1 && Math.abs(bot(nu) - bot(gr)) < 1, rowTwo = Math.abs(bot(ty) - bot(co)) < 1 && ty.y > bot(nm);
    const spans = Math.abs(ty.x - nm.x) < 1 && Math.abs(co.x + co.w - (gr.x + gr.w)) < 1 && Math.abs(gr.x + gr.w - (b.grid.x + b.grid.w)) < 1;
    check(rowOne && rowTwo && spans, `${shape}: Name, Number, Grade on one row (${nm.w} / ${nu.w} / ${gr.w} px), Type and Count on the next (${ty.w} / ${co.w} px), as wide as the first`);
    // the panels keep the row's width; then the Number removed
    await page.selectOption(`${ROW}:nth-child(2) [name="grade"]`, '5'); await page.selectOption(`${ROW}:nth-child(2) [name="problemType"]`, 'mixed');
    await page.selectOption(`${ROW}:nth-child(3) [name="grade"]`, '6'); await page.selectOption(`${ROW}:nth-child(3) [name="problemType"]`, 'fractions');
    const panels = await page.evaluate(sel => [2, 3].map(n => { const r = document.querySelector(`${sel}:nth-child(${n})`), g = r.querySelector('.mwg-student-grid').getBoundingClientRect();
      const pnl = r.querySelector(n === 2 ? '.mwg-mixed-types' : '.mwg-ops-panel').getBoundingClientRect(); return Math.abs(pnl.width - g.width) < 1 && pnl.height > 40; }), ROW);
    check(panels.every(Boolean), `${shape}: the Mixed and Fraction Operations panels keep the row's whole width`);
    await page.check('#mwgRemoveNumberToggle');
    const nb = await boxes(page), vis = nb.fields.filter(f => f.w > 0);
    let over = 0; for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) { const a = vis[i], c = vis[j]; if (a.x < c.x + c.w - 1 && c.x < a.x + a.w - 1 && a.y < c.y + c.h - 1 && c.y < a.y + a.h - 1) over++; }
    const inside = vis.every(f => f.x >= nb.grid.x - 0.5 && f.x + f.w <= nb.grid.x + nb.grid.w + 0.5 && f.y + f.h <= nb.grid.y + nb.grid.h + 0.5);
    check(vis.length === 4 && over === 0 && inside, `${shape}, the Number removed: ${vis.length} fields, ${over} overlapping, all inside the row`);
    check(p.errors.length === 0, `${shape}: 0 page errors (${p.errors.length})`);
    await p.close();
  }
  console.log(`outside the band, against ${BEFORE}`);
  for (const [shape, dev] of OUTSIDE) {
    const now = await open(browser, srv.base, dev, REF), was = await open(browser, srv.base, dev, BEFORE);
    for (const p of [now, was]) for (const [n, v] of [['grade', '8'], ['problemType', 'scientificnotation']]) await p.page.selectOption(`${ROW}:nth-child(1) [name="${n}"]`, v);
    const a = await boxes(now.page), b = await boxes(was.page);
    const moved = a.fields.filter((f, i) => ['x', 'y', 'w', 'h'].some(k => Math.abs(f[k] - b.fields[i][k]) > 0.25)).map(f => f.n);
    check(moved.length === 0 && now.errors.length === 0, `${shape}: every field where it was (${moved.length ? 'moved: ' + moved.join(', ') : 'Type ' + a.fields[3].w + ' px'})`);
    await now.close(); await was.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS40-tablet-rows: ${fails.length} failing check(s)` : '\nS40-tablet-rows: all green');
process.exit(fails.length ? 1 : 0);
