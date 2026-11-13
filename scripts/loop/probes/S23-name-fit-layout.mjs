// Probe (loop S23; found S23, pass A on index.html): with "Remove 'Student Number' Field" the name's column is "1fr auto",
// so its room turns on the description beside it and `fitLongNames()` measured one line per description and copy;
// each read laid out its whole sheet (content-visibility), 452 of 572 ms of a generate for 30 students on 30 types × 5
// with keys (2.6 s at a quarter of the speed). Those lines are now measured on copies of their headers, one layout.
// Checks, per shape: the real sheets whose boxes are read while `generate()` runs (the copies not counted) — none with
// the Number removed, no more than before with it shown; every name line's size, line height and text are what 37af5e4
// fitted (Math.random seeded): short, long, floor-cut, Hebrew and empty names, Name blank, 1 and 5 copies, keys, the
// Number shown and removed. `--identity` also compares every sheet's HTML byte for byte with 37af5e4, which proved S23's
// change and decays with every later approved change to the sheet's markup (S24's name wrapper: the S23 trap).
// Times are printed, not asserted. Fails before the change (`--ref 37af5e4`).
//   node scripts/loop/probes/S23-name-fit-layout.mjs [--ref <commit>] [--identity]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, replayLater, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), BASE = '37af5e4', IDENTITY = process.argv.includes('--identity');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const FILE = 'index.html';
const INIT = `(() => { let s = 20231108; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  // the real sheets whose boxes are read while generate runs (a copy taken off the page afterwards is not counted)
  window.__read = new Set(); window.__count = false;
  const g = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () {
    if (window.__count) { const s = this.closest && this.closest('.mwg-worksheet, .mwg-answer-key-sheet'); if (s) window.__read.add(s); }
    return g.apply(this, arguments); };
})();`;
const NAMES = ['Avi Cohen', 'Bartholomew Montgomery-Washington Jr', 'Alexandria Montgomery-Washington the Third of Her Name',
  'יעל לוי', 'אלישבע רחל בת-שבע פרידמן-גולדשטיין הכהן', '', 'Chaya Mushka Schneerson', 'Noa'];

