// Probe (loop S36; found S35, pass I): a saved roster that parses but fails while the page restores it is kept, not
// deleted. S15's catch covered the whole restore, so any throw after `JSON.parse` (S35's null row on the twins was one)
// cleared the saved class with the unreadable ones. A page bug is planted: the "Worksheets per student" select throws
// when the restore sets it to "3" (an init script, only on a load whose URL carries ?plant). Per page: the planted load
// starts blank with the notice, no page error, and the saved payload stays byte for byte; the next load, the bug gone,
// restores the class — names, Numbers, levels and the 3. S15's unreadable values ("{oops", "null") are still reported
// and cleared. Fails before the change (`--ref c3d8cc2`).
//   node scripts/loop/probes/S36-restore-throw.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, PAGES, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const UNREADABLE = 'The saved roster could not be read, so the page starts with a blank roster.';
const P = {
  'index.html':       { list: 'students', sel: 'select[name="problemType"]', status: '#mwgStatus', lvl: 'add1',
    row: (n, num) => ({ name: n, number: num, grade: '2', type: 'add1', count: '30', mixedTypes: null, fracOps: null, decOps: null }) },
  'math-minute.html': { list: 'standardStudents', sel: 'select[name="level"]', status: '#statusMessages', lvl: '5', row: (n, num) => ({ name: n, number: num, level: '5' }) },
  'math-facts.html':  { list: 'standardStudents', sel: 'select[name="level"]', status: '#statusMessages', lvl: '+3', row: (n, num) => ({ name: n, number: num, level: '+3' }) },
};
// the planted page bug: on a ?plant load, setting the per-student select to "3" throws
const PLANT = () => {
  if (!/[?&]plant\b/.test(location.search)) return;
  const d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  Object.defineProperty(HTMLSelectElement.prototype, 'value', { configurable: true, get() { return d.get.call(this); },
    set(v) { if (/WorksheetsPerStudent$|^worksheetsPerStudent$/.test(this.id) && v === '3') throw new Error('planted restore bug'); d.set.call(this, v); } });
};

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(P)) {
    if (ONLY && ONLY !== file) continue;
    const c = P[file], spec = PAGES[file], key = spec.storageKey;
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const p = await openPage(browser, srv.base, file, { raw: true });
    await p.context.addInitScript(PLANT);
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await p.page.route(new RegExp(`/${file.replace('.', '\\.')}(\\?.*)?$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    }
    const url = `${srv.base}/${file}`;
    const load = async (query, raw) => {
      if (raw !== undefined) await p.page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, raw]);
      await p.page.goto(url + query, { waitUntil: 'load' });
      await p.page.waitForSelector(`${spec.students} ${spec.entry}`, { state: 'attached' });
      await p.page.waitForTimeout(100);
      return p.page.evaluate(([s, sel, st, k, per]) => ({
        rows: [...document.querySelectorAll(s)].map(e => [e.querySelector('input[name="studentName"]').value,
          e.querySelector('input[name="studentNumber"]').value, e.querySelector(sel).value]),
        status: document.querySelector(st).innerText.trim(), left: localStorage.getItem(k), per: document.querySelector(per).value,
      }), [`${spec.students} ${spec.entry}`, c.sel, c.status, key, spec.perStudent]);
    };
    const raw = JSON.stringify({ inputMode: 'standard', worksheetsPerStudent: '3', answerKey: true, [c.list]: [c.row('Avi', '1'), c.row('Dana', '2')] });
    const before = p.errors.length;
    const a = await load('?plant', raw);
    // the handle: the planted bug really fired on this load (the setter was called with "3" and threw)
    check(a.per !== '3', `planted load: the restore hit the planted bug (per-student select "${a.per}")`);
    check(JSON.stringify(a.rows) === JSON.stringify([['', '', ''], ['', '', ''], ['', '', '']]), `planted load: starts blank, 3 empty rows (${JSON.stringify(a.rows).slice(0, 80)})`);
    check(a.status === UNREADABLE, `planted load: the notice ("${a.status.slice(0, 60)}")`);
    check(a.left === raw, `planted load: the saved roster kept byte for byte (${a.left === null ? 'deleted' : a.left === raw ? 'kept' : 'changed'})`);
    check(p.errors.length === before, `planted load: 0 page errors (${p.errors.slice(before).join('; ')})`);
    const b = await load('');
    check(JSON.stringify(b.rows) === JSON.stringify([['Avi', '1', c.lvl], ['Dana', '2', c.lvl]]) && b.per === '3', `the next load, the bug gone: the class back (${JSON.stringify(b.rows)}, ${b.per} per student)`);
    check(b.status === 'Saved roster loaded.', `the next load: "${b.status.slice(0, 60)}"`);
    for (const bad of ['{oops', 'null']) {
      const r = await load('', bad);
      check(r.rows.length === 3 && r.status === UNREADABLE && r.left === null, `${JSON.stringify(bad)}: 3 blank rows, reported, cleared (${r.left === null ? 'cleared' : 'kept'})`);
    }
    check(p.errors.length === 0, `0 page errors in all (${p.errors.join('; ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS36-restore-throw: ${fails.length} failing check(s)` : '\nS36-restore-throw: all green');
process.exit(fails.length ? 1 : 0);
