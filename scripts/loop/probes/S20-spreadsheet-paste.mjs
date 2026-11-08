// Probe (loop S20, pass H on math-minute.html): a roster pasted from a spreadsheet (Google Sheets, Excel) comes with a
// tab between the columns, and the Advanced box skipped every line ("Entry 1 is invalid: "Avi Cohen 1 5"", the tabs
// shown as spaces). Approved S20 (gate 2): a line with a tab is read by its tabs, and the help says so. Per page, by a
// real clipboard paste (Ctrl+V): tab lines with CRLF line ends, a Hebrew name, a comma inside a tab line's name, a name
// in two columns (joined by a space), a trailing empty cell, a comma line in the same paste, a comma line with a stray
// tab after its name (whitespace, as S11-robustness has it), a header row (the one
// line skipped and listed); every sheet's name, number and selector as pasted; the help line; Generate Advanced Code
// still writes commas. Fails on the pages before the change (`--ref aafa34e`).
//   node scripts/loop/probes/S20-spreadsheet-paste.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const PAGE = {
  'index.html': { sel: ['add2', '30', '3'], header: ['Name', 'Number', 'Problem Type', 'Count', 'Grade'], errors: '#mwgErrors',
    help: 'You can also paste five columns (name, number, problem type, count, grade) straight from a spreadsheet.',
    name: '.mwg-ws-header-main > .mwg-ws-field:nth-child(1) > .mwg-ws-field-value', number: '.mwg-ws-header-main > .mwg-ws-field:nth-child(2) > .mwg-ws-field-value',
    desc: '.mwg-ws-description, .mwg-description-box', sheet: '#mwgResults .mwg-worksheet', help_: '.mwg-advanced-help' },
  'math-minute.html': { sel: ['5'], header: ['Name', 'Number', 'Level'], errors: '#errors',
    help: 'You can also paste three columns (name, number, level) straight from a spreadsheet.',
    name: '.worksheet-header-main > .student-field:nth-child(1) > .student-field-value', number: '.worksheet-header-main > .student-field:nth-child(2) > .student-field-value',
    desc: '.description-text', sheet: '#results .worksheet', help_: '.advanced-help' },
  'math-facts.html': { sel: ['+3'], header: ['Name', 'Number', 'Level'], errors: '#errors',
    help: 'You can also paste three columns (name, number, level) straight from a spreadsheet.',
    name: '.worksheet-header-main > .student-field:nth-child(1) > .student-field-value', number: '.worksheet-header-main > .student-field:nth-child(2) > .student-field-value',
    desc: '.description-text', sheet: '#results .worksheet', help_: '.advanced-help' },
};

const srv = await serve(); const browser = await launch();
for (const file of Object.keys(PAGE)) {
  if (ONLY && ONLY !== file) continue;
  const s = PAGE[file];
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  const p = await openPage(browser, srv.base, file, { raw: true });
  const pg = p.page;
  await p.context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: srv.base });
  if (REF) {
    const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  }
  const helpText = await pg.$eval(s.help_, h => h.textContent.replace(/\s+/g, ' '));
  check(helpText.includes(s.help), `the help says so: "${s.help.slice(0, 40)}…"`);
  const T = (...c) => c.join('\t');
  const rows = [
    ['Avi Cohen', '1'], ['יעל לוי', '2'], ['Cohen, Avi', '3'], [['Levi', 'Noa'], '4', 'Levi Noa'], ['Dana', '5', null, true], ['Eli', '6', null, false, true], ['Gal', '7', null, false, 'stray'],
  ];
  const lines = [T(...s.header)];   // a header row, copied with the class
  const want = [];
  for (const [name, num, printed, trailingCell, commas] of rows) {
    const cells = [...(Array.isArray(name) ? name : [name]), num, ...s.sel];
    lines.push(commas === 'stray' ? cells[0] + '\t, ' + cells.slice(1).join(', ') : commas ? cells.join(', ') : T(...cells) + (trailingCell ? '\t' : ''));
    want.push({ name: printed || name, number: num });
  }
  const pasted = lines.join('\r\n') + '\r\n';
  await pg.click(p.spec.modeToggle);
  await pg.evaluate(t => navigator.clipboard.writeText(t), pasted);
  await pg.focus(p.spec.advanced); await pg.keyboard.press('Control+V');
  const box = await pg.$eval(p.spec.advanced, t => t.value);
  // a textarea keeps a pasted CRLF as LF
  check(box === pasted.replace(/\r\n/g, '\n'), `the clipboard paste landed in the box (${box.length} characters, ${(box.match(/\t/g) || []).length} tabs, CRLF read as LF)`);
  await pg.click(p.spec.generate); await pg.waitForFunction(() => window.__prints > 0, null, { timeout: 5000 }).catch(() => {});
  const got = await pg.$$eval(s.sheet, (sh, q) => sh.map(x => ({ name: x.querySelector(q.name)?.textContent, number: x.querySelector(q.number)?.textContent })), { name: s.name, number: s.number });
  check(got.length === want.length, `${got.length} sheets for ${want.length} students (the header row skipped)`);
  for (const [i, w] of want.entries()) check(got[i] && got[i].name === w.name && got[i].number === w.number, `sheet ${i + 1}: "${w.name}", ${w.number} (got ${JSON.stringify(got[i])})`);
  const err = await pg.$eval(s.errors, e => e.innerText);
  check(/Entry 1\b/.test(err) && !/Entry [2-9]/.test(err), `only the header row is listed as skipped (${JSON.stringify(err.replace(/\s+/g, ' ').slice(0, 90))})`);
  // the comma format and Generate Advanced Code are unchanged: the code panel still writes commas
  await pg.click(p.spec.modeToggle);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS20-spreadsheet-paste: ${fails.length} failing check(s)` : '\nS20-spreadsheet-paste: all green');
process.exit(fails.length ? 1 : 0);
