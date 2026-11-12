// Probe (loop S40, found in pass M on index.html): a row's Fractions or Decimals operations are the ones ticked in its
// own Operations panel. A row that was Mixed keeps its Mixed panel, hidden, whose Fractions and Decimals boxes carry the
// panel's classes, and `getSelectedOps` read the whole row: a grade 6 row moved from Mixed to Fractions with Addition
// alone ticked printed 20 of 30 problems with −, × or ÷, listed every operation twice in Generate Advanced Code and
// saved them all, so the reload ticked them again. Per type (Fractions, Decimals), grade 6, Math.random seeded, two of
// the operations ticked (Addition and a multiplication): reached directly, after Mixed, and after a Mixed panel with
// its own picks changed, the sheet's operators are those two and both appear; the code names those two; Save Roster and
// a reload tick those two; Duplicate copies them. A row moved from Fractions to Mixed gives the code a fresh Mixed row
// gives. The direct route's sheets are byte-identical to the page before the change. 0 page errors.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S40-hidden-mixed-ops.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = () => { let a = 20261112; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const fixAt = execSync('git log -1 --format=%h -S"querySelectorAll(\\".mwg-ops-panel \\" + cbClass)" -- index.html', { cwd: ROOT, encoding: 'utf8' }).trim();
const BEFORE = fixAt ? `${fixAt}~1` : 'HEAD';
const ROW = '#mwgStudentsContainer .mwg-student-entry', S1 = `${ROW}:nth-child(1)`;
const TYPES = {
  fractions: { pick: ['fractions-add', 'fractions-mul'], ops: { '+': 'fractions-add', '−': 'fractions-sub', '×': 'fractions-mul', '÷': 'fractions-div' } },
  decimals: { pick: ['decimals-add', 'decimals-mulw'], ops: { '+': 'decimals-add', '−': 'decimals-sub', '×': 'decimals-mul', '÷': 'decimals-div' } },
};
const ROUTES = ['directly', 'after Mixed', 'after Mixed with its own picks'];

async function open(browser, base, ref) {
  const p = await openPage(browser, base, 'index.html', { raw: true });
  await p.page.addInitScript(SEED);
  if (ref) {
    const body = execSync(`git show ${ref}:index.html`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  p.page.on('dialog', d => d.accept());
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(S1);
  await p.page.evaluate(() => { const r = document.querySelectorAll('#mwgStudentsContainer .mwg-student-entry'); r[1].remove(); r[2].remove(); });
  return p;
}
const ticked = (page, sel) => page.$$eval(`${sel} .mwg-ops-panel input[type=checkbox]:checked`, cbs => cbs.map(c => c.value));
const operators = page => page.$$eval('#mwgResults > *', sheets => sheets.filter(s => !/answer-key/.test(s.className)).map(s => {
  s.style.contentVisibility = 'visible'; const t = s.querySelector('.mwg-ws-body, .mwg-horiz-grid, .mwg-problems-grid') ? s.innerText : s.innerText;
  const o = {}; for (const k of ['+', '−', '×', '÷']) o[k] = (t.match(new RegExp(k === '+' ? '\\+' : k, 'g')) || []).length; s.style.contentVisibility = ''; return o; }));
async function generate(page) {
  await page.click('#mwgGenerateBtn'); await page.waitForFunction(n => window.__prints > n, (await page.evaluate(() => window.__prints || 0)) - 1);
  return { html: await page.$eval('#mwgResults', r => r.innerHTML), ops: await operators(page) };
}
async function code(page) { await page.click('#mwgGenCodeBtn'); const c = await page.$eval('#mwgCodeOutput', e => e.value.trim()); await page.click('#mwgCloseModal'); return c; }

async function route(page, type, how) {
  await page.selectOption(`${S1} [name="grade"]`, '6');
  if (how !== 'directly') {
    await page.selectOption(`${S1} [name="problemType"]`, 'mixed');
    if (how === 'after Mixed with its own picks') await page.evaluate(([sel, type]) => {   // the Mixed panel keeps the division ops alone
      document.querySelectorAll(`${sel} .mwg-mixed-types .mwg-${type === 'fractions' ? 'frac' : 'dec'}-op-cb`).forEach(cb => { cb.checked = /div/.test(cb.value); });
    }, [S1, type]);
  }
  await page.selectOption(`${S1} [name="problemType"]`, type);
  await page.evaluate(([sel, pick]) => { document.querySelectorAll(`${sel} .mwg-ops-panel input[type=checkbox]`).forEach(cb => { cb.checked = pick.includes(cb.value); }); }, [S1, TYPES[type].pick]);
}

const srv = await serve(); const browser = await launch();
try {
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}; before: ${BEFORE}`);
  for (const [type, T] of Object.entries(TYPES)) {
    const want = Object.keys(T.ops).filter(k => T.pick.some(v => v.startsWith(T.ops[k])));
    for (const how of ROUTES) {
      const p = await open(browser, srv.base, REF); const { page } = p;
      await route(page, type, how);
      const g = await generate(page);
      const seen = ['+', '−', '×', '÷'].filter(k => g.ops.some(o => o[k] > 0));
      check(g.ops.length === 1 && seen.join('') === want.join(''), `${type} ${how}: ${T.pick.join(' and ')} ticked, the sheet's operators ${seen.join(' ')} (${JSON.stringify(g.ops[0])})`);
      const c = await code(page);
      check(c === `, , ${type}[${T.pick.join('|')}], 30, 6;`, `${type} ${how}: Generate Advanced Code "${c}"`);
      await page.click(`${S1} .mwg-duplicate-link`);
      check((await ticked(page, `${ROW}:nth-child(2)`)).join('|') === T.pick.join('|'), `${type} ${how}: Duplicate's copy ticks ${(await ticked(page, `${ROW}:nth-child(2)`)).join(', ')}`);
      await page.click('#mwgSaveBtn');
      await page.reload({ waitUntil: 'load' }); await page.waitForSelector(S1);   // the same context: its storage
      const back = await ticked(page, S1);
      check(back.join('|') === T.pick.join('|'), `${type} ${how}: Save Roster and a reload tick ${back.join(', ')}`);
      if (how === 'directly' && !REF) {
        const was = await open(browser, srv.base, BEFORE); await route(was.page, type, how);
        const old = await generate(was.page);
        check(g.html.length > 5000 && g.html === old.html, `${type} directly: the sheet byte-identical to ${BEFORE}'s (${g.html.length} chars)`);
        await was.close();
      }
      check(p.errors.length === 0, `${type} ${how}: 0 page errors (${p.errors.length})`);
      await p.close();
    }
    // the other way: a row that was Fractions / Decimals, then Mixed, gives the code a fresh Mixed row gives
    const p = await open(browser, srv.base, REF), f = await open(browser, srv.base, REF);
    await route(p.page, type, 'directly'); await p.page.selectOption(`${S1} [name="problemType"]`, 'mixed');
    await f.page.selectOption(`${S1} [name="grade"]`, '6'); await f.page.selectOption(`${S1} [name="problemType"]`, 'mixed');
    const a = await code(p.page), b = await code(f.page);
    check(a === b && /mixed\[/.test(a), `${type}, then Mixed: the code a fresh Mixed row gives (${a.length} chars)`);
    await p.close(); await f.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS40-hidden-mixed-ops: ${fails.length} failing check(s)` : '\nS40-hidden-mixed-ops: all green');
process.exit(fails.length ? 1 : 0);
