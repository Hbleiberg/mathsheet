// Probe (loop S20; supersedes S19-fill-down): S19's question ("Fill Down will change Students 2, 3, … 22, which have
// their own settings. Continue?") named every row when the class moved up, and for a new student neither answer
// served (OK reset the IEP row, Cancel left the new row empty). Approved S20 (gate 2): no question; the empty rows
// and the rows still on Student 1's earlier level follow it, a row on its own level keeps it, and the message names
// it ("Level filled down from Student 1. Students 4 and 5 kept their own levels."). Student 1's earlier level is its
// level when made, loaded or last filled down, or the first one picked. On math-minute.html and math-facts.html.
// Arms, per page, by real picks (each fires `change`): a fresh fill; a new row with two exceptions; the class moved
// up; the same after Save and a reload; the singular; a class set by hand, then moved; Student 1 stepped by arrow
// keys; Student 1 empty; never a dialog.
// Fails on the pages before the change (`--ref f14b27e`).
//   node scripts/loop/probes/S20-fill-down.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const LEVEL = '#studentsContainer .student-entry select[name="level"]';
const ROW = n => `#studentsContainer .student-entry:nth-child(${n}) select[name="level"]`;
const MSG = 'Level filled down from Student 1.';

const srv = await serve(); const browser = await launch();
for (const file of ['math-minute.html', 'math-facts.html']) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  const p = await openPage(browser, srv.base, file, { raw: true });
  const pg = p.page;
  if (REF) {
    const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector('.student-entry');
  }
  const asked = [];
  pg.on('dialog', d => { asked.push(d.message()); d.accept(); });
  const fresh = async () => { await pg.evaluate(() => localStorage.clear()); await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector('.student-entry'); };
  const read = () => pg.$$eval(LEVEL, v => v.map(s => s.value));
  const status = () => pg.$eval('#statusMessages', b => b.textContent.trim());
  const fill = async () => { await pg.evaluate(() => { document.getElementById('statusMessages').innerHTML = ''; }); await pg.click('#fillDownButton'); await pg.waitForTimeout(80); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  await pg.click('#addStudentButton'); await pg.click('#addStudentButton');   // 5 rows
  const opts = await pg.$eval(LEVEL, s => [...s.options].map(o => o.value).filter(Boolean));
  const [A, B, C, D, E] = [opts[0], opts[3], opts[6], opts[2], opts[5]];
  check(opts.length > 6, `level options read (${opts.length}; A=${A} B=${B} C=${C} D=${D} E=${E})`);

  // 1. a fresh fill: Student 1 picked, the rest empty
  await pg.selectOption(ROW(1), A); await fill();
  check(same(await read(), [A, A, A, A, A]) && await status() === MSG, `fresh: every row takes Student 1's level ("${await status()}")`);

  // 2. two exceptions, then a new student
  await pg.selectOption(ROW(4), B); await pg.selectOption(ROW(5), C);
  await pg.click('#addStudentButton'); await fill();
  check(same(await read(), [A, A, A, B, C, A]), `new row filled, the two exceptions kept (${(await read()).join(',')})`);
  check(await status() === `${MSG} Students 4 and 5 kept their own levels.`, `the message names them ("${await status()}")`);

  // 3. the class moves up: Student 1 changed, then Fill Down
  await pg.selectOption(ROW(1), D); await fill();
  check(same(await read(), [D, D, D, B, C, D]) && /Students 4 and 5 kept/.test(await status()), `class moved up: rows on the earlier level follow, 4 and 5 kept (${(await read()).join(',')})`);

  // 4. the same after Save Roster and a reload
  await pg.click('#saveRosterButton');
  await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector('.student-entry');
  await pg.selectOption(ROW(1), E); await fill();
  check(same(await read(), [E, E, E, B, C, E]) && /Students 4 and 5 kept/.test(await status()), `after a reload: the saved class follows, 4 and 5 kept (${(await read()).join(',')})`);

  // 5. the singular
  await pg.selectOption(ROW(5), E); await fill();
  check(await status() === `${MSG} Student 4 kept its own level.`, `one row: the singular ("${await status()}")`);

  // 6. a class set by hand, row by row, then Student 1 moved
  await fresh();
  for (const n of [1, 2, 3]) await pg.selectOption(ROW(n), A);
  await pg.selectOption(ROW(1), B); await fill();
  check(same(await read(), [B, B, B]) && await status() === MSG, `set by hand, then moved: every row follows (${(await read()).join(',')}, "${await status()}")`);

  // 7. Student 1 stepped by the arrow keys (a change on every step), then Fill Down
  await pg.focus(ROW(1)); await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('ArrowDown');
  const stepped = (await read())[0];
  await fill();
  check(stepped !== B && same(await read(), [stepped, stepped, stepped]), `stepped two levels by the keyboard (${B} → ${stepped}): every row follows (${(await read()).join(',')})`);

  // 8. Student 1 empty: the rows with a level keep it
  await fresh();
  await pg.click('#addStudentButton'); await pg.click('#addStudentButton');
  await pg.selectOption(ROW(2), B); await pg.selectOption(ROW(4), C); await fill();
  check(same(await read(), ['', B, '', C, '']) && await status() === `${MSG} Students 2 and 4 kept their own levels.`, `Student 1 empty: nothing blanked, 2 and 4 named ("${await status()}")`);

  check(asked.length === 0, `no dialog at any step (${JSON.stringify(asked.slice(0, 2))})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS20-fill-down: ${fails.length} failing check(s)` : '\nS20-fill-down: all green');
process.exit(fails.length ? 1 : 0);
