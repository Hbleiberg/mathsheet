// Probe (loop S48, pass A; found S1): index.html builds a Fractions or Decimals row's Operations panel once. A row made
// with its operations (a saved roster restored, Duplicate, Fill Down) built the panel with every operation ticked
// (`updateOpsPanel`) and then again with its own (`renderOpsPanel`); the saved ones are now passed into the first
// build. Every write to a panel's innerHTML is counted (a setter hook: the rows are built before they join the page),
// by real clicks where there are clicks:
//   - restoring a saved roster of 14 rows (Fractions and Decimals with and without their own operations, Addition,
//     Mixed): one write a panel, the rows with operations included; the roster's markup byte-identical to the page
//     before the change, every saved operation ticked, and a Save writes the operations back as loaded;
//   - Duplicate on a Decimals row with two operations, and Fill Down from a Fractions row with two over five empty rows:
//     one write a panel each, the copies' markup identical to before;
//   - 0 page errors.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S48-ops-render.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const KEY = 'mwgRosterData_v2';
const row = (i, grade, type, count, extra = {}) => ({ name: `Student ${i}`, number: String(i), grade: String(grade), type, count: String(count),
  mixedTypes: null, fracOps: null, decOps: null, ...extra });
const STUDENTS = [
  row(1, 6, 'fractions', 30, { fracOps: ['fractions-add', 'fractions-mul'] }),
  row(2, 5, 'fractions', 20, { fracOps: ['fractions-sub'] }),
  row(3, 7, 'decimals', 30, { decOps: ['decimals-mulw', 'decimals-divd'] }),
  row(4, 8, 'decimals', 20, { decOps: ['decimals-add'] }),
  row(5, 6, 'fractions', 30),
  row(6, 6, 'decimals', 30),
  row(7, 3, 'add1', 30), row(8, 5, 'sub4', 40),
  row(9, 6, 'mixed', 30, { mixedTypes: ['add1', 'fractions-add', 'decimals-sub'] }),
  row(10, 8, 'fractions', 30, { fracOps: ['fractions-divf', 'fractions-divw', 'fractions-add'] }),
  row(11, 7, 'decimals', 30, { decOps: ['decimals-sub', 'decimals-muld', 'decimals-divw'] }),
  row(12, 5, 'fractions', 30, { fracOps: ['fractions-add', 'fractions-sub', 'fractions-mul', 'fractions-divf', 'fractions-divw'] }),
  row(13, 4, 'add2', 30), row(14, 2, 'mul1', 30),
];
const OWN = STUDENTS.filter(s => s.fracOps || s.decOps).length;
const PAYLOAD = { [KEY]: JSON.stringify({ inputMode: 'standard', worksheetsPerStudent: '1', answerKey: false, removeNumber: false,
  nameBlank: false, advancedInput: '', students: STUDENTS }) };
const HOOK = () => {
  window.__opsWrites = 0;
  const d = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', { configurable: true, get: d.get,
    set(v) { if (this.classList && this.classList.contains('mwg-ops-panel')) window.__opsWrites++; return d.set.call(this, v); } });
};

