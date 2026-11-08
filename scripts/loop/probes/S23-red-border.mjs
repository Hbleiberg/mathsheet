// Probe (loop S23; found S17, pass M on math-facts.html; seen again on math-minute.html's S23 contact sheet): after the
// validation box's Fix, a Level kept its red "missing" border once the teacher filled it, until the next Generate (all
// three still red with every level set, Fill Down's included). On the twins a highlighted Level loses its red when it
// gets a value: picked by mouse or keyboard (a change event) or by Fill Down (no event); a Level still empty, or a name
// typed beside it, keeps it; Generate & Print with every level set prints with no box. index.html's half is queued.
// Fails before the change (`--ref af59ae5`).
//   node scripts/loop/probes/S23-red-border.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const srv = await serve(); const browser = await launch();
const red = pg => pg.$$eval('#studentsContainer select[name="level"]', s => s.map(x => /204, ?0, ?0/.test(x.style.border) || getComputedStyle(x).borderTopColor === 'rgb(204, 0, 0)'));
for (const file of ['math-minute.html', 'math-facts.html']) {
  const p = await openPage(browser, srv.base, file, { raw: true }), pg = p.page;
  if (REF) {
    const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector('#studentsContainer .student-entry', { state: 'attached' });
  }
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  await pg.click('#addStudentButton');   // four rows
  await pg.click(p.spec.generate);
  check(await pg.isVisible('#mmValidationBox'), 'Generate with no levels shows the validation box');
  check((await red(pg)).join() === 'true,true,true,true', `all four Levels red (${await red(pg)})`);
  await pg.click('#mmValidationFix'); await pg.waitForTimeout(300);
  const row = n => `#studentsContainer .student-entry:nth-child(${n})`;
  await pg.fill(`${row(2)} input[name="studentName"]`, 'Noa Levi');
  check((await red(pg))[1] === true, 'a name typed beside an empty Level leaves it red');
  await pg.selectOption(`${row(1)} select[name="level"]`, { index: 3 });
  check((await red(pg)).join() === 'false,true,true,true', `the Level picked loses its red, the rest keep theirs (${await red(pg)})`);
  await pg.focus(`${row(4)} select[name="level"]`); await pg.keyboard.press('ArrowDown');
  check((await red(pg)).join() === 'false,true,true,false', `a Level picked from the keyboard loses its red (${await red(pg)})`);
  await pg.click('#fillDownButton');
  check((await red(pg)).join() === 'false,false,false,false', `Fill Down's Levels lose their red (${await red(pg)})`);
  await pg.click(p.spec.generate); await pg.waitForFunction(() => window.__prints > 0, null, { timeout: 10000 });
  check(!(await pg.isVisible('#mmValidationBox')) && (await pg.$$eval('#results .worksheet', w => w.length)) === 4, 'Generate & Print then prints the four sheets with no box');
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS23-red-border: ${fails.length} failing check(s)` : '\nS23-red-border: all green');
process.exit(fails.length ? 1 : 0);
