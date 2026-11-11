// Probe (loop S35, pass I): one unreadable row in a saved roster no longer costs the whole class. On math-minute and
// math-facts a saved list holding a `null` among good rows threw inside the restore, so the catch S15 added for an
// unreadable payload started a blank roster and deleted the saved one, every other student with it; index.html made
// the row empty and kept the rest. Per page, a list [good, null, good], [null, good] and [null]: the good rows come
// back with their names, Numbers and levels, the bad one as an empty row in its place, "Saved roster loaded." shown,
// the saved payload kept byte for byte; Save then writes the empty row as a plain empty entry. S15's unreadable
// payloads ("{oops", "null") are still reported and cleared. Fails before the change (`--ref 6fac477`).
//   node scripts/loop/probes/S35-saved-null-row.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, PAGES, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const UNREADABLE = 'The saved roster could not be read, so the page starts with a blank roster.';
const P = {
  'index.html':       { list: 'students', sel: 'select[name="problemType"]', status: '#mwgStatus',
    row: (n, num) => ({ name: n, number: num, grade: '2', type: 'add1', count: '30', mixedTypes: null, fracOps: null, decOps: null }), lvl: 'add1' },
  'math-minute.html': { list: 'standardStudents', sel: 'select[name="level"]', status: '#statusMessages', row: (n, num) => ({ name: n, number: num, level: '5' }), lvl: '5' },
  'math-facts.html':  { list: 'standardStudents', sel: 'select[name="level"]', status: '#statusMessages', row: (n, num) => ({ name: n, number: num, level: '+3' }), lvl: '+3' },
};

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(P)) {
    if (ONLY && ONLY !== file) continue;
    const c = P[file], spec = PAGES[file], key = spec.storageKey;
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    // planted by hand and reloaded, so the second load is the page's own (the harness seed re-plants on every load)
    const load = async raw => {
      const p = await openPage(browser, srv.base, file, { raw: true });
      if (REF) {
        const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
        await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      }
      await p.page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, raw]);
      await p.page.reload({ waitUntil: 'load' });
      await p.page.waitForSelector(`${spec.students} ${spec.entry}`, { state: 'attached' });
      const rows = await p.page.$$eval(`${spec.students} ${spec.entry}`, (es, sel) => es.map(e => ({
        name: e.querySelector('input[name="studentName"]').value, number: e.querySelector('input[name="studentNumber"]').value,
        level: e.querySelector(sel).value })), c.sel);
      const status = await p.page.$eval(c.status, e => e.innerText.trim());
      const left = await p.page.evaluate(k => localStorage.getItem(k), key);
      return { p, rows, status, left };
    };
    const cases = [
      ['[good, null, good]', [c.row('Avi', '1'), null, c.row('Dana', '3')], [['Avi', '1', c.lvl], ['', '', ''], ['Dana', '3', c.lvl]]],
      ['[null, good]', [null, c.row('Noa', '2')], [['', '', ''], ['Noa', '2', c.lvl]]],
      ['[null]', [null], [['', '', '']]],
    ];
    for (const [label, list, want] of cases) {
      const raw = JSON.stringify({ inputMode: 'standard', worksheetsPerStudent: '2', answerKey: true, [c.list]: list });
      const r = await load(raw);
      const got = r.rows.map(x => [x.name, x.number, x.level]);
      check(JSON.stringify(got) === JSON.stringify(want), `${label}: rows ${JSON.stringify(got)}`);
      check(r.status === 'Saved roster loaded.', `${label}: "${r.status.slice(0, 70)}"`);
      check(r.left === raw, `${label}: the saved payload kept byte for byte (${r.left === null ? 'deleted' : r.left === raw ? 'kept' : 'changed'})`);
      if (label === '[good, null, good]') {
        check(await r.p.page.$eval(spec.perStudent, e => e.value) === '2' && await r.p.page.$eval(spec.key, e => e.checked), `${label}: the settings restored with it`);
        await r.p.page.click(spec.save);
        const saved = await r.p.page.evaluate(k => JSON.parse(localStorage.getItem(k)), key);
        const mid = saved[c.list][1];
        check(mid && typeof mid === 'object' && !mid.name && saved[c.list].length === 3 && saved[c.list][2].name === 'Dana', `${label}: Save writes the empty row as an entry (${JSON.stringify(mid)})`);
      }
      check(r.p.errors.length === 0, `${label}: 0 page errors (${r.p.errors.join('; ')})`);
      await r.p.close();
    }
    // S15's unreadable values are still reported and cleared
    for (const raw of ['{oops', 'null']) {
      const r = await load(raw);
      check(r.rows.length === 3 && r.status === UNREADABLE && r.left === null, `${JSON.stringify(raw)}: 3 blank rows, reported, cleared`);
      await r.p.close();
    }
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS35-saved-null-row: ${fails.length} failing check(s)` : '\nS35-saved-null-row: all green');
process.exit(fails.length ? 1 : 0);
