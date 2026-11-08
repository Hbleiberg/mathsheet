// Probe (loop S22; found S21, pass H on math-facts.html; approved S21 at gate 2): Excel and Google Sheets store a typed
// "+3" as the number 3, so a level column pasted from a spreadsheet reads "Avi Cohen 1 3" and every line was skipped as
// "invalid fact code" with no reason. A code that is a bare whole number is still skipped (nothing guessed), and its
// line now adds "A spreadsheet turns +3 into 3: type it as '+3 there, or fix it here."; any other bad code is listed as
// before, without it; good lines print. Tab columns (the spreadsheet) and commas both. Fails before the change
// (`--ref a458824`).
//   node scripts/loop/probes/S22-spreadsheet-hint.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const FILE = 'math-facts.html';
const HINT = "A spreadsheet turns +3 into 3: type it as '+3 there, or fix it here.";
const LINES = [
  ['Avi Cohen\t1\t3', 'hint'], ['Noa Levi\t2\t10', 'hint'], ['Sam Green, 3, 30', 'hint'], ['יעל לוי\t4\t0', 'hint'],
  ['Eli Stern, 5, fr10', 'plain'], ['Dana Katz\t6\tplus 3', 'plain'], ['Ari Gold, 7, 3.5', 'plain'], ['Tamar Roth, 8, -3x', 'plain'],
  ['Maya Weiss\t9\t+3', 'prints'], ['Ben Adler, 10, Doubles', 'prints'], ['Lior Paz\t11\t-3', 'prints'],
];

const srv = await serve(); const browser = await launch();
const p = await openPage(browser, srv.base, FILE, { raw: true });
const pg = p.page;
console.log(`${FILE}${REF ? ` (served from ${REF})` : ''}`);
if (REF) {
  const body = execSync(`git show ${REF}:${FILE}`, { cwd: ROOT, encoding: 'utf8' });
  await pg.route(new RegExp(`/${FILE.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
}
await pg.click(p.spec.modeToggle);
await pg.fill(p.spec.advanced, LINES.map(l => l[0]).join('\n'));
await pg.click(p.spec.generate); await pg.waitForFunction(() => window.__prints > 0, null, { timeout: 10000 });
const names = await pg.$$eval('#results .worksheet', w => w.map(x => x.querySelector('.student-field-value').textContent));
const listed = (await pg.$eval('#errors', e => e.innerText)).split('\n').filter(l => /^Entry \d+/.test(l));
LINES.forEach(([line, want], i) => {
  const name = line.split(/\t|, /)[0];
  const msg = listed.find(l => l.startsWith(`Entry ${i + 1} `)) || '';
  if (want === 'prints') { check(names.includes(name) && !msg, `"${line.replace(/\t/g, ' ⇥ ')}" prints`); return; }
  check(!names.includes(name) && msg.includes('invalid fact code'), `"${line.replace(/\t/g, ' ⇥ ')}" skipped and listed`);
  if (want === 'hint') check(msg.endsWith(HINT), `  …with the spreadsheet's reason ("${msg.slice(-72)}")`);
  else check(!msg.includes('spreadsheet'), `  …without the spreadsheet's reason (not a whole number)`);
});
check(names.length === 3, `3 sheets, nothing guessed (${names.length})`);
check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
await p.close(); await browser.close(); await srv.close();
console.log(fails.length ? `\nS22-spreadsheet-hint: ${fails.length} failing check(s)` : '\nS22-spreadsheet-hint: all green');
process.exit(fails.length ? 1 : 0);
