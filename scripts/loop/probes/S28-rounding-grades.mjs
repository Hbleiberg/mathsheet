// Probe (loop S28; found S27, pass G on index.html; approved S27 at gate 2): Rounding is offered at grades 3–4, as the
// Common Core teaches it (3.NBT.A.1, round to the nearest 10 or 100), through `makeRounding`'s grade ≤ 4 branch (to 999,
// tens and hundreds), which no menu or Advanced entry reached. It stays out of their default Mixed: an across type there
// would turn every grade 3–4 Mixed sheet across, at 30 problems at most. Checks:
//   - the Type menu offers Rounding at grades 3–8, not at 1–2; the Grade Reference puts it under Grades 3-4;
//   - Advanced "rounding, 30, 3" and "…, 4" print 200 sheets each, every problem "Round n to nearest tens|hundreds" with
//     n ≤ 999 (no thousands), every key answer recomputed;
//   - grade 3–4 Mixed: its Include-in-Mixed panel offers Rounding unticked, the rest ticked; Mixed with no picks (form and
//     Advanced) prints no rounding and stays on the stacked grid at 60; `mixed[rounding|add1]` at grade 3 prints both, across;
//   - nothing else moves: under one seed, Advanced Mixed at grades 1–4 and Rounding at grade 5 are byte-identical to
//     c9cc85f's (`--ref` another base).
// On c9cc85f, before the fix, the menu, the reference, the panel, the two rounding entries and the picked Mixed fail (8).
//   node scripts/loop/probes/S28-rounding-grades.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const BASE = arg('--ref') || 'c9cc85f';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = `(() => { let s = 20261110; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const srv = await serve(); const browser = await launch();

