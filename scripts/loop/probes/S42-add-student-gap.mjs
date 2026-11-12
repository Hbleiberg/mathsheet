// Probe (loop S42; found S18, measured again S39 and S41): Add Student counts on from the last row whose Student Number
// is a number, a number for each row after it. It carried on the last row's Number only, so a blank last row or one like
// "14B" stopped the count, and the default rows 2 and 3 are blank: a teacher who numbered Student 1 alone got 19 empty
// Numbers (S39). Per page, by real clicks on Add Student: Student 1's "1" with rows 2 and 3 blank → 4, and 19 clicks
// number 4…22; 1, 2, 3 → 4 as before; 1, 2 and a blank → 4; 13, "14B", blank → 16; " 9 " last → 10; no number in any
// row → empty; the new row's name and level empty; the rows above unchanged; 0 page errors.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S42-add-student-gap.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const IDS = {
  'index.html':       { add: '#mwgAddStudentBtn', level: 'select[name="grade"]' },
  'math-minute.html': { add: '#addStudentButton', level: 'select[name="level"]' },
  'math-facts.html':  { add: '#addStudentButton', level: 'select[name="level"]' },
};
// [the three default rows' Numbers, the new row's Number wanted, what it shows]
const CASES = [
  [['1', '', ''], '4', 'Student 1 numbered alone, rows 2 and 3 blank'],
  [['1', '2', '3'], '4', '1, 2, 3 (as before)'],
  [['1', '2', ''], '4', '1, 2 and a blank row'],
  [['13', '14B', ''], '16', '13, "14B" and a blank row'],
  [['', '', ' 9 '], '10', 'a last " 9 " (as before)'],
  [['', '', ''], '', 'no Number in any row (as before)'],
  [['Blue', 'Red', ''], '', 'only words (as before)'],
];

const srv = await serve(); const browser = await launch();
try {
  for (const [file, id] of Object.entries(IDS)) {
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const p = await openPage(browser, srv.base, file, { raw: true });
    const { page, spec } = p;
    page.on('dialog', d => d.accept());
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    }
    const ROW = `${spec.students} ${spec.entry}`;
    const rows = () => page.$$eval(ROW, (es, lv) => es.map(e => ({ name: e.querySelector('input[name="studentName"]').value,
      number: e.querySelector('input[name="studentNumber"]').value, level: e.querySelector(lv).value })), id.level);
    for (const [nums, want, what] of CASES) {
      await page.reload({ waitUntil: 'load' }); await page.waitForSelector(ROW);
      for (let i = 0; i < 3; i++) await page.fill(`${ROW}:nth-child(${i + 1}) input[name="studentNumber"]`, nums[i]);
      await page.click(id.add);
      const all = await rows(), r = all[3];
      check(all.length === 4 && r.number === want && r.name === '' && r.level === '' && JSON.stringify(all.slice(0, 3).map(x => x.number)) === JSON.stringify(nums),
        `${what}: the new row reads ${JSON.stringify(r.number)} (want ${JSON.stringify(want)}), name and level empty, the rows above as typed`);
    }
    // a class of 22 from Student 1's "1" alone
    await page.reload({ waitUntil: 'load' }); await page.waitForSelector(ROW);
    await page.fill(`${ROW}:nth-child(1) input[name="studentNumber"]`, '1');
    for (let k = 0; k < 19; k++) await page.click(id.add);
    const nums = (await rows()).map(r => r.number);
    const wantNums = ['1', '', '', ...Array.from({ length: 19 }, (_, i) => String(i + 4))];
    check(JSON.stringify(nums) === JSON.stringify(wantNums), `Student 1's "1" and Add Student × 19: ${nums.slice(0, 6).join(',')}…${nums.slice(-2).join(',')} (want 1,,,4…22)`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS42-add-student-gap: ${fails.length} failing check(s)` : '\nS42-add-student-gap: all green');
process.exit(fails.length ? 1 : 0);
