// Probe (loop S24; found S17, pass M on math-facts.html; the twins' half shipped S23, 2597f1c): after the validation
// box's Fix, a Grade, Type or Count on index.html kept its red "missing" border once the teacher filled it, until the
// next Generate (9 still red with every field filled, S17). Now a highlighted field loses its red when it holds a
// value — picked by mouse or keyboard (a change event), set by the grade's own update of its Type list, or by Fill
// Down (no event) — and a field still empty keeps it. After every step each of the 12 fields is red exactly when it is
// empty; a name typed beside empty fields changes nothing; Generate & Print with every field filled prints with no box.
// Fails before the change (`--ref d31ff06`).
//   node scripts/loop/probes/S24-index-red-border.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const FILE = 'index.html';
const srv = await serve(); const browser = await launch();
const p = await openPage(browser, srv.base, FILE, { raw: true }), pg = p.page;
if (REF) {
  const body = execSync(`git show ${REF}:${FILE}`, { cwd: ROOT, encoding: 'utf8' });
  await pg.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
}
console.log(`${FILE}${REF ? ` (served from ${REF})` : ''}`);
const FIELDS = '#mwgStudentsContainer .mwg-student-entry select[name="grade"], #mwgStudentsContainer .mwg-student-entry select[name="problemType"], #mwgStudentsContainer .mwg-student-entry select[name="count"]';
// every field: [row, name, red, empty]
const state = () => pg.$$eval(FIELDS, fs => fs.map(f => {
  const rows = [...document.querySelectorAll('#mwgStudentsContainer .mwg-student-entry')];
  return [rows.indexOf(f.closest('.mwg-student-entry')) + 1, f.name, /204, ?0, ?0/.test(f.style.border), !f.value];
}));
const show = s => s.filter(f => f[2]).map(f => `${f[0]}:${f[1]}`).join(' ') || 'none';
async function redIffEmpty(step) {
  const s = await state();
  const wrong = s.filter(f => f[2] !== f[3]);
  check(s.length === 12 && wrong.length === 0, `${step}: red exactly where empty (${wrong.length} wrong${wrong.length ? ': ' + wrong.map(f => `${f[0]}:${f[1]} ${f[2] ? 'red, filled' : 'empty, not red'}`).join(', ') : ''}; red ${show(s)})`);
}
const row = n => `#mwgStudentsContainer .mwg-student-entry:nth-child(${n})`;
await pg.click('#mwgAddStudentBtn');   // four rows
await pg.click('#mwgGenerateBtn');
check(await pg.isVisible('#mwgValidationBox'), 'Generate with nothing set shows the validation box');
check((await state()).filter(f => f[2]).length === 12, `all 12 fields red (${(await state()).filter(f => f[2]).length})`);
await pg.click('#mwgValidationFix'); await pg.waitForTimeout(300);
await pg.fill(`${row(2)} input[name="studentName"]`, 'Noa Levi');
check((await state()).filter(f => f[0] === 2 && f[2]).length === 3, 'a name typed beside empty fields leaves them red');
await pg.selectOption(`${row(1)} select[name="grade"]`, '3');
await redIffEmpty('row 1 picks Grade 3 by mouse');
const type1 = await pg.$eval(`${row(1)} select[name="problemType"]`, s => [...s.options].find(o => o.value && o.value !== 'mixed').value);
await pg.selectOption(`${row(1)} select[name="problemType"]`, type1);
await redIffEmpty(`row 1 picks the type "${type1}"`);
const count1 = await pg.$eval(`${row(1)} select[name="count"]`, s => s.value || [...s.options].find(o => o.value).value);
if (!(await pg.$eval(`${row(1)} select[name="count"]`, s => s.value))) await pg.selectOption(`${row(1)} select[name="count"]`, count1);
await redIffEmpty('row 1 complete');
check((await state()).filter(f => f[0] === 1 && f[2]).length === 0, 'row 1 has no red left');
// row 4 by keyboard: Grade, then its Type and Count
for (const name of ['grade', 'problemType', 'count']) {
  await pg.focus(`${row(4)} select[name="${name}"]`); await pg.keyboard.press('ArrowDown');
  await redIffEmpty(`row 4 picks its ${name} from the keyboard`);
}
await pg.click('#mwgFillDownBtn');
await redIffEmpty('Fill Down');
check((await state()).every(f => !f[2] && !f[3]), `every field filled and none red after Fill Down (red ${show(await state())})`);
await pg.click('#mwgGenerateBtn'); await pg.waitForFunction(() => window.__prints > 0, null, { timeout: 10000 });
check(!(await pg.isVisible('#mwgValidationBox')) && (await pg.$$eval('#mwgResults .mwg-worksheet', w => w.length)) === 4, 'Generate & Print then prints the four sheets with no box');
check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
await p.close(); await browser.close(); await srv.close();
console.log(fails.length ? `\nS24-index-red-border: ${fails.length} failing check(s)` : '\nS24-index-red-border: all green');
process.exit(fails.length ? 1 : 0);