async function open(body) {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (body) await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  return p;
}
async function advanced(p, lines) {
  if (await p.page.isVisible('#mwgAdvancedBox') === false) await p.page.click(p.spec.modeToggle);
  await p.page.setChecked(p.spec.key, true);
  await p.page.fill(p.spec.advanced, lines.join('\n'));
  await p.page.click(p.spec.generate);
  await p.page.waitForTimeout(300);
  return p.page.evaluate(() => ({
    errors: document.querySelector('#mwgErrors').innerText.trim(),
    html: document.querySelector('#mwgResults').innerHTML,
    sheets: [...document.querySelectorAll('#mwgResults .mwg-worksheet')].map(s => ({
      across: !!s.querySelector('.mwg-horiz-grid'),
      items: [...s.querySelector('.mwg-problems-grid, .mwg-horiz-grid').children].map(c => (c.querySelector('.mwg-horiz-problem') || c).textContent.replace(/\s+/g, ' ').trim()) })),
    keys: [...document.querySelectorAll('#mwgResults .mwg-answer-key-sheet .mwg-horiz-cell')].map(c => ({
      t: c.querySelector('.mwg-horiz-problem').textContent.trim(), a: (c.querySelector(':scope > span') || {}).textContent })),
  }));
}
try {
  const p = await open(null);
  // 1. the menu and the reference
  const menu = await p.page.evaluate(async () => {
    const e = document.querySelector('#mwgStudentsContainer .mwg-student-entry');
    const g = e.querySelector('select[name="grade"]'), t = e.querySelector('select[name="problemType"]'), r = {};
    for (let k = 1; k <= 8; k++) { g.value = String(k); g.dispatchEvent(new Event('change', { bubbles: true }));
      r[k] = [...t.options].some(o => o.value === 'rounding'); }
    // the Mixed panel at grade 3
    g.value = '3'; g.dispatchEvent(new Event('change', { bubbles: true }));
    t.value = 'mixed'; t.dispatchEvent(new Event('change', { bubbles: true }));
    const cbs = [...e.querySelectorAll('.mwg-mixed-cb')];
    const count = e.querySelector('select[name="count"]');
    return { offered: r, panel: cbs.map(c => [c.value, c.checked]), counts: [...count.options].map(o => o.value).filter(Boolean),
      reference: [...document.querySelectorAll('.mwg-reference-grade')].map(d => d.textContent) };
  });
  const offered = Object.entries(menu.offered).filter(([, v]) => v).map(([k]) => +k);
  check(offered.join() === '3,4,5,6,7,8', `the Type menu offers Rounding at grades ${offered.join(', ')} (want 3–8)`);
  const ref34 = menu.reference.find(t => /^Grades 3-4:/.test(t)) || '', ref56 = menu.reference.find(t => /^Grades 5-6:/.test(t)) || '';
  check(/Rounding/.test(ref34) && !/Rounding/.test(ref56), `the Grade Reference lists Rounding under Grades 3-4 ("${ref34}"), not 5-6 ("${ref56}")`);
  const rnd = menu.panel.find(([v]) => v === 'rounding'), others = menu.panel.filter(([v]) => v !== 'rounding');
  check(!!rnd && rnd[1] === false && others.length >= 12 && others.every(([, c]) => c), `grade 3's Include-in-Mixed panel offers Rounding unticked (${rnd ? (rnd[1] ? 'ticked' : 'unticked') : 'absent'}), the ${others.length} others ticked`);
  check(menu.counts.join() === '30,40,50,60', `grade 3 Mixed by default still counts 30–60 (${menu.counts.join(', ')})`);
  // the form's default Mixed at grade 3, 60 problems: stacked, no rounding
  const form = await p.page.evaluate(() => {
    const e = document.querySelector('#mwgStudentsContainer .mwg-student-entry');
    const c = e.querySelector('select[name="count"]'); c.value = '60'; c.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelector('#mwgGenerateBtn').click();
    // the two empty default rows raise the unfilled-fields box: generate anyway
    const box = document.querySelector('#mwgValidationBox');
    if (box && box.style.display === 'block') document.querySelector('#mwgValidationGenerate').click();
    const s = document.querySelector('#mwgResults .mwg-worksheet');
    return s ? { across: !!s.querySelector('.mwg-horiz-grid'), n: s.querySelectorAll('.mwg-problem-cell').length, rounding: /Round /.test(s.textContent) } : null;
  });
  check(form && !form.across && form.n === 60 && !form.rounding, `the form's grade 3 Mixed at 60: ${form ? `${form.n} problems, ${form.across ? 'across' : 'stacked'}, ${form.rounding ? 'with' : 'no'} rounding` : 'no sheet'}`);
  // 2. Rounding at grades 3 and 4
  for (const g of [3, 4]) {
    const r = await advanced(p, Array.from({ length: 200 }, (_, i) => `S${i}, ${i}, rounding, 30, ${g};`));
    const items = r.sheets.flatMap(s => s.items);
    const off = items.filter(t => { const m = t.match(/^Round (\d+) to nearest (tens|hundreds)$/); return !m || +m[1] > 999 || +m[1] < 1; });
    const wrong = r.keys.filter(k => { const m = k.t.match(/^Round (\d+) to nearest (tens|hundreds)$/); if (!m) return true;
      const place = m[2] === 'tens' ? 10 : 100; return +k.a !== Math.floor(+m[1] / place + 0.5) * place; });
    check(r.sheets.length === 200 && items.length === 6000 && !r.errors, `grade ${g} Rounding: ${r.sheets.length} sheets, ${items.length} problems${r.errors ? ' — page says ' + r.errors.slice(0, 90) : ''}`);
    check(!off.length && r.keys.length === 6000 && !wrong.length, `grade ${g}: every problem to 999, tens or hundreds (${off.length} not${off.length ? ': ' + off[0] : ''}); every key right (${wrong.length} wrong of ${r.keys.length})`);
  }
  // 3. Mixed at grades 3–4 through Advanced
  for (const g of [3, 4]) {
    const r = await advanced(p, Array.from({ length: 200 }, (_, i) => `S${i}, ${i}, mixed, 60, ${g};`));
    const across = r.sheets.filter(s => s.across).length, withR = r.sheets.filter(s => s.items.some(t => /^Round /.test(t))).length;
    check(r.sheets.length === 200 && !across && !withR && r.sheets.every(s => s.items.length === 60), `Advanced grade ${g} Mixed at 60: ${r.sheets.length} sheets, ${across} across, ${withR} with rounding`);
  }
  {
    const r = await advanced(p, Array.from({ length: 50 }, (_, i) => `S${i}, ${i}, mixed[rounding|add1], 30, 3;`));
    const items = r.sheets.flatMap(s => s.items);
    check(r.sheets.length === 50 && !r.errors && r.sheets.every(s => s.across) && items.filter(t => /^Round /.test(t)).length === 750,
      `mixed[rounding|add1] at grade 3: ${r.sheets.length} sheets, all across, ${items.filter(t => /^Round /.test(t)).length} of ${items.length} rounding${r.errors ? ' — page says ' + r.errors.slice(0, 90) : ''}`);
  }
  check(!p.errors.length, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
  // 4. nothing else moves
  const base = execSync(`git show ${BASE}:index.html`, { cwd: ROOT, encoding: 'utf8' });
  const lines = [1, 2, 3, 4].flatMap(g => [30, 60].map(c => `M${g}${c}, ${g}, mixed, ${c}, ${g};`)).concat(['R5, 9, rounding, 30, 5;', 'R8, 10, rounding, 30, 8;']);
  const now = await open(null), was = await open(base);
  const a = await advanced(now, lines), b = await advanced(was, lines);
  check(a.sheets.length === 10 && a.html === b.html, `Mixed at grades 1–4 and Rounding at 5 and 8, one seed: byte-identical to ${BASE} (${a.sheets.length} sheets, ${a.html === b.html ? 'same' : 'differ'})`);
  await now.close(); await was.close();
} finally { await browser.close(); await srv.close(); }
console.log(`\nS28-rounding-grades: ${fails.length ? fails.length + ' failing' : 'all green'}`);
process.exit(fails.length ? 1 : 0);
