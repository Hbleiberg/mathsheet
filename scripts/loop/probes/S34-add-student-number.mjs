// Probe (loop S34, pass F; approved at gate 6's spirit, asked S34; found S18): Add Student carries on the Student
// Number on every page. index's new row took the last row's Number + 1; the twins' always started empty (their
// Duplicate already added one), so a class of 22 meant typing 2…22. Per page, by real clicks on Add Student with the
// last row's Number set to each case: "3" → "4", " 9 " → "10", "" / "14B" / "Blue" → on from the last number (empty
// before S42); the new row's name and level empty; the twins' answer equal to index's for every case; Duplicate as
// before ("5" → "6"); a fresh load's three rows unnumbered; a saved roster with blank Numbers restores them blank.
// Fails before the change (`--ref e97c230`).
//   node scripts/loop/probes/S34-add-student-number.mjs [--ref <commit>]
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
// Since S42 a blank or wordy last Number counts on from the last number (row 4's 9, then a blank, "14B" and "Blue": the new
// rows 6, 7 and 8 read 11, 12 and 13): S42-add-student-gap
const CASES = [['3', '4'], [' 9 ', '10'], ['', '11'], ['14B', '12'], ['Blue', '13'], ['21', '22']];

const srv = await serve(); const browser = await launch();
const got = {};
try {
  for (const file of Object.keys(IDS)) {
    const id = IDS[file];
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const open = async storage => {
      const p = await openPage(browser, srv.base, file, storage ? { storage } : {});
      if (REF) {
        const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
        await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
        await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' }); await p.spec.prepare(p.page);
      }
      return p;
    };
    const rows = (pg, s) => pg.$$eval(`${s.students} ${s.entry}`, (es, lv) => es.map(e => ({
      name: e.querySelector('input[name="studentName"]').value,
      number: e.querySelector('input[name="studentNumber"]').value,
      level: e.querySelector(lv).value })), id.level);

    let p = await open(), pg = p.page;
    const fresh = await rows(pg, p.spec);
    check(fresh.length === 3 && fresh.every(r => r.number === ''), `a fresh load: three rows, none numbered (${fresh.map(r => JSON.stringify(r.number)).join(' ')})`);
    got[file] = [];
    for (const [last, want] of CASES) {
      await pg.fill(`${p.spec.students} ${p.spec.entry}:last-child input[name="studentNumber"]`, last);
      await pg.click(id.add);
      const all = await rows(pg, p.spec), r = all[all.length - 1];
      got[file].push(r.number);
      check(r.number === want && r.name === '' && r.level === '', `Add Student after ${JSON.stringify(last)}: the new row's Number ${JSON.stringify(r.number)} (want ${JSON.stringify(want)}), name and level empty`);
    }
    // Duplicate as before
    await pg.fill(`${p.spec.students} ${p.spec.entry}:first-child input[name="studentNumber"]`, '5');
    await pg.click(`${p.spec.students} ${p.spec.entry}:first-child ${id.dup}`);
    const afterDup = await rows(pg, p.spec);
    check(afterDup[1].number === '6', `Duplicate after "5": "${afterDup[1].number}"`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
    // a saved roster with blank Numbers restores them blank
    await pg.fill(`${p.spec.students} ${p.spec.entry}:first-child input[name="studentNumber"]`, '7');
    await pg.click(p.spec.save);
    const saved = await rows(pg, p.spec);
    const store = await pg.evaluate(k => localStorage.getItem(k), p.spec.storageKey);
    await p.close();
    p = await open({ [p.spec.storageKey]: store }); pg = p.page;
    const restored = await rows(pg, p.spec);
    check(JSON.stringify(restored.map(r => r.number)) === JSON.stringify(saved.map(r => r.number.trim())), `a saved roster restores its Numbers as saved (trimmed, as Save keeps them) (${restored.map(r => JSON.stringify(r.number)).join(' ')})`);
    await p.close();
  }
  for (const f of ['math-minute.html', 'math-facts.html'])
    check(JSON.stringify(got[f]) === JSON.stringify(got['index.html']), `${f} numbers each case as index does (${got[f].map(s => JSON.stringify(s)).join(' ')})`);
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS34-add-student-number: ${fails.length} failing check(s)` : '\nS34-add-student-number: all green');
process.exit(fails.length ? 1 : 0);
