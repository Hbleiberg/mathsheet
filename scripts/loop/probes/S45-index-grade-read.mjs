// Probe (loop S45; found S11, pass E): index.html's Advanced grade and count read only their leading whole number, so
// "2.5" printed a Grade 2 sheet, "30.9" a 30-problem one and "2e1" Grade 2, with no message. A number with a fraction
// or an exponent is now reported as the invalid grade or count it is (the page's own messages); "2nd", "40 problems",
// "3.0" and "30.0" still read as a teacher means them (S38's measurement). Advanced paste, one copy:
//   - "2.5", "30.9", "2e1", "1.5e1" are reported as Entries 1-4 (grade, count, grade, count) and print nothing;
//   - "2nd" / "40 problems", "3.0" / "30.0", and a plain line print their sheets at the grade and count meant;
//   - the Standard form, its grades and counts picked from the selects, generates as before.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S45-index-grade-read.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const REF = (i => i > 0 ? process.argv[i + 1] : null)(process.argv.indexOf('--ref'));
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const LINES = [
  'Avi, 1, add1, 30, 2.5;',          // 1: grade with a fraction
  'Noa, 2, add1, 30.9, 3;',          // 2: count with a fraction
  'Eli, 3, add1, 30, 2e1;',          // 3: grade with an exponent
  'Gil, 4, sub1, 1.5e1, 4;',         // 4: count with an exponent (15, or 1)
  'Dana, 5, add1, 40 problems, 2nd;',
  'Tom, 6, mul1, 30.0, 3.0;',
  'Ron, 7, sub1, 50, 4;',
];
const srv = await serve(); const browser = await launch();
try {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  const { page } = p;
  if (REF) {
    const body = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    await page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await page.reload({ waitUntil: 'load' });
  }
  await page.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}`);
  await page.click('#mwgToggleModeBtn');
  await page.fill('#mwgAdvancedBox', LINES.join('\n'));
  const n = await p.prints(); await page.click('#mwgGenerateBtn'); await page.waitForFunction(n => window.__prints > n, n);
  const r = await page.evaluate(() => ({
    errors: document.getElementById('mwgErrors').textContent,
    sheets: [...document.querySelectorAll('#mwgResults .mwg-worksheet')].map(s => ({ name: s.querySelector('.mwg-ws-field-value').textContent,
      desc: s.querySelector('.mwg-ws-desc-text').textContent, n: s.querySelector('.mwg-problems-grid, .mwg-horiz-grid').children.length })),
  }));
  console.log(`  sheets: ${r.sheets.map(s => `${s.name}: ${s.desc} (${s.n})`).join(' / ')}`);
  console.log(`  error box: ${r.errors.replace(/\s+/g, ' ').trim()}`);
  const want = [['1', 'invalid grade', '2.5'], ['2', 'invalid count', '30.9'], ['3', 'invalid grade', '2e1'], ['4', 'invalid count', '1.5e1']];
  const missing = want.filter(([k, what, v]) => !new RegExp(`Entry ${k} ${what}: [^;]*${v.replace('.', '\\.')}`).test(r.errors));
  check(missing.length === 0, `"2.5", "30.9", "2e1" and "1.5e1" reported as Entries 1-4's invalid grade or count (${missing.map(m => m[2]).join(', ') || 'all four'})`);
  const names = r.sheets.map(s => s.name);
  check(['Avi', 'Noa', 'Eli', 'Gil'].every(x => !names.includes(x)), `none of the four prints a sheet (${names.join(', ')})`);
  const get = x => r.sheets.find(s => s.name === x) || { desc: '', n: 0 };
  check(/Grade 2/.test(get('Dana').desc) && get('Dana').n === 40, `"2nd" and "40 problems" read as Grade 2, 40 problems (${get('Dana').desc}, ${get('Dana').n})`);
  check(/Grade 3/.test(get('Tom').desc) && get('Tom').n === 30, `"3.0" and "30.0" read as Grade 3, 30 problems (${get('Tom').desc}, ${get('Tom').n})`);
  check(/Grade 4/.test(get('Ron').desc) && get('Ron').n === 50, `a plain line prints as asked (${get('Ron').desc}, ${get('Ron').n})`);
  check(!/Entry [567]\b/.test(r.errors), 'no message for Entries 5-7');
  // the Standard form: harness prepare picks grade 2, a type and a count for every default row
  await page.click('#mwgToggleModeBtn'); await p.spec.prepare(page);
  const m = await p.prints(); await page.click('#mwgGenerateBtn'); await page.waitForFunction(m => window.__prints > m, m);
  const std = await page.evaluate(() => [...document.querySelectorAll('#mwgResults .mwg-worksheet')].map(s => s.querySelector('.mwg-ws-desc-text').textContent));
  check(std.length >= 3 && std.every(d => /Grade 2/.test(d)), `the Standard form generates as before (${std.length} sheets: ${std[0]})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
  await p.close();
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS45-index-grade-read: ${fails.length} failing check(s)` : '\nS45-index-grade-read: all green');
process.exit(fails.length ? 1 : 0);
