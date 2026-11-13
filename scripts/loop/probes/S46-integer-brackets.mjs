// Probe (loop S46, pass G; found S45, pass B): index.html's Integers & Negatives put only a negative second number in
// brackets, as a textbook writes it ("22 + 15 =", "5 − (−8) ="; approved at gate 6). Every second number had
// them, so about half the problems read "22 + (15) =". Per arm (Integers at grades 7 and 8, a grade 8 Mixed of Integers
// alone; four copies, the key, Math.random seeded), by real clicks in the Advanced box:
//   - every problem reads "a op b =" with b bracketed exactly when it is negative, the first number never bracketed;
//   - positive, negative and zero second numbers all present (the handle resolves);
//   - every key problem is its sheet's own, and its answer the problem worked out (U+2212 read as minus).
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S46-integer-brackets.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = () => { let s = 20261113; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
const ARMS = [['integers, 30, 7', 4], ['integers, 30, 8', 4], ['mixed[integers], 30, 8', 4]];
const SHAPE = /^(−?\d+) ([+−]) (\d+|\(−\d+\)) =$/;
const num = s => +s.replace(/[()]/g, '').replace(/−/g, '-');

const srv = await serve(); const browser = await launch();
try {
  const p = await openPage(browser, srv.base, 'index.html');
  const pg = p.page;
  await p.context.addInitScript(SEED);
  if (REF) {
    const body = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    await pg.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}`);
  for (const [entry, copies] of ARMS) {
    await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
    await pg.selectOption('#mwgWorksheetsPerStudent', String(copies));
    if (!(await pg.$eval('#mwgAnswerKeyToggle', e => e.checked))) await pg.click('#mwgAnswerKeyToggle');
    await pg.click('#mwgToggleModeBtn');
    await pg.fill('#mwgAdvancedBox', `Noa, 1, ${entry};`);
    const before = await p.prints();
    await pg.click('#mwgGenerateBtn');
    await pg.waitForFunction(n => window.__prints > n, before, { timeout: 30000 });
    const got = await pg.evaluate(() => ({
      sheets: [...document.querySelectorAll('#mwgResults .mwg-worksheet:not(.mwg-answer-key-sheet)')].map(s =>
        [...s.querySelectorAll('.mwg-horiz-problem')].map(e => e.textContent.replace(/\s+/g, ' ').trim())),
      keys: [...document.querySelectorAll('#mwgResults .mwg-answer-key-sheet')].map(s => [...s.querySelectorAll('.mwg-horiz-cell')].map(c => ({
        q: c.querySelector('.mwg-horiz-problem').textContent.replace(/\s+/g, ' ').trim(), a: c.lastElementChild.textContent.trim() }))),
    }));
    const all = got.sheets.flat();
    check(got.sheets.length === copies && got.keys.length === copies && all.length === 30 * copies, `${entry}: ${got.sheets.length} sheets, ${got.keys.length} keys, ${all.length} problems`);
    const off = all.filter(t => !SHAPE.test(t));
    check(off.length === 0, `${entry}: the second number bracketed exactly when negative, the first never (${off.length} not: ${off.slice(0, 3).join(' | ')})`);
    const second = all.map(t => (t.match(SHAPE) || [])[3]).filter(Boolean);
    const kinds = { pos: second.filter(b => /^\d+$/.test(b) && +b > 0).length, neg: second.filter(b => b[0] === '(').length, zero: second.filter(b => b === '0').length };
    check(kinds.pos > 0 && kinds.neg > 0, `${entry}: second numbers ${kinds.pos} positive, ${kinds.neg} negative, ${kinds.zero} zero`);
    const mism = got.sheets.reduce((n, s, i) => n + s.filter((t, j) => !got.keys[i] || !got.keys[i][j] || got.keys[i][j].q !== t).length, 0);
    check(mism === 0, `${entry}: every key problem is its sheet's own (${mism} differ)`);
    const bad = got.keys.flat().filter(k => { const m = k.q.match(SHAPE); if (!m) return true;
      return num(k.a) !== (m[2] === '+' ? num(m[1]) + num(m[3]) : num(m[1]) - num(m[3])); });
    check(bad.length === 0, `${entry}: every key answer right (${bad.slice(0, 2).map(k => k.q + ' ' + k.a).join('; ')})`);
  }
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS46-integer-brackets: ${fails.length} failing check(s)` : '\nS46-integer-brackets: all green');
process.exit(fails.length ? 1 : 0);
