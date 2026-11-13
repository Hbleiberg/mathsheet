// Probe (loop S47; found S12, pass D): a field the validation box marks red is also marked invalid for a screen
// reader (`aria-invalid="true"`), on all three pages, and loses it with the red. Before, the red border was the only
// mark: a screen reader heard "missing Level" in the alert but met every field as valid. Per page, from the untouched
// first paint (the first row filled, the others empty), by real clicks:
//   - Generate & Print raises the box: the red fields are exactly the `aria-invalid` ones, as many as the accessibility
//     tree reports invalid, the filled row none (the handle resolves: at least one red field);
//   - a marked field given a value loses both marks, the others keep them;
//   - Generate & Print again marks anew, the same sets; Generate Anyway clears every mark; Fill Down clears them too;
//   - 0 page errors.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S47-aria-invalid.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const PAGES = {
  'index.html': { entry: '#mwgStudentsContainer .mwg-student-entry', fields: '[name="grade"], [name="problemType"], [name="count"]',
    generate: '#mwgGenerateBtn', anyway: '#mwgValidationGenerate', box: '#mwgValidationBox', fill: '#mwgFillDownBtn', add: '#mwgAddStudentBtn',
    // a select's value, then the next (a grade's types and counts follow it)
    fillRow: async (pg, row) => { for (const [n, v] of [['grade', '3'], ['problemType', 'add1'], ['count', '30']]) {
      const el = (await pg.$$('#mwgStudentsContainer .mwg-student-entry'))[row]; await (await el.$(`[name="${n}"]`)).selectOption(v); } },
    pick: { name: 'grade', value: '4' } },
  'math-minute.html': { entry: '#studentsContainer .student-entry', fields: 'select[name="level"]', generate: '#generatePrintButton',
    anyway: '#mmValidationGenerate', box: '#mmValidationBox', fill: '#fillDownButton', add: '#addStudentButton',
    fillRow: async (pg, row) => { const el = (await pg.$$('#studentsContainer .student-entry'))[row]; await (await el.$('select[name="level"]')).selectOption('3'); },
    pick: { name: 'level', value: '5' } },
  'math-facts.html': { entry: '#studentsContainer .student-entry', fields: 'select[name="level"]', generate: '#generatePrintButton',
    anyway: '#mmValidationGenerate', box: '#mmValidationBox', fill: '#fillDownButton', add: '#addStudentButton',
    fillRow: async (pg, row) => { const el = (await pg.$$('#studentsContainer .student-entry'))[row]; await (await el.$('select[name="level"]')).selectOption('+2'); },
    pick: { name: 'level', value: 'x3' } },
};

async function marks(pg, cdp, s) {
  const dom = await pg.evaluate(({ entry, fields }) => [...document.querySelectorAll(entry)].map(e => [...e.querySelectorAll(fields)].map(f => ({
    red: /204,\s*0,\s*0/.test(f.style.border), aria: f.getAttribute('aria-invalid') }))), { entry: s.entry, fields: s.fields });
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const ax = nodes.filter(n => !n.ignored && (n.properties || []).some(p => p.name === 'invalid' && p.value && p.value.value === 'true')).length;
  const flat = dom.flat();
  return { red: flat.filter(f => f.red).length, aria: flat.filter(f => f.aria === 'true').length, ax,
    same: flat.every(f => f.red === (f.aria === 'true')) && flat.every(f => f.aria === null || f.aria === 'true'),
    firstRow: dom[0].filter(f => f.red || f.aria).length, rows: dom.length };
}

const srv = await serve(); const browser = await launch();
try {
  for (const [file, s] of Object.entries(PAGES)) {
    const p = await openPage(browser, srv.base, file, { raw: true });
    const pg = p.page;
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
      await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(s.entry, { state: 'attached' });
    }
    const cdp = await p.context.newCDPSession(pg);
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    while ((await pg.$$(s.entry)).length < 3) await pg.click(s.add);
    await s.fillRow(pg, 0);
    await pg.click(s.generate); await pg.waitForSelector(s.box, { state: 'visible' });
    let m = await marks(pg, cdp, s);
    check(m.red > 0 && m.firstRow === 0, `the box marks ${m.red} field(s) red over ${m.rows} rows, none on the filled first row`);
    check(m.same && m.aria === m.red && m.ax === m.red, `every red field and only those aria-invalid (${m.aria} of ${m.red}; the accessibility tree: ${m.ax} invalid)`);
    // a marked field given a value: both marks go, the rest stay
    const row2 = (await pg.$$(s.entry))[1];
    await (await row2.$(`[name="${s.pick.name}"]`)).selectOption(s.pick.value);
    const m2 = await marks(pg, cdp, s);
    const left = await row2.$eval(`[name="${s.pick.name}"]`, f => ({ red: f.style.border, aria: f.getAttribute('aria-invalid') }));
    check(!left.red && left.aria === null && m2.same && m2.red === m.red - 1 && m2.ax === m2.red, `Student 2's ${s.pick.name}, picked, loses both marks; ${m2.red} red and ${m2.aria} aria-invalid stay (tree ${m2.ax})`);
    // again, then Generate Anyway
    await pg.click(s.generate); await pg.waitForSelector(s.box, { state: 'visible' });
    const m3 = await marks(pg, cdp, s);
    check(m3.red > 0 && m3.same && m3.ax === m3.red, `Generate & Print again: ${m3.red} red, ${m3.aria} aria-invalid, tree ${m3.ax}`);
    const before = await p.prints();
    await pg.click(s.anyway); await pg.waitForFunction(n => window.__prints > n, before, { timeout: 30000 });
    const m4 = await marks(pg, cdp, s);
    check(m4.red === 0 && m4.aria === 0 && m4.ax === 0, `Generate Anyway clears every mark (${m4.red} red, ${m4.aria} aria-invalid, tree ${m4.ax})`);
    // marked again, then Fill Down from the first row
    await pg.click(s.generate); await pg.waitForSelector(s.box, { state: 'visible' });
    const m5 = await marks(pg, cdp, s);
    await pg.click(s.fill);
    const m6 = await marks(pg, cdp, s);
    check(m5.red > 0 && m5.aria === m5.red && m6.red === 0 && m6.aria === 0 && m6.ax === 0, `Fill Down clears the ${m5.red} mark(s) (${m6.red} red, ${m6.aria} aria-invalid, tree ${m6.ax} after)`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS47-aria-invalid: ${fails.length} failing check(s)` : '\nS47-aria-invalid: all green');
process.exit(fails.length ? 1 : 0);
