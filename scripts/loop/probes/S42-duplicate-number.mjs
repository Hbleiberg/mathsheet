// Probe (loop S42; found S41 in pass H on math-minute.html): Duplicate gives its copy the next Student Number only when
// no row holds it. It added 1 to the row's Number wherever the row stood, so Duplicate on Student 2 (2) of 1, 2, 3 gave a
// copy numbered 3 beside Student 3's 3, and both sheets printed "3". Per page, by real clicks on a row's Duplicate:
// 1, 2, 3 → Student 2's copy starts empty, its name and level copied; the last row's copy (3) reads 4; "03" holds 3 as
// well; 1, 2 and two blank rows → Student 2's copy reads 3 (nobody holds it); a wordy "14B" is copied as before;
// 0 page errors. Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S42-duplicate-number.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const IDS = {
  'index.html':       { add: '#mwgAddStudentBtn', dup: '.mwg-duplicate-link', level: 'select[name="grade"]' },
  'math-minute.html': { add: '#addStudentButton', dup: '.duplicate-student-link', level: 'select[name="level"]' },
  'math-facts.html':  { add: '#addStudentButton', dup: '.duplicate-student-link', level: 'select[name="level"]' },
};
// [the rows' Numbers, the row to duplicate (1-based), the copy's Number wanted, what it shows]
const CASES = [
  [['1', '2', '3'], 2, '', 'Student 2 of 1, 2, 3: 3 is Student 3\'s'],
  [['1', '2', '3'], 3, '4', 'the last row (3)'],
  [['1', '2', '03'], 2, '', '"03" holds 3'],
  [['1', '2', '', ''], 2, '3', 'Student 2 of 1, 2 and two blank rows: nobody holds 3'],
  [['1', '14B', '3'], 2, '14B', 'a wordy Number copied as before'],
  [['', '', ''], 1, '', 'no Numbers at all'],
];
const NAMES = ['Avi Cohen', 'Shira Levi', 'Moshe Klein', 'Noa Katz'];

const srv = await serve(); const browser = await launch();
try {
  for (const [file, id] of Object.entries(IDS)) {
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const p = await openPage(browser, srv.base, file);
    const { page, spec } = p;
    page.on('dialog', d => d.accept());
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    }
    const ROW = `${spec.students} ${spec.entry}`;
    const rows = () => page.$$eval(ROW, (es, lv) => es.map(e => ({
      head: e.querySelector('h3').textContent, name: e.querySelector('input[name="studentName"]').value,
      number: e.querySelector('input[name="studentNumber"]').value, level: e.querySelector(lv).value })), id.level);
    for (const [nums, dupRow, want, what] of CASES) {
      await page.reload({ waitUntil: 'load' }); await page.waitForSelector(ROW); await spec.prepare(page);
      while ((await page.$$(ROW)).length < nums.length) await page.click(id.add);
      await spec.prepare(page);
      for (let i = 0; i < nums.length; i++) {
        await page.fill(`${ROW}:nth-child(${i + 1}) input[name="studentName"]`, NAMES[i]);
        await page.fill(`${ROW}:nth-child(${i + 1}) input[name="studentNumber"]`, nums[i]);
      }
      const before = await rows();
      await page.click(`${ROW}:nth-child(${dupRow}) ${id.dup}`);
      const after = await rows(), copy = after[dupRow];
      const others = after.filter((_, i) => i !== dupRow).map(r => r.number);
      check(after.length === nums.length + 1 && copy.number === want && JSON.stringify(others) === JSON.stringify(nums),
        `${what}: the copy reads ${JSON.stringify(copy.number)} (want ${JSON.stringify(want)}); the others ${JSON.stringify(others)}`);
      check(copy.name === before[dupRow - 1].name && copy.level === before[dupRow - 1].level && copy.level !== '' && copy.head === `Student ${dupRow + 1}`,
        `${what}: the copy keeps the name ${JSON.stringify(copy.name)} and level ${JSON.stringify(copy.level)}, headed "${copy.head}"`);
    }
    check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS42-duplicate-number: ${fails.length} failing check(s)` : '\nS42-duplicate-number: all green');
process.exit(fails.length ? 1 : 0);
