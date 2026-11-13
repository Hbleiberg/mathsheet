// Probe (loop S46, pass G; approved at gate 6): index.html's Decimals "Division (dec ÷ dec)" writes its dividend with the
// one place it has ("15.6 ÷ 7.8 =", "18.0 ÷ 4.5 ="). A tenths divisor times a whole quotient is a tenths number, but it
// was written to two places, so every dividend ended in a needless 0 ("15.60 ÷ 7.8 =", 3,000 of 3,000). Arms, by real
// clicks in the Advanced box with the key (Math.random seeded): decimals[divd] at grade 6 (8 students), a grade 8
// Mixed of Addition Level 1 and dec ÷ dec, and the Standard path's whole list, decimals[add|sub|mulw|muld|divw|divd]:
//   - every dec ÷ dec dividend and divisor shows exactly one decimal place, none with a second;
//   - every dividend is its divisor times the key's answer, a whole number 2-9, worked exactly;
//   - every key problem is its sheet's own;
//   - `--identity`: under the same seed, every problem of the other five operations is byte-identical to c20e13c's, and a
//     dec ÷ dec problem differs only by the dropped 0 (the change prints a number, it draws nothing).
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S46-decdiv-places.mjs [--ref <commit>] [--identity]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), IDENTITY = process.argv.includes('--identity');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = () => { let s = 20261113; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
const ALL = 'decimals[add|sub|mulw|muld|divw|divd]';
const ARMS = [Array.from({ length: 8 }, (_, i) => `S${i}, ${i}, decimals[divd], 30, 6;`).join('\n'),
  'Noa, 1, mixed[add1|decimals-divd], 30, 8;', Array.from({ length: 4 }, (_, i) => `T${i}, ${i}, ${ALL}, 30, 7;`).join('\n')];
const body = c => execSync(`git show ${c}:index.html`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });

async function run(browser, base, served) {
  const p = await openPage(browser, base, 'index.html');
  const pg = p.page;
  await p.context.addInitScript(SEED);
  if (served) await pg.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: served }));
  const out = [];
  for (const lines of ARMS) {
    await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
    if (!(await pg.$eval('#mwgAnswerKeyToggle', e => e.checked))) await pg.click('#mwgAnswerKeyToggle');
    await pg.click('#mwgToggleModeBtn');
    await pg.fill('#mwgAdvancedBox', lines);
    const before = await p.prints();
    await pg.click('#mwgGenerateBtn');
    await pg.waitForFunction(n => window.__prints > n, before, { timeout: 30000 });
    out.push(await pg.evaluate(() => ({
      err: document.getElementById('mwgErrors').textContent.trim(),
      sheets: [...document.querySelectorAll('#mwgResults .mwg-worksheet:not(.mwg-answer-key-sheet)')].map(s =>
        [...s.querySelectorAll('.mwg-horiz-problem')].map(e => e.textContent.replace(/\s+/g, ' ').trim())),
      keys: [...document.querySelectorAll('#mwgResults .mwg-answer-key-sheet')].map(s => [...s.querySelectorAll('.mwg-horiz-cell')].map(c => ({
        q: c.querySelector('.mwg-horiz-problem').textContent.replace(/\s+/g, ' ').trim(), a: c.lastElementChild.textContent.trim() }))),
    })));
  }
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
  return out;
}

const srv = await serve(); const browser = await launch();
try {
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}`);
  const got = await run(browser, srv.base, REF ? body(REF) : null);
  const DIVD = /^(\d+\.\d+) ÷ (\d+\.\d+) =$/;
  got.forEach((r, i) => {
    const all = r.sheets.flat(), divd = all.filter(t => DIVD.test(t));
    check(r.sheets.length > 0 && divd.length >= (i === 0 ? 240 : 4), `arm ${i + 1}: ${r.sheets.length} sheets, ${all.length} problems, ${divd.length} dec ÷ dec (${r.err || 'no message'})`);
    const off = divd.filter(t => { const [, a, b] = t.match(DIVD); return !/^\d+\.\d$/.test(a) || !/^\d+\.\d$/.test(b); });
    check(off.length === 0, `arm ${i + 1}: every dec ÷ dec dividend and divisor shows one decimal place (${off.length} not: ${off.slice(0, 3).join(' | ')})`);
    const mism = r.sheets.reduce((n, s, k) => n + s.filter((t, j) => !r.keys[k] || !r.keys[k][j] || r.keys[k][j].q !== t).length, 0);
    check(mism === 0, `arm ${i + 1}: every key problem is its sheet's own (${mism} differ)`);
    const bad = r.keys.flat().filter(k => DIVD.test(k.q)).filter(k => { const [, a, b] = k.q.match(DIVD);
      const q = +k.a; return !/^[2-9]$/.test(k.a) || Math.round(+a * 10) !== Math.round(+b * 10) * q; });
    check(bad.length === 0, `arm ${i + 1}: every dividend is its divisor times the key's whole answer (${bad.slice(0, 2).map(k => k.q + ' ' + k.a).join('; ')})`);
  });
  if (IDENTITY) {
    const old = await run(browser, srv.base, body('c20e13c'));
    let same = 0, dropped = 0, other = [];
    got.forEach((r, i) => r.sheets.flat().forEach((t, j) => { const o = old[i].sheets.flat()[j];
      if (t === o) same++; else if (DIVD.test(t) && o === t.replace(/^(\d+\.\d)/, '$10')) dropped++; else other.push(`${o} → ${t}`); }));
    check(other.length === 0 && dropped > 0, `--identity: ${same} problems as c20e13c's, ${dropped} differ only by the dropped 0, ${other.length} otherwise (${other.slice(0, 2).join(' | ')})`);
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS46-decdiv-places: ${fails.length} failing check(s)` : '\nS46-decdiv-places: all green');
process.exit(fails.length ? 1 : 0);
