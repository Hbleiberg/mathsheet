// Probe (loop S29; found S10, pass C on index.html; approved S10 at gate 6): on index.html's stacked grids the long-division
// divisor shares the dividend's baseline, as the twins' has since 2b678e1 (`.mwg-division-divisor` padding-top 8 → 5 px: the
// bracket's 2 px border, 2 px padding and the dividend's 1 px; it sat 3 px low). Under print (the page's own move to body),
// seeded, keys on, through Advanced: Division Levels 1–5 at 30 and 60, grade 3–4 Mixed at 30–60 (their 50 / 60 keys draw
// their own bar, S8), Mixed[div2|div3], Long Division and a grade 5 Mixed (written across, level since S25). Checks:
//   - every bracket on the sheets and the over-the-bar keys: divisor and dividend baselines within 0.1 px;
//   - the own-bar keys (rows-10 / rows-12) draw exactly as before, divisor included (that drawing is its own gate-6 item);
//   - every problem box and bracket exactly where the reference puts it (only the divisor's glyphs move); every sheet
//     1056 × 816; the across divisions as before.
// Fails before the change (`--control`: the reference, 878b342 unless `--ref`, as the page under test).
//   node scripts/loop/probes/S29-index-divisor.mjs [--ref <commit>] [--control]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const args = process.argv.slice(2), opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const REF = opt('--ref') || '878b342', CONTROL = args.includes('--control');
const SEED = `(() => { let s = 777; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const LINES = [
  ...['div1', 'div2', 'div3', 'div4', 'div5'].flatMap(t => [30, 60].map(c => `${t}, ${c}, 5`)),
  ...[[3, 30], [3, 60], [4, 40], [4, 50], [4, 60]].map(([g, c]) => `mixed, ${c}, ${g}`),
  'mixed[div2|div3], 60, 4', 'mixed[div1|add1], 50, 3', 'longdivision, 30, 5', 'mixed, 30, 5',
].map((l, i) => `S${i + 1}, ${i + 1}, ${l};`).join('\n');
let failing = 0;
const check = (ok, msg) => { if (!ok) failing++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); };
const srv = await serve(); const browser = await launch();

async function run(body) {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (body) await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  await p.page.click(p.spec.modeToggle); await p.page.setChecked(p.spec.key, true);
  await p.page.fill(p.spec.advanced, LINES);
  const n = await p.prints(); await p.page.click(p.spec.generate); await p.page.waitForFunction(n => window.__prints > n, n);
  await p.page.emulateMedia({ media: 'print' });
  const out = await p.page.evaluate(() => {
    const r = document.querySelector('#mwgResults'); r.id = 'mwg-results-print'; document.body.appendChild(r);
    const base = el => { const m = document.createElement('span'); m.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; el.appendChild(m); const y = m.getBoundingClientRect().top; el.removeChild(m); return y; };
    return [...document.querySelectorAll('.mwg-worksheet, .mwg-answer-key-sheet')].map(s => {
      const sb = s.getBoundingClientRect(); const rel = b => [b.left - sb.left, b.top - sb.top, b.width, b.height].map(v => Math.round(v * 100) / 100);
      return { w: Math.round(sb.width), h: Math.round(sb.height), key: s.classList.contains('mwg-answer-key-sheet'),
        probs: [...s.querySelectorAll('.mwg-division-problem')].map(d => {
          const dv = d.querySelector('.mwg-division-divisor'), dd = d.querySelector('.mwg-division-dividend');
          const across = !!d.closest('.mwg-horiz-problem, .mwg-horiz-cell');
          // the own-bar key: no .mwg-division-bracket; its dividend is the column's second span
          const ownBar = !d.querySelector('.mwg-division-bracket');
          const dividend = dd || d.children[1].children[1];
          const box = (ownBar ? d.children[1] : d.querySelector('.mwg-division-bracket')).getBoundingClientRect();
          return { kind: ownBar ? 'own-bar' : across ? 'across' : 'stacked', delta: Math.round((base(dv) - base(dividend)) * 100) / 100,
            prob: rel(d.getBoundingClientRect()), bracket: rel(box), divisor: rel(dv.getBoundingClientRect()) };
        }) };
    });
  });
  const errors = p.errors.slice(); await p.close(); return { sheets: out, errors };
}

const ref = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8' });
const now = await run(CONTROL ? ref : null), before = await run(ref);
console.log(`index.html${CONTROL ? ` (control: ${REF})` : ''}: ${now.sheets.length} sheets and keys`);
const probs = now.sheets.flatMap(s => s.probs), refProbs = before.sheets.flatMap(s => s.probs);
const by = k => probs.filter(x => x.kind === k), worst = list => Math.max(0, ...list.map(x => Math.abs(x.delta)));
const level = probs.filter(x => x.kind !== 'own-bar'), refLevel = refProbs.filter(x => x.kind !== 'own-bar');
check(now.sheets.length === before.sheets.length && now.sheets.every(s => s.w === 1056 && s.h === 816), `${now.sheets.length} sheets and keys, all 1056×816`);
check(by('stacked').length > 1000 && worst(by('stacked')) <= 0.1, `${by('stacked').length} stacked brackets (sheets and keys): divisor and dividend baselines within 0.1 px (worst ${worst(by('stacked')).toFixed(2)}; ${REF}: ${worst(refProbs.filter(x => x.kind === 'stacked')).toFixed(2)})`);
check(by('across').length > 50 && worst(by('across')) <= 0.1, `${by('across').length} across: level (worst ${worst(by('across')).toFixed(2)})`);
const ownMoved = probs.filter((x, i) => x.kind === 'own-bar' && JSON.stringify([x.prob, x.bracket, x.divisor, x.delta]) !== JSON.stringify([refProbs[i].prob, refProbs[i].bracket, refProbs[i].divisor, refProbs[i].delta]));
check(by('own-bar').length > 50 && !ownMoved.length, `${by('own-bar').length} own-bar keys draw exactly as on ${REF}, divisor included (${ownMoved.length} moved; their divisor ${by('own-bar')[0] ? by('own-bar')[0].delta.toFixed(2) : '—'} px from the dividend's baseline)`);
const moved = probs.filter((x, i) => !refProbs[i] || JSON.stringify(x.prob) !== JSON.stringify(refProbs[i].prob) || JSON.stringify(x.bracket) !== JSON.stringify(refProbs[i].bracket));
check(probs.length === refProbs.length && !moved.length, `every problem box and bracket exactly where ${REF} puts it (${moved.length} of ${probs.length} moved)`);
check(probs.every(x => x.divisor[1] >= x.prob[1] - 0.01), `every divisor's box inside its problem's`);
check(!now.errors.length, `0 page errors (${now.errors.join('; ')})`);
console.log(`S29-index-divisor: ${failing ? failing + ' failing' : 'all green'}`);
await browser.close(); await srv.close();
process.exit(failing ? 1 : 0);
