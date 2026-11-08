// Probe (loop S21; found S6, pass G on index.html, approved S6 at gate 2): a fraction subtraction drew both fractions
// from 1…d−1 on its own, so 27 % of "Fractions — Subtraction" problems took a fraction from itself (x − x = 0) and a
// denominator of 2 always gave ½ − ½; the Fractions type's own subtractions (grades 5–8) the same. The approved shape:
// subtraction takes away a smaller fraction; addition unchanged. Pasted as Advanced entries, 3,000 problems a
// selector: no subtraction of a fraction from itself, none over 2, the larger fraction first, each denominator 3…12
// (3…9 in the Fractions type) still drawn; additions still sum to exactly 1 about as often as before (a control on
// "unchanged"); the key's answers are the S6 audit's to check. Fails before the change (`--ref 516b2d4`).
//   node scripts/loop/probes/S21-fraction-sub.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const FILE = 'index.html';
const SELECTORS = [
  { sel: 'fractions[sub], 30, 6', name: 'Fractions — Subtraction (grade 6)', dens: [3, 12] },
  { sel: 'fractions, 30, 5', name: 'Fractions, grade 5 (+ and −)', dens: [3, 9] },
  { sel: 'fractions, 30, 8', name: 'Fractions, grade 8 (+, − and ×)', dens: [3, 9] },
  { sel: 'fractions[add], 30, 6', name: 'Fractions — Addition (grade 6), unchanged', dens: null },
];

const srv = await serve(); const browser = await launch();
const p = await openPage(browser, srv.base, FILE, { raw: true });
const pg = p.page;
console.log(`${FILE}${REF ? ` (served from ${REF})` : ''}`);
if (REF) {
  const body = execSync(`git show ${REF}:${FILE}`, { cwd: ROOT, encoding: 'utf8' });
  await pg.route(new RegExp(`/${FILE.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
}
await pg.click(p.spec.modeToggle);
for (const s of SELECTORS) {
  console.log(` ${s.name}`);
  await pg.fill('#mwgAdvancedBox', Array.from({ length: 100 }, (_, i) => `S${i + 1}, ${i + 1}, ${s.sel}`).join('\n'));
  const before = await pg.evaluate(() => window.__prints || 0);
  await pg.click('#mwgGenerateBtn'); await pg.waitForFunction(b => window.__prints > b, before);
  const probs = await pg.$$eval('#mwgResults .mwg-horiz-problem', cells => cells.map(c => {
    const f = [...c.querySelectorAll('.mwg-fraction')].map(x => [+x.querySelector('.mwg-fraction-num').textContent, +x.querySelector('.mwg-fraction-den').textContent]);
    return { f, op: (c.textContent.match(/[+−×]/) || [''])[0] };
  }));
  check(probs.length === 3000 && probs.every(q => q.f.length === 2), `3,000 problems, two fractions each (${probs.length})`);
  const subs = probs.filter(q => q.op === '−'), adds = probs.filter(q => q.op === '+');
  const same = subs.filter(q => q.f[0][0] === q.f[1][0]).length, halves = subs.filter(q => q.f[0][1] === 2).length;
  const order = subs.filter(q => q.f[0][0] < q.f[1][0] || q.f[0][1] !== q.f[1][1]).length;
  const ones = adds.filter(q => q.f[0][0] + q.f[1][0] === q.f[0][1]).length;
  console.log(`    ${subs.length} subtractions (${same} x − x, ${halves} over 2), ${adds.length} additions (${ones} summing to 1)`);
  if (s.dens) {
    check(subs.length > 900, `subtractions dealt (${subs.length})`);
    check(same === 0, `no fraction taken from itself (${same} of ${subs.length})`);
    check(halves === 0, `none over a denominator of 2, which has only ½ − ½ (${halves})`);
    check(order === 0, `the larger fraction first, one denominator (${order} not)`);
    const dens = new Set(subs.map(q => q.f[0][1]));
    check(Math.min(...dens) === s.dens[0] && Math.max(...dens) === s.dens[1] && dens.size === s.dens[1] - s.dens[0] + 1, `every denominator ${s.dens[0]}…${s.dens[1]} still drawn (${[...dens].sort((a, b) => a - b).join(',')})`);
  }
  if (adds.length) check(ones / adds.length > 0.15 && ones / adds.length < 0.45, `additions unchanged: about a quarter to a third sum to 1 (${(100 * ones / adds.length).toFixed(1)} %)`);
}
check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
await p.close(); await browser.close(); await srv.close();
console.log(fails.length ? `\nS21-fraction-sub: ${fails.length} failing check(s)` : '\nS21-fraction-sub: all green');
process.exit(fails.length ? 1 : 0);
