// Probe (loop S21, pass H on math-facts.html; found S20 on math-minute.html): Fill Down's message, which since S20 names
// the rows that kept their own level, landed in the status box under the Generate buttons, ~2,900 px below the button
// with 22 rows, out of sight. Per page, with 22 rows and one on its own level: after the click the message sits beside
// the button, inside the viewport, in a polite live region, and the status box under the roster stays empty; a typed
// name, a changed level and Add Student each clear it (the rows it names by number would go stale); a phone (390 px)
// shows it beside the button with no sideways scroll. Fails before the change (`--ref caedad5`).
//   node scripts/loop/probes/S21-fill-down-status.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const TWIN = { button: '#fillDownButton', status: '#fillDownStatus', box: '#statusMessages', add: '#addStudentButton', entry: '#studentsContainer .student-entry',
  name: 'input[name="studentName"]', own: async (pg, row) => pg.selectOption(`#studentsContainer .student-entry:nth-child(${row}) select[name="level"]`, { index: 3 }) };
const PAGE = {
  'math-minute.html': { ...TWIN, msg: 'Level filled down from Student 1. Student 7 kept its own level.' },
  'math-facts.html': { ...TWIN, msg: 'Level filled down from Student 1. Student 7 kept its own level.' },
  'index.html': { button: '#mwgFillDownBtn', status: '#mwgFillDownStatus', box: '#mwgStatus', add: '#mwgAddStudentBtn', entry: '#mwgStudentsContainer .mwg-student-entry',
    name: 'input[name="studentName"]', msg: 'Settings filled down from Student 1. Student 7 kept its own settings.',
    own: async (pg, row) => pg.selectOption(`#mwgStudentsContainer .mwg-student-entry:nth-child(${row}) select[name="count"]`, '40') },
};

const srv = await serve(); const browser = await launch();
for (const file of Object.keys(PAGE)) {
  if (ONLY && ONLY !== file) continue;
  const s = PAGE[file];
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  for (const phone of [false, true]) {
    const p = await openPage(browser, srv.base, file);   // the harness fills the three default rows with one setting
    const pg = p.page;
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(s.entry, { state: 'attached' }); await p.spec.prepare(pg);
    }
    if (phone) await pg.setViewportSize({ width: 390, height: 844 });
    const where = phone ? ' (390 px)' : '';
    for (let n = await pg.$$eval(s.entry, e => e.length); n < 22; n++) await pg.click(s.add);
    await pg.click(s.button);   // the new rows take Student 1's setting
    await s.own(pg, 7);         // Student 7 on its own (an IEP)
    check(await pg.$$eval(s.entry, e => e.length) === 22, `22 rows${where}`);
    await pg.click(s.button);
    await pg.waitForTimeout(100);
    const m = await pg.evaluate(({ status, button, box }) => {
      const el = document.querySelector(status), b = document.querySelector(button).getBoundingClientRect();
      const r = el && el.getBoundingClientRect();
      return { text: el ? el.textContent.trim() : null, live: el && el.getAttribute('aria-live'), top: r && r.top, bottom: r && r.bottom, left: r && r.left, right: r && r.right,
        btnTop: b.top, btnBottom: b.bottom, vh: innerHeight, vw: innerWidth, sideways: document.documentElement.scrollWidth > innerWidth,
        box: document.querySelector(box).textContent.trim() };
    }, { status: s.status, button: s.button, box: s.box });
    check(m.text === s.msg, `the message beside the button${where} ("${m.text}")`);
    check(m.text !== null && m.top >= 0 && m.bottom <= m.vh && m.left >= 0 && m.right <= m.vw, `it is on screen where the click was${where} (top ${m.top | 0}, viewport ${m.vh})`);
    check(m.text !== null && Math.abs((m.top + m.bottom) / 2 - (m.btnTop + m.btnBottom) / 2) < (phone ? 60 : 20), `level with the button${where} (message ${m.top | 0}–${m.bottom | 0}, button ${m.btnTop | 0}–${m.btnBottom | 0})`);
    check(m.live === 'polite', `a polite live region${where} (${m.live})`);
    check(!m.box.includes('filled down'), `the status box under the roster stays clear of it${where} ("${m.box.slice(0, 50)}")`);
    check(!m.sideways, `no sideways scroll${where}`);
    if (phone) { await p.close(); continue; }
    const text = () => pg.evaluate(sel => { const el = document.querySelector(sel); return el ? el.textContent.trim() : null; }, s.status);
    await pg.click(`${s.entry}:nth-child(2) ${s.name}`); await pg.keyboard.type('Noa');
    check(await text() === '', `a typed name clears it ("${await text()}")`);
    await pg.click(s.button); await s.own(pg, 9);
    check(await text() === '', `a changed setting clears it ("${await text()}")`);
    await pg.click(s.button); await pg.click(s.add);
    check(await text() === '', `Add Student clears it ("${await text()}")`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
    await p.close();
  }
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS21-fill-down-status: ${fails.length} failing check(s)` : '\nS21-fill-down-status: all green');
process.exit(fails.length ? 1 : 0);
