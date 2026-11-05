// S10 probe: index.html's Rounding problems print on one line (approved S4, gate 6; the answer blank took 60 % of
// the cell, so every problem wrapped and the 15 rows ran to 806–816 px, the paper's edge). Seeded, under print
// (the page's own move-to-body trick): Rounding at grades 5–8 with keys, Mixed at 5 and 8 (rounding in the pool),
// and Decimals and a stacked level as identity controls. Every rounding problem is one line on sheets and keys,
// its answer blank still ≥ 150 px, the rounding sheets' last row ends ≤ 793 px (as the other across types'); the control
// sheets are byte-identical to the reference. `--ref <commit>` (2b678e1, the commit before the fix); `--control` runs the reference as the page
// under test, which must fail.
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';
const args = process.argv.slice(2), flag = f => args.includes(f), opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
// The reference defaults to 2b678e1, the commit before the fix: HEAD once a32d3fa landed, so "wrapped before" read 0 (S11).
const REF = opt('--ref') || '2b678e1', CONTROL = flag('--control');
const SEED = `(() => { let s = 4040; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const ROSTER = ['R5, 1, rounding, 30, 5;', 'R6, 2, rounding, 30, 6;', 'R7, 3, rounding, 30, 7;', 'R8, 4, rounding, 30, 8;',
  'M5, 5, mixed, 40, 5;', 'M8, 6, mixed, 30, 8;', 'D6, 7, decimals, 30, 6;', 'A2, 8, add2, 60, 2;'].join('\n');
const srv = await serve(); const browser = await launch();
let failing = 0;
const check = (ok, msg) => { if (!ok) failing++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); };

async function run(body) {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (body) await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' });
  await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  await p.page.click(p.spec.modeToggle); await p.page.setChecked(p.spec.key, true);
  await p.page.fill(p.spec.advanced, ROSTER);
  const n = await p.prints(); await p.page.click(p.spec.generate); await p.page.waitForFunction(n => window.__prints > n, n);
  await p.page.emulateMedia({ media: 'print' });
  const out = await p.page.evaluate(() => {
    const r = document.querySelector('#mwgResults'); r.id = 'mwg-results-print'; document.body.appendChild(r);
    return [...document.querySelectorAll('.mwg-worksheet, .mwg-answer-key-sheet')].map(s => {
      const sb = s.getBoundingClientRect();
      const desc = s.querySelector('.mwg-ws-desc-text').textContent;
      const cells = [...s.querySelectorAll('.mwg-horiz-cell')].filter(c => /^Round /.test(c.querySelector('.mwg-horiz-problem').textContent.trim()));
      // the grid box itself always reaches the body's bottom (height 100%): the ink is the cells' and their children's
      const ink = Math.max(...[...s.querySelectorAll('.mwg-horiz-cell, .mwg-horiz-cell *, .mwg-problem-cell, .mwg-problem-cell *')].filter(e => e.getClientRects().length).map(e => e.getBoundingClientRect().bottom - sb.top), 0);
      return { desc, w: Math.round(sb.width), h: Math.round(sb.height), ink: Math.round(ink), html: s.outerHTML,
        rounding: cells.map(c => { const pr = c.querySelector('.mwg-horiz-problem'), cs = getComputedStyle(pr), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
          const blank = c.querySelector('.mwg-horiz-answer'); return { lines: Math.round(pr.getBoundingClientRect().height / lh), blank: blank ? Math.round(blank.getBoundingClientRect().width) : null, text: pr.textContent.trim() }; }) };
    });
  });
  await p.close(); return out;
}

const ref = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8' });
const now = await run(CONTROL ? ref : null), before = await run(ref);
console.log(`index.html${CONTROL ? ` (control: ${REF})` : ''}`);
const cells = now.flatMap(s => s.rounding), refCells = before.flatMap(s => s.rounding);
const wrapped = cells.filter(c => c.lines !== 1), refWrapped = refCells.filter(c => c.lines !== 1);
check(now.length === 16 && now.every(s => s.w === 1056 && s.h === 816), `${now.length} sheets and keys, all 1056×816`);
check(cells.length >= 240 && refWrapped.length > 100, `${cells.length} rounding problems seen (${REF}: ${refWrapped.length} of ${refCells.length} on two lines)`);
check(!wrapped.length, `every rounding problem on one line, sheets and keys (${wrapped.length} wrap${wrapped.length ? ': "' + wrapped[0].text + '"' : ''})`);
const blanks = cells.filter(c => c.blank !== null).map(c => c.blank);
check(Math.min(...blanks) >= 150, `the answer blank keeps ≥ 150 px (${Math.min(...blanks)}–${Math.max(...blanks)} px; ${REF}: ${Math.min(...refCells.filter(c => c.blank !== null).map(c => c.blank))}–${Math.max(...refCells.filter(c => c.blank !== null).map(c => c.blank))})`);
const rs = now.filter(s => /Rounding/.test(s.desc)), refRs = before.filter(s => /Rounding/.test(s.desc));
check(rs.length === 8 && Math.max(...rs.map(s => s.ink)) <= 793, `the 8 Rounding sheets' ink ends by 793 px (worst ${Math.max(...rs.map(s => s.ink))}; ${REF}: ${Math.max(...refRs.map(s => s.ink))})`);
const ctl = now.map((s, i) => [s, before[i]]).filter(([s]) => !s.rounding.length);
check(ctl.length >= 4 && ctl.every(([a, b]) => a.html === b.html), `${ctl.length} sheets without rounding byte-identical to ${REF} (${ctl.filter(([a, b]) => a.html !== b.html).length} differ)`);
console.log(`S10-rounding-one-line: ${failing ? failing + ' failing' : 'all green'}`);
await browser.close(); await srv.close();
process.exit(failing ? 1 : 0);
