// Probe (loop S19; found S18, pass H): Fill Down copied Student 1's level over every row, an IEP or an advanced
// student's included, with no warning and no undo. Approved S18 (gate 2): when rows set to another level would
// change, ask first, "Fill Down will change Students 4 and 5, which have their own settings. Continue?"; rows that
// are empty or already match fill as before, with no question. On math-minute.html and math-facts.html; index.html's
// half (its grade / type / count rows) is queued.
// Arms, per page: two rows with their own level → the question names them, Cancel changes nothing and says nothing,
// OK fills every row and says so; only empty and matching rows → no question; one row → the singular; three → "2, 3
// and 4"; Student 1 with no level → the rows it would blank are named.
// Fails on the pages before the change (`--ref bf9f2c7`).
//   node scripts/loop/probes/S19-fill-down.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const LEVEL = '#studentsContainer .student-entry select[name="level"]';

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
  let asked = [], answer = false;
  pg.on('dialog', d => { asked.push(d.message()); answer ? d.accept() : d.dismiss(); });
  await pg.click('#addStudentButton'); await pg.click('#addStudentButton');   // 5 rows
  const opts = await pg.$eval(LEVEL, s => [...s.options].map(o => o.value).filter(Boolean));
  const [A, B, C] = [opts[0], opts[3], opts[6]];
  check(opts.length > 6, `level options read (${opts.length}; A=${A} B=${B} C=${C})`);
  const set = levels => pg.evaluate(([sel, v]) => [...document.querySelectorAll(sel)].forEach((s, i) => { s.value = v[i]; }), [LEVEL, levels]);
  const read = () => pg.$$eval(LEVEL, v => v.map(s => s.value));
  const status = () => pg.$eval('#statusMessages', b => b.textContent.trim());
  const fill = async (ok) => { asked = []; answer = ok; await pg.evaluate(() => { document.getElementById('statusMessages').innerHTML = ''; }); await pg.click('#fillDownButton'); await pg.waitForTimeout(100); };

  await set([A, '', A, B, C]);
  await fill(false);
  check(asked.length === 1 && asked[0] === 'Fill Down will change Students 4 and 5, which have their own settings. Continue?', `own levels: the question names Students 4 and 5 (${JSON.stringify(asked)})`);
  check(JSON.stringify(await read()) === JSON.stringify([A, '', A, B, C]) && await status() === '', `Cancel: nothing changes, nothing said (${JSON.stringify(await read())}, "${await status()}")`);
  await fill(true);
  check(JSON.stringify(await read()) === JSON.stringify([A, A, A, A, A]) && /filled down from Student 1/.test(await status()), `OK: every row filled and said so (${JSON.stringify(await read())}, "${await status()}")`);

  await set([B, '', B, '', B]);
  await fill(false);
  check(asked.length === 0 && JSON.stringify(await read()) === JSON.stringify([B, B, B, B, B]), `only empty and matching rows: no question, filled (${JSON.stringify(asked)}, ${JSON.stringify(await read())})`);

  await set([A, A, C, '', A]);
  await fill(false);
  check(asked[0] === 'Fill Down will change Student 3, which has its own settings. Continue?', `one row: the singular (${JSON.stringify(asked)})`);

  await set([A, B, C, B, '']);
  await fill(false);
  check(asked[0] === 'Fill Down will change Students 2, 3 and 4, which have their own settings. Continue?', `three rows: "2, 3 and 4" (${JSON.stringify(asked)})`);

  await set(['', B, '', C, '']);
  await fill(false);
  check(asked[0] === 'Fill Down will change Students 2 and 4, which have their own settings. Continue?' && JSON.stringify(await read()) === JSON.stringify(['', B, '', C, '']),
    `Student 1 with no level: the rows it would blank are named, Cancel keeps them (${JSON.stringify(asked)})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS19-fill-down: ${fails.length} failing check(s)` : '\nS19-fill-down: all green');
process.exit(fails.length ? 1 : 0);