const srv = await serve(); const browser = await launch();
async function open(ref) {
  const p = await openPage(browser, srv.base, FILE, { raw: true });
  await p.context.addInitScript(INIT);
  if (ref) {
    // later approved sheet changes replayed (S42's rule): S47's wider minus in Subtraction 3-5's descriptions leaves a
    // name less room when the Number is removed (its column "1fr auto")
    const body = replayLater(execSync(`git show ${ref}:${FILE}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }));
    await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  return p;
}
// 30 grade × type pairs, every fifth the form offers — on BASE's menus, so every line is valid on both pages: the menus
// since only add (S28's Rounding at grades 3–4), and HEAD's menus put a line BASE skips into the list (red since b60bd4d)
const probe = await open(BASE);
const combos = await probe.page.evaluate(async () => {
  const row = document.querySelector('#mwgStudentsContainer .mwg-student-entry');
  const g = row.querySelector('select[name="grade"]'), t = row.querySelector('select[name="problemType"]'), out = [];
  for (const go of [...g.options].filter(o => o.value)) {
    g.value = go.value; g.dispatchEvent(new Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 0));
    for (const to of [...t.options].filter(o => o.value)) out.push([to.value, go.value]);
  }
  return out.filter((c, i) => i % 5 === 0).slice(0, 30);
});
await probe.close();
const LINES = combos.map(([t, g], i) => `${NAMES[i % NAMES.length]}, ${i + 1}, ${t}, 30, ${g}`);
const SHAPES = [
  { name: '30 types × 5 with keys, the Number removed', copies: '5', key: true, noNum: true, blank: false },
  { name: '30 types × 1 with keys, the Number removed', copies: '1', key: true, noNum: true, blank: false },
  { name: '30 types × 5, the Number removed, Name blank', copies: '5', key: true, noNum: true, blank: true },
  { name: '30 types × 5 with keys, the Number shown', copies: '5', key: true, noNum: false, blank: false },
];
async function run(ref, shape) {
  const p = await open(ref), pg = p.page;
  await pg.click('#mwgToggleModeBtn'); await pg.selectOption('#mwgWorksheetsPerStudent', shape.copies);
  await pg.setChecked('#mwgAnswerKeyToggle', shape.key); await pg.setChecked('#mwgRemoveNumberToggle', shape.noNum);
  await pg.setChecked('#mwgNameBlankToggle', shape.blank);
  await pg.fill('#mwgAdvancedBox', LINES.join('\n'));
  const r = await pg.evaluate(() => {
    window.__read.clear(); window.__count = true;
    const t0 = performance.now(); document.querySelector('#mwgGenerateBtn').click(); const ms = performance.now() - t0;
    window.__count = false;
    const res = document.querySelector('#mwgResults'), sheets = [...res.querySelectorAll('.mwg-worksheet, .mwg-answer-key-sheet')];
    return { ms: Math.round(ms), read: [...window.__read].filter(s => s.isConnected).length, sheets: sheets.length,
      html: sheets.map(s => s.outerHTML), extra: res.children.length - sheets.length,
      names: [...res.querySelectorAll('.mwg-ws-header-main > .mwg-ws-field:first-child > .mwg-ws-field-value')].map(f => (f.getAttribute('style') || '') + '|' + f.textContent),
      shrunk: [...res.querySelectorAll('.mwg-ws-field-value[style]')].length, cut: [...res.querySelectorAll('.mwg-ws-field-value')].filter(f => /…$/.test(f.textContent)).length };
  });
  r.errors = p.errors.slice(); await p.close(); return r;
}
console.log(`${FILE}${REF ? ` (served from ${REF})` : ''}: ${LINES.length} students on ${new Set(combos.map(c => c.join())).size} grade × type pairs`);
for (const shape of SHAPES) {
  console.log(` ${shape.name}`);
  const now = await run(REF, shape), was = await run(BASE, shape);
  console.log(`    ${now.sheets} sheets, ${now.shrunk} names shrunk, ${now.cut} cut at the floor; generate ${now.ms} ms (${BASE}: ${was.ms} ms); real sheets read ${now.read} (${BASE}: ${was.read})`);
  check(now.sheets > 0 && now.sheets === was.sheets, `sheets generated (${now.sheets})`);
  // with the Number removed nothing reads a real sheet (the descriptions are left alone there, S22); with it shown the
  // descriptions' and names' one line per layout, as before
  if (shape.noNum) check(now.read === 0, `no real sheet laid out to fit the names (${now.read}; ${BASE}: ${was.read})`);
  else check(now.read <= was.read, `no more real sheets laid out than before (${now.read}; ${BASE}: ${was.read})`);
  const nameDiff = now.names.findIndex((h, i) => h !== was.names[i]);
  check(now.names.length === now.sheets && nameDiff < 0 && now.names.length === was.names.length, `every name line sized, set and cut as ${BASE} fitted it (${now.names.length} lines${nameDiff >= 0 ? `; line ${nameDiff + 1}: ${now.names[nameDiff]} vs ${was.names[nameDiff]}` : ''})`);
  if (IDENTITY) {
    const diff = now.html.findIndex((h, i) => h !== was.html[i]);
    check(diff < 0 && now.html.length === was.html.length, `every sheet byte for byte as ${BASE} printed it${diff >= 0 ? ` (sheet ${diff + 1} differs)` : ''}`);
  }
  check(now.extra === 0, `nothing left in the results but the sheets (${now.extra})`);
  if (shape.noNum && !shape.blank) check(now.shrunk > 0 && (shape.copies === '1' || now.cut > 0), `the shape has names that shrink (${now.shrunk})${shape.copies === '1' ? '' : ` and names cut at the floor (${now.cut})`}`);
  check(now.errors.length === 0, `0 page errors (${now.errors.join('; ')})`);
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS23-name-fit-layout: ${fails.length} failing check(s)` : '\nS23-name-fit-layout: all green');
process.exit(fails.length ? 1 : 0);
