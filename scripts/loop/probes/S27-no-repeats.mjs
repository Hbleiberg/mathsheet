// Probe (loop S27, pass G on index.html): a sheet deals its problems as the twins deal their facts (approved S27,
// gate 6): no problem twice until the level has no new one to give, never the same problem twice running.
// Drawn independently, a fact level's 30-problem sheet repeated 25–30 % of its problems (Addition 2: 8 of 30)
// and half its sheets had a problem twice in a row (Division 2: 106 of 200; Exponents 133).
// Every selector below, 200 students through Advanced Input, key on, read back from the DOM:
//   - no sheet has the same problem twice running (sheets and the across grid alike);
//   - a level's pool is the union of what its 200 sheets show; a sheet that asks no more than the pool holds shows
//     that many different problems (all but 1 % of sheets; none more than one short), and no problem is printed more
//     than ceil(count / pool) + 1 times;
//   - every key lists the sheet's own problems in the sheet's order.
// On 56b3b00, before the fix, the adjacency and the distinct checks fail.
//   node scripts/loop/probes/S27-no-repeats.mjs [--n 200] [--only add2@5x60]
import { serve, launch, openPage } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const N = +(arg('--n') || 200), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };

const basic = ['add1','add2','add3','add4','add5','sub1','sub2','sub3','sub4','sub5','mul1','mul2','mul3','mul4','mul5','div1','div2','div3','div4','div5'];
const SELECTORS = [
  ...basic.flatMap(t => [`${t}@5x30`, `${t}@5x60`]),
  'fractions@5x30', 'fractions@6x30', 'fractions[fractions-divw]@6x30', 'fractions[fractions-add|fractions-sub]@6x30',
  'decimals@5x30', 'decimals[decimals-divd]@6x30', 'rounding@5x30', 'longdivision@5x30', 'orderofoperations@6x30',
  'integers@7x30', 'exponents@8x30', 'scientificnotation@8x30',
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(g => `mixed@${g}x60`), 'mixed[div2]@1x60', 'mixed[mul2|div2]@2x60',
].filter(s => !ONLY || s === ONLY);

const srv = await serve(); const browser = await launch();
try {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  await p.page.click(p.spec.modeToggle);
  await p.page.setChecked(p.spec.key, true);
  let adjacentAll = 0, sheetsAll = 0;
  for (const sel of SELECTORS) {
    const [, type, grade, count] = sel.match(/^(.+)@(\d)x(\d+)$/);
    await p.page.fill(p.spec.advanced, Array.from({ length: N }, (_, i) => `S${i}, ${i}, ${type}, ${count}, ${grade};`).join('\n'));
    await p.page.click(p.spec.generate);
    await p.page.waitForFunction(n => document.querySelectorAll('#mwgResults .mwg-answer-key-sheet').length >= n, N, { timeout: 60000 });
    const r = await p.page.evaluate(() => {
      // fractions as [n/d] and powers as ^e (as S6-math-audit reads them), so 1/12 and 11/2 stay apart
      const canon = el => { let s = ''; for (const n of el.childNodes) {
        if (n.nodeType === 3) s += n.textContent;
        else if (n.classList.contains('mwg-fraction')) s += `[${n.querySelector('.mwg-fraction-num').textContent}/${n.querySelector('.mwg-fraction-den').textContent}]`;
        else if (n.tagName === 'SUP') s += '^' + n.textContent; else s += canon(n); } return s.replace(/\s+/g, ' ').trim(); };
      const text = c => { const t = c.querySelector('.mwg-horiz-problem, .mwg-problem-stack, .mwg-division-problem');
        if (!t) return c.textContent.trim();
        if (t.classList.contains('mwg-division-problem')) {
          const dd = t.querySelector('.mwg-division-dividend');
          // a Mixed key in rows-10 / rows-12 draws its own bar: the dividend under the answer (S8)
          const dividend = dd ? dd.firstChild.textContent : t.children[1].children[1].textContent;
          return `${t.querySelector('.mwg-division-divisor').textContent.trim()})${dividend.trim()}`; }
        if (t.classList.contains('mwg-problem-stack')) return `${t.querySelector('.mwg-problem-top').textContent} ${t.querySelector('.mwg-problem-operator').textContent} ${t.querySelector('.mwg-problem-bottom').textContent}`;
        return canon(t); };
      const read = s => [...s.querySelector('.mwg-problems-grid, .mwg-horiz-grid').children].map(text);
      return { sheets: [...document.querySelectorAll('#mwgResults .mwg-worksheet')].map(read),
        keys: [...document.querySelectorAll('#mwgResults .mwg-answer-key-sheet')].map(read),
        // a capped count's note ("prints at most 30 problems", S31) is not an error: those sheets print 30, as measured
        errors: document.querySelector('#mwgErrors').innerText.split('\n').filter(l => l.trim() && !/prints at most 30 problems/.test(l)).join('\n').trim() };
    });
    const pool = new Set(r.sheets.flat()).size;
    let adjacent = 0, short = 0, shortBy2 = 0, maxCopies = 0, keyOff = 0, worst = '';
    for (const [i, items] of r.sheets.entries()) {
      for (let j = 1; j < items.length; j++) if (items[j] === items[j - 1]) { adjacent++; worst ||= `${items[j]} twice running`; }
      const copies = {}; items.forEach(x => copies[x] = (copies[x] || 0) + 1);
      const distinct = Object.keys(copies).length, want = Math.min(items.length, pool);
      if (distinct < want) short++; if (distinct < want - 1) shortBy2++;
      maxCopies = Math.max(maxCopies, ...Object.values(copies));
      if (JSON.stringify(r.keys[i]) !== JSON.stringify(items)) keyOff++;
    }
    adjacentAll += adjacent; sheetsAll += r.sheets.length;
    const perSheet = r.sheets[0] ? r.sheets[0].length : 0, copyCap = Math.ceil(perSheet / pool) + 1;
    const ok = r.sheets.length === N && !r.errors && !adjacent && short <= N / 100 && !shortBy2 && maxCopies <= copyCap && !keyOff;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${sel}: ${r.sheets.length} sheets of ${perSheet}, pool ${pool}; twice running ${adjacent}; sheets short of min(count, pool) ${short} (by 2+ ${shortBy2}); most copies ${maxCopies} (cap ${copyCap}); keys off ${keyOff}${worst ? ' — e.g. ' + worst : ''}${r.errors ? ' — page says ' + r.errors.slice(0, 80) : ''}`);
    if (!ok) fails.push(sel);
  }
  check(sheetsAll > 0, `${sheetsAll} sheets read, ${adjacentAll} problems twice running`);
  check(!p.errors.length, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
} finally { await browser.close(); await srv.close(); }
console.log(`\nS27-no-repeats: ${fails.length ? fails.length + ' failing' : 'all green'}`);
process.exit(fails.length ? 1 : 0);
