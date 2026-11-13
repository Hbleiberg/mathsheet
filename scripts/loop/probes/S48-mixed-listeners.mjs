// Probe (loop S48, pass A; found S1): index.html's Include-in-Mixed panel answers its checkboxes with one change handler
// on the panel, not one listener per checkbox (34 at grade 6, added again at every build: a grade change, Fill Down, a
// row made or restored as Mixed). The panel keeps every behaviour: a horizontal type ticked caps the count at 30, a
// Fractions / Decimals box ticks or clears its operations, an operation ticked ticks its box and the last one cleared
// clears it, Select All / Deselect All / All Operations. By real clicks on a grade 6 Mixed row, then again after the
// grade changes to 7 and back (two more builds):
//   - the change listeners the page adds inside a Mixed panel, counted by an addEventListener hook (the panel is built
//     before it joins the page): none (each checkbox had its own);
//   - after every one of 20 steps, the ticks, the count's options and its value, identical to the page before the change;
//   - 0 page errors.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S48-mixed-listeners.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const HOOK = () => {
  window.__mixedAdds = {};
  const add = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opt) {
    if (this.closest && this.closest('.mwg-mixed-types')) window.__mixedAdds[type] = (window.__mixedAdds[type] || 0) + 1;
    return add.call(this, type, fn, opt);
  };
};
const ROW = '#mwgStudentsContainer .mwg-student-entry:first-child';
const box = `${ROW} .mwg-mixed-types`;
const cb = v => `${box} input[value="${v}"]`;
const STEPS = [
  ['Deselect All', pg => pg.click(`${box} .mwg-mixed-deselect-all`)],
  ['count 60', pg => pg.selectOption(`${ROW} [name="count"]`, '60')],
  ['tick Rounding (a horizontal type)', pg => pg.click(cb('rounding'))],
  ['clear Rounding', pg => pg.click(cb('rounding'))],
  ['count 60 again', pg => pg.selectOption(`${ROW} [name="count"]`, '60')],
  ['tick the Fractions box', pg => pg.click(cb('fractions'))],
  ['clear it', pg => pg.click(cb('fractions'))],
  ['tick frac ×', pg => pg.click(cb('fractions-mul'))],
  ['clear frac ×', pg => pg.click(cb('fractions-mul'))],
  ['tick dec + and dec −', async pg => { for (const v of ['decimals-add', 'decimals-sub']) await pg.click(cb(v)); }],
  ['All Operations (Decimals)', pg => pg.click(`${box} .mwg-dec-all`)],
  ['Select All', pg => pg.click(`${box} .mwg-mixed-select-all`)],
  ['clear Addition Level 1', pg => pg.click(cb('add1'))],
  ['clear frac ×', pg => pg.click(cb('fractions-mul'))],
  ['clear the other four fraction operations', async pg => { for (const v of ['fractions-add', 'fractions-sub', 'fractions-divf', 'fractions-divw']) await pg.click(cb(v)); }],
  ['grade 7', pg => pg.selectOption(`${ROW} [name="grade"]`, '7')],
  ['grade 6 again', pg => pg.selectOption(`${ROW} [name="grade"]`, '6')],
  ['clear the Decimals box', pg => pg.click(cb('decimals'))],
  ['tick dec ÷ dec', pg => pg.click(cb('decimals-divd'))],
  ['All Operations (Fractions) after clearing frac +', async pg => { await pg.click(cb('fractions-add')); await pg.click(`${box} .mwg-frac-all`); }],
];
const state = pg => pg.evaluate(({ row, box }) => {
  const b = document.querySelector(box), c = document.querySelector(row + ' [name="count"]');
  return [...b.querySelectorAll('input[type="checkbox"]')].map(i => (i.checked ? '+' : '-') + i.value).join(' ') +
    ` | count ${c.value} of [${[...c.options].map(o => o.value).join(',')}]`;
}, { row: ROW, box });

async function run(browser, base, ref) {
  const p = await openPage(browser, base, 'index.html', { raw: true });
  const pg = p.page;
  await p.context.addInitScript(HOOK);
  if (ref) {
    const body = execSync(`git show ${ref}:index.html`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    await pg.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(ROW, { state: 'attached' });
  await pg.selectOption(`${ROW} [name="grade"]`, '6');
  await pg.selectOption(`${ROW} [name="problemType"]`, 'mixed');
  const out = { states: [await state(pg)], boxes: await pg.$$eval(`${box} input[type="checkbox"]`, l => l.length) };
  for (const [, act] of STEPS) { await act(pg); out.states.push(await state(pg)); }
  out.adds = await pg.evaluate(() => window.__mixedAdds);
  out.errors = p.errors.slice(); await p.close(); return out;
}

const BEFORE = execSync('git log -1 --format=%h -S"box.onchange = function" -- index.html', { cwd: ROOT, encoding: 'utf8' }).trim();
const OLD = BEFORE ? `${BEFORE}~1` : 'HEAD';
const srv = await serve(); const browser = await launch();
try {
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}; before the change: ${OLD}`);
  const now = await run(browser, srv.base, REF);
  check(now.boxes > 30 && now.states.length === STEPS.length + 1, `a grade 6 Mixed panel of ${now.boxes} checkboxes, ${STEPS.length} steps read`);
  check(!now.adds.change, `no change listener added inside a Mixed panel over three builds (${now.adds.change || 0}; click listeners ${now.adds.click || 0}, for its buttons)`);
  const cnt = k => now.states[k].split(' | ')[1];
  check(new Set(now.states).size > 10 && /^count 60 /.test(cnt(2)) && /^count 30 of \[30\]$/.test(cnt(3)) && /^count 30 of \[,/.test(cnt(4)) && /^count 30 of \[30\]$/.test(cnt(6)) && /^count 30 of \[,/.test(cnt(7)),
    `the steps change what they should (60, then Rounding: "${cnt(3)}", cleared: "${cnt(4)}"; the Fractions box: "${cnt(6)}", cleared: "${cnt(7)}")`);
  check(now.errors.length === 0, `0 page errors (${now.errors.join('; ')})`);
  if (!REF) {
    const old = await run(browser, srv.base, OLD);
    const off = STEPS.map(([name], i) => old.states[i + 1] !== now.states[i + 1] ? name : null).filter(Boolean);
    check(old.states[0] === now.states[0] && off.length === 0, `every step leaves the ticks and the count as ${OLD} does (${off.length} differ: ${off.join('; ')}; ${old.adds.change} change listeners there)`);
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS48-mixed-listeners: ${fails.length} failing check(s)` : '\nS48-mixed-listeners: all green');
process.exit(fails.length ? 1 : 0);
