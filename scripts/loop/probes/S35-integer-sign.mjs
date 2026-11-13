// Probe (loop S35; found S6, pass G): index.html's Integers & Negatives write a negative number with the minus sign
// U+2212, as the operator is (CLAUDE.md: "The minus sign is U+2212, not a hyphen"). It printed "-7 \u2212 (-3) =" and a
// key "-4": the hyphen, shorter and higher, beside the operator's minus on ~74 % of the sheet's problems. Per arm
// (Integers at grades 7 and 8, a grade 8 Mixed of Integers alone, Math.random seeded), by real clicks in the Advanced
// box: no hyphen anywhere on a sheet or key, negatives present on both (the handle resolves), every key answer equal
// to the problem worked with U+2212 read as minus, and the operator still "+" or "\u2212". Fails before (`--ref 43ce1a7`).
//   node scripts/loop/probes/S35-integer-sign.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const MINUS = String.fromCharCode(0x2212);
const SEED = () => { let s = 20261112; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
const ARMS = [['integers, 30, 7', 4], ['integers, 30, 8', 4], ['mixed[integers], 30, 8', 2]];

const srv = await serve(); const browser = await launch();
try {
  const p = await openPage(browser, srv.base, 'index.html');
  const pg = p.page;
  await p.context.addInitScript(SEED);
  if (REF) {
    const body = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8' });
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
    await pg.waitForFunction(n => window.__prints > n, before, { timeout: 30000 }).catch(() => {});
    const got = await pg.evaluate(() => {
      const cells = s => [...document.querySelectorAll(s + ' .mwg-horiz-problem')].map(e => e.textContent.trim());
      const keyCells = [...document.querySelectorAll('.mwg-answer-key-sheet .mwg-horiz-cell')].map(c => ({
        q: c.querySelector('.mwg-horiz-problem').textContent.trim(),
        a: c.lastElementChild.textContent.trim() }));
      return { sheet: cells('.mwg-worksheet:not(.mwg-answer-key-sheet)'), key: keyCells, err: document.querySelector('#mwgErrors').innerText.trim() };
    });
    const sheetNeg = got.sheet.filter(t => t.includes('(' + String.fromCharCode(0x2212)) || t.startsWith(String.fromCharCode(0x2212))).length;
    check(got.sheet.length >= 30 * copies && got.key.length >= 30 * copies, `${entry}: ${got.sheet.length} problems on the sheets, ${got.key.length} on the keys (${got.err})`);
    check(!got.sheet.some(t => t.includes('-')) && !got.key.some(k => k.q.includes('-') || k.a.includes('-')), `${entry}: no hyphen on a sheet or key (${(got.sheet.find(t => t.includes('-')) || '').slice(0, 30)})`);
    check(sheetNeg > got.sheet.length / 2, `${entry}: ${sheetNeg} of ${got.sheet.length} problems hold a negative number`);
    check(got.key.some(k => k.a.startsWith(MINUS)), `${entry}: negative answers on the key`);
    // work each key problem: "a op (b) =", or "a op b =" for a positive b since S46, with either sign read as minus
    const num = s => +s.replace(/[\u2212-]/g, '-');
    const bad = got.key.filter(k => {
      const m = k.q.match(/^([\u2212-]?\d+) ([+\u2212]) \(?([\u2212-]?\d+)\)? =$/);
      if (!m) return true;
      const v = m[2] === '+' ? num(m[1]) + num(m[3]) : num(m[1]) - num(m[3]);
      return num(k.a) !== v;
    });
    check(bad.length === 0, `${entry}: every key answer right, read with U+2212 as minus (${bad.slice(0, 2).map(k => k.q + ' ' + k.a).join('; ')})`);
  }
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS35-integer-sign: ${fails.length} failing check(s)` : '\nS35-integer-sign: all green');
process.exit(fails.length ? 1 : 0);