async function open(browser, base, ref, storage) {
  const p = await openPage(browser, base, 'index.html', { raw: true, storage });
  await p.context.addInitScript(HOOK);
  if (ref) {
    const body = execSync(`git show ${ref}:index.html`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  return p;
}
const roster = pg => pg.evaluate(() => {
  const c = document.getElementById('mwgStudentsContainer');
  return { html: c.outerHTML, checked: [...c.querySelectorAll('.mwg-ops-panel input:checked')].map(i => i.value).join(','),
    panels: [...c.querySelectorAll('.mwg-ops-panel')].map(p => p.className + ':' + p.querySelectorAll('input').length).join(',') };
});
const writes = pg => pg.evaluate(() => window.__opsWrites);
const firstDiff = (a, b) => { if (a === b) return ''; let i = 0; while (i < a.length && a[i] === b[i]) i++; return ` — first difference: ${JSON.stringify(a.slice(Math.max(0, i - 60), i + 40))} vs ${JSON.stringify(b.slice(Math.max(0, i - 60), i + 40))}`; };

const BEFORE = REF ? null : (execSync('git log -1 --format=%h -S"function updateOpsPanel(entryDiv, checkedFrac, checkedDec)" -- index.html', { cwd: ROOT, encoding: 'utf8' }).trim() || null);
const OLD = BEFORE ? `${BEFORE}~1` : 'HEAD';
const srv = await serve(); const browser = await launch();
try {
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}; before the change: ${OLD}`);
  async function run(ref) {
    const out = {};
    // restore
    const p = await open(browser, srv.base, ref, PAYLOAD);
    const pg = p.page;
    out.rows = (await pg.$$('#mwgStudentsContainer .mwg-student-entry')).length;
    out.restore = await writes(pg); out.restored = await roster(pg);
    await pg.click('#mwgSaveBtn');
    out.saved = await pg.evaluate(k => JSON.parse(localStorage.getItem(k)).students.map(s => [s.fracOps, s.decOps]), KEY);
    // Duplicate on row 3 (Decimals, two operations)
    let w = await writes(pg);
    await pg.click('#mwgStudentsContainer .mwg-student-entry:nth-child(3) .mwg-duplicate-link');
    out.duplicate = await writes(pg) - w; out.afterDup = await roster(pg);
    out.errors = p.errors.slice(); await p.close();
    // Fill Down from a Fractions row with two operations over five empty rows
    const q = await open(browser, srv.base, ref, { [KEY]: JSON.stringify({ inputMode: 'standard', worksheetsPerStudent: '1', answerKey: false,
      removeNumber: false, nameBlank: false, advancedInput: '', students: [STUDENTS[0], ...[2, 3, 4, 5, 6].map(i => ({ name: '', number: String(i), grade: '', type: '', count: '' }))] }) });
    w = await writes(q.page);
    await q.page.click('#mwgFillDownBtn');
    out.fill = await writes(q.page) - w; out.afterFill = await roster(q.page);
    out.errors.push(...q.errors); await q.close();
    return out;
  }
  const now = await run(REF);
  check(now.rows === STUDENTS.length && now.restored.checked.split(',').length > 10, `the saved roster restores ${now.rows} rows, ${now.restored.checked.split(',').length} operations ticked`);
  check(now.restore === STUDENTS.length, `restoring: one write a panel (${now.restore} for ${STUDENTS.length} rows, ${OWN} with their own operations)`);
  // the page writes a row's operations in the menu's order: compare them as sets
  const sorted = list => JSON.stringify(list.map(r => r.map(o => o && [...o].sort())));
  const wantSaved = sorted(STUDENTS.map(s => [s.type === 'fractions' ? (s.fracOps || ['fractions-add', 'fractions-sub', 'fractions-mul', 'fractions-divf', 'fractions-divw']) : null,
    s.type === 'decimals' ? (s.decOps || ['decimals-add', 'decimals-sub', 'decimals-mulw', 'decimals-muld', 'decimals-divw', 'decimals-divd']) : null]));
  check(sorted(now.saved) === wantSaved, `Save writes back every row's operations as loaded (a row with none saved: all of them)${firstDiff(sorted(now.saved), wantSaved)}`);
  check(now.duplicate === 1, `Duplicate on a Decimals row with two operations: ${now.duplicate} write`);
  check(now.fill === 5, `Fill Down from a Fractions row with two operations over five rows: ${now.fill} writes`);
  check(now.errors.length === 0, `0 page errors (${now.errors.join('; ')})`);
  if (!REF) {
    const old = await run(OLD);
    check(old.restore > now.restore && old.restored.html === now.restored.html, `the restored roster's markup byte-identical to ${OLD}'s (${old.restore} writes there)${firstDiff(now.restored.html, old.restored.html)}`);
    check(old.afterDup.html === now.afterDup.html && old.afterFill.html === now.afterFill.html, `after Duplicate and Fill Down the roster byte-identical to ${OLD}'s (${old.duplicate} and ${old.fill} writes there)`);
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS48-ops-render: ${fails.length} failing check(s)` : '\nS48-ops-render: all green');
process.exit(fails.length ? 1 : 0);
