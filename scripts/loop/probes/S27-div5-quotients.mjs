// Probe (loop S27, pass G on index.html): Division Level 5 ("3-digit ÷ 1-digit") draws its quotient from the
// smallest that makes a 3-digit dividend (approved S27, gate 2). `Math.max(100, Math.floor(100 / d))` was always
// 100, so no quotient had two digits, the divisor always went into the dividend's first digit (no 156 ÷ 4 = 39,
// 4.NBT.B.6) and ÷9 had 12 problems (900–999). 200 students × 60 through Advanced Input, key on, read back:
//   - every dividend has 3 digits, every division is exact, every divisor is 2–9 and each divisor appears;
//   - 2-digit quotients make 35–65 % of the problems (the shape's expectation is ~50 %), and some dividend's first
//     digit is below its divisor;
//   - ÷9 offers more than 12 problems (it can reach 100) and every key's quotient is the problem's.
// On 29e6a69, before the fix, it fails the share, first-digit and ÷9 checks (3).
//   node scripts/loop/probes/S27-div5-quotients.mjs [--n 200]
import { serve, launch, openPage } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const N = +(arg('--n') || 200);
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const srv = await serve(); const browser = await launch();
try {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  await p.page.click(p.spec.modeToggle);
  await p.page.setChecked(p.spec.key, true);
  await p.page.fill(p.spec.advanced, Array.from({ length: N }, (_, i) => `S${i}, ${i}, div5, 60, 5;`).join('\n'));
  const before = await p.prints();
  await p.page.click(p.spec.generate);
  await p.page.waitForFunction(n => document.querySelectorAll('#mwgResults .mwg-answer-key-sheet').length >= n, N, { timeout: 60000 });
  void before;
  const r = await p.page.evaluate(() => {
    const read = s => [...s.querySelectorAll('.mwg-division-problem')].map(c => {
      const dd = c.querySelector('.mwg-division-dividend');
      const q = dd.querySelector('span');
      return { d: +c.querySelector('.mwg-division-divisor').textContent, dd: +dd.firstChild.textContent.trim(), q: q ? q.textContent.trim() : null };
    });
    return { sheets: [...document.querySelectorAll('#mwgResults .mwg-worksheet')].map(read),
      keys: [...document.querySelectorAll('#mwgResults .mwg-answer-key-sheet')].map(read) };
  });
  const all = r.sheets.flat();
  check(r.sheets.length === N && all.length === N * 60, `${r.sheets.length} sheets, ${all.length} problems read (want ${N} × 60)`);
  check(all.every(x => x.dd >= 100 && x.dd <= 999), `every dividend has 3 digits (${all.filter(x => x.dd < 100 || x.dd > 999).length} not)`);
  check(all.every(x => x.dd % x.d === 0), `every division is exact (${all.filter(x => x.dd % x.d).length} not)`);
  const per = {}; for (const x of all) (per[x.d] ??= new Set()).add(x.dd);
  check(Object.keys(per).map(Number).sort((a, b) => a - b).join() === '2,3,4,5,6,7,8,9', `divisors 2–9 all appear (${Object.keys(per).join(',')})`);
  const q2 = all.filter(x => x.dd / x.d < 100).length / all.length;
  check(q2 >= 0.35 && q2 <= 0.65, `2-digit quotients ${(100 * q2).toFixed(1)} % of problems (want 35–65 %)`);
  const below = all.filter(x => Math.floor(x.dd / 100) < x.d).length;
  check(below > 0, `a dividend's first digit below its divisor in ${below} problems (156 ÷ 4)`);
  check((per[9] || new Set()).size > 12, `÷9 offers ${(per[9] || new Set()).size} different problems (12 before)`);
  let wrong = 0, mismatch = 0;
  r.sheets.forEach((sh, i) => sh.forEach((x, j) => { const k = r.keys[i][j];
    if (!k || k.d !== x.d || k.dd !== x.dd) mismatch++; else if (k.q !== String(x.dd / x.d)) wrong++; }));
  check(!mismatch && !wrong, `every key problem is the sheet's own (${mismatch} differ) with its quotient (${wrong} wrong)`);
  console.log(`   distinct per divisor: ${JSON.stringify(Object.fromEntries(Object.entries(per).map(([d, s]) => [d, s.size])))}`);
  check(!p.errors.length, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
} finally { await browser.close(); await srv.close(); }
console.log(`\nS27-div5-quotients: ${fails.length ? fails.length + ' failing' : 'all green'}`);
process.exit(fails.length ? 1 : 0);
