// Probe (loop S5): index.html, a Grade 8 Mixed entry with only some fraction / decimal operations ticked,
// by real clicks, keeps exactly those after Duplicate and after Save -> reload, and its sheets use only
// them. A new Mixed entry, and a saved roster holding the bare "fractions" / "decimals" (every operation),
// still tick all eleven.
// Fails on the pre-fix page (`--control` serves index.html from `git show b9df9c9:index.html`).
//   node scripts/loop/probes/S5-mixed-ops.mjs [--control]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const control = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const ticked = (page, n) => page.evaluate(n => {
  const e = document.querySelectorAll('#mwgStudentsContainer .mwg-student-entry')[n];
  return [...e.querySelectorAll('.mwg-frac-op-cb:checked, .mwg-dec-op-cb:checked')].map(c => c.value).join(' ');
}, n);
const ALL = 'fractions-add fractions-sub fractions-mul fractions-divf fractions-divw decimals-add decimals-sub decimals-mulw decimals-muld decimals-divw decimals-divd';
const SUBSET = 'fractions-mul decimals-add';

async function open(browser, base, opts = {}) {
  const p = await openPage(browser, base, 'index.html', { raw: true, ...opts });
  if (control) {
    const body = execSync('git show b9df9c9:index.html', { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' });
    await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry');
  }
  return p;
}

const srv = await serve(); const browser = await launch();
try {
  const p = await open(browser, srv.base);
  const e1 = p.page.locator('.mwg-student-entry').first();
  await e1.locator('input[name="studentName"]').fill('Rivka');
  await e1.locator('select[name="grade"]').selectOption('8');
  await e1.locator('select[name="problemType"]').selectOption('mixed');
  await e1.locator('select[name="count"]').selectOption('30');
  check(await ticked(p.page, 0) === ALL, 'a new Mixed entry ticks all eleven operations');
  await e1.locator('.mwg-mixed-deselect-all').click();
  await e1.locator('.mwg-mixed-cb[value="mul4"]').check();
  await e1.locator('.mwg-frac-master').check();
  for (const v of ['fractions-add', 'fractions-sub', 'fractions-divf', 'fractions-divw']) await e1.locator(`.mwg-frac-op-cb[value="${v}"]`).uncheck();
  await e1.locator('.mwg-dec-master').check();
  for (const v of ['decimals-sub', 'decimals-mulw', 'decimals-muld', 'decimals-divw', 'decimals-divd']) await e1.locator(`.mwg-dec-op-cb[value="${v}"]`).uncheck();
  check(await ticked(p.page, 0) === SUBSET, `the clicks leave "${SUBSET}" ticked`);
  await e1.locator('.mwg-duplicate-link').click();
  const dup = await ticked(p.page, 1);
  check(dup === SUBSET, `Duplicate keeps the subset ("${dup}")`);
  await p.page.click('#mwgSaveBtn');
  const payload = JSON.parse(await p.page.evaluate(() => localStorage.getItem('mwgRosterData_v2')));
  check(payload.students[0].mixedTypes.join(' ') === `mul4 ${SUBSET}`, `the saved roster holds "mul4 ${SUBSET}"`);
  await p.page.reload({ waitUntil: 'load' });
  await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry');
  const back = await ticked(p.page, 0);
  check(back === SUBSET, `Save -> reload keeps the subset ("${back}")`);
  // The sheets use only the ticked operations: no division sign, no minus on a fraction or decimal sheet.
  await p.page.evaluate(() => { while (document.querySelectorAll('.mwg-student-entry').length > 1)
    document.querySelectorAll('.mwg-student-entry')[1].querySelector('.mwg-delete-link').click(); });
  await p.page.click('#mwgGenerateBtn');
  await p.page.waitForFunction(() => window.__prints > 0, null, { timeout: 15000 });
  const text = await p.page.$eval('#mwgResults .mwg-worksheet', s => s.innerText);
  check(!/[÷−]/.test(text), `a reloaded subset sheet has no ÷ or − (${(text.match(/[÷−]/g) || []).length} found)`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
  await p.close();

  // An older roster saving the bare "fractions" / "decimals" means every operation.
  payload.students[0].mixedTypes = ['mul4', 'fractions', 'decimals'];
  const q = await open(browser, srv.base, { storage: { mwgRosterData_v2: JSON.stringify(payload) } });
  const bare = await ticked(q.page, 0);
  check(bare === ALL, `a saved bare "fractions" / "decimals" ticks all eleven ("${bare.split(' ').length}")`);
  check(q.errors.length === 0, `0 page errors (${q.errors.join(' | ')})`);
  await q.close();
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS5-mixed-ops: ${fails.length} failing` : '\nS5-mixed-ops: all green');
process.exit(fails.length ? 1 : 0);
