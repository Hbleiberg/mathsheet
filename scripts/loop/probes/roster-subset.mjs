// Probe (loop S1): index.html keeps a student's problem-type subset and count through Fill Down,
// a saved-roster reload and Duplicate. Fails on the pre-fix page (`--control` serves `git show
// HEAD~1:index.html`, or `--control=<file>`), passes on the fixed one.
//   node scripts/loop/probes/roster-subset.mjs [--control[=<file>]]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { serve, launch, openPage, generate, cellCounts, ROOT } from '../harness.mjs';

const ctl = process.argv.find(a => a.startsWith('--control'));
const body = ctl ? (ctl.includes('=') ? fs.readFileSync(ctl.split('=')[1], 'utf8')
  : execSync('git show HEAD~1:index.html', { cwd: ROOT, encoding: 'utf8' })) : null;
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const srv = await serve(); const browser = await launch();
async function open(opts = {}) {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true, ...opts });
  return p;
}
// Served-copy control: route index.html to the old body (after openPage has created the page).
const realNC = browser.newContext.bind(browser);
if (body) browser.newContext = async (...a) => { const c = await realNC(...a); const np = c.newPage.bind(c);
  c.newPage = async () => { const pg = await np(); await pg.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body })); return pg; }; return c; };

const entry = (p, i) => p.page.locator('.mwg-student-entry').nth(i);
const setSel = (p, i, name, v) => entry(p, i).locator(`select[name="${name}"]`).selectOption(v);
const lines = async p => { await p.page.click('#mwgGenCodeBtn'); return (await p.page.inputValue('#mwgCodeOutput')).trim().split('\n').map(s => s.trim()); };

// 1. Fill Down from grade-5 fractions with only Addition checked.
{
  const p = await open();
  for (let i = 0; i < 4; i++) await p.page.click('#mwgAddStudentBtn');
  await setSel(p, 0, 'grade', '5'); await setSel(p, 0, 'problemType', 'fractions');
  for (const cb of await entry(p, 0).locator('.mwg-frac-op-cb').all()) if (await cb.getAttribute('value') !== 'fractions-add') await cb.uncheck();
  await p.page.click('#mwgFillDownBtn');
  const l = await lines(p);
  check(l.length === 7 && l.every(x => x === l[0]) && /fractions\[fractions-add\]/.test(l[0]), `Fill Down keeps the fraction-op subset on every line (1: ${l[0]} / 2: ${l[1]})`);
  const panel = await entry(p, 3).locator('.mwg-ops-panel').evaluate(e => ({ cls: e.className, h: e.offsetHeight }));
  check(/visible/.test(panel.cls) && panel.h > 0, `filled entry shows its ops panel (${panel.cls}, ${panel.h}px)`);
  check(p.errors.length === 0, '0 page errors'); await p.close();
}
// 2. Fill Down from grade-5 mixed[add1|sub1] × 40.
{
  const p = await open();
  await setSel(p, 0, 'grade', '5'); await setSel(p, 0, 'problemType', 'mixed');
  await entry(p, 0).locator('.mwg-mixed-deselect-all').click();
  await entry(p, 0).locator('.mwg-mixed-cb[value="add1"]').check(); await entry(p, 0).locator('.mwg-mixed-cb[value="sub1"]').check();
  await setSel(p, 0, 'count', '40');
  await p.page.click('#mwgFillDownBtn');
  const e2 = entry(p, 1);
  const checked = await e2.locator('.mwg-mixed-cb:checked').count(); const count = await e2.locator('select[name="count"]').inputValue();
  check(checked === 2 && count === '40', `Fill Down keeps the mixed subset (checked ${checked}) and count (${count})`);
  check(p.errors.length === 0, '0 page errors'); await p.close();
}
// 3. Saved grade-5 mixed roster at count 40 reloads at 40, prints 40 cells, and Duplicate keeps 40.
{
  const student = { name: 'Avi', number: '1', grade: '5', type: 'mixed', count: '40', mixedTypes: ['add1', 'sub1', 'add2'], fracOps: null, decOps: null };
  const payload = { inputMode: 'standard', worksheetsPerStudent: '1', answerKey: false, removeNumber: false, nameBlank: false, advancedInput: '', students: [student, { ...student, name: 'Dina', number: '2' }] };
  const p = await open({ storage: { mwgRosterData_v2: JSON.stringify(payload) } });
  await p.page.waitForTimeout(100);
  const counts = await p.page.$$eval('.mwg-student-entry select[name="count"]', s => s.map(x => x.value));
  check(counts.join() === '40,40', `saved mixed roster restores count 40 (${counts})`);
  await entry(p, 0).locator('.mwg-duplicate-link').click();
  const dup = await p.page.$$eval('.mwg-student-entry select[name="count"]', s => s.map(x => x.value));
  check(dup.length === 3 && dup.every(v => v === '40'), `Duplicate keeps count 40 (${dup})`);
  const sheets = await generate(p); const cells = await cellCounts(p);
  check(sheets === 3 && cells.every(c => c === 40), `generated sheets carry 40 problems (${cells})`);
  check(p.errors.length === 0, '0 page errors'); await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nroster-subset: ${fails.length} failing` : '\nroster-subset: all green');
process.exit(fails.length ? 1 : 0);
