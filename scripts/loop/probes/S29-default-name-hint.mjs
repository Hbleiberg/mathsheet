// Probe (loop S29; found S26, pass C on math-facts.html): the three rows a page builds itself — on a fresh load, after
// Clear Current Roster, from a saved roster with no rows or an unreadable one — carry the Name hint every other row
// carries ("Optional"; "Prints blank" with Name blank on): `buildDefaultStudents()` set the Number field's state but
// not the Name's. Per page, by real clicks:
//   - fresh: every Name field "Optional"; Name blank ticked → "Prints blank", unticked → "Optional";
//   - Name blank on, Clear Current Roster → three rows, each "Prints blank"; Add Student and Duplicate rows alike;
//   - a saved roster with Name blank and no rows, and an unreadable one, load to rows with the hint the toggle gives;
//   - every row's markup otherwise identical to the reference page's (`--ref`, a53342b).
// index.html's half shipped in S30 (its cap in S29), so all three pages run by default; `--only <file>` takes one. Fails
// before the change (`--ref`'s page served as the one under test: `--control`).
//   node scripts/loop/probes/S29-default-name-hint.mjs [--only <file>] [--control] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref') || 'a53342b', CONTROL = process.argv.includes('--control');
const FILES = arg('--only') ? [arg('--only')] : ['index.html', 'math-minute.html', 'math-facts.html'];
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const IDS = {
  'index.html': { blank: '#mwgNameBlankToggle', clear: '#mwgClearCurrentBtn', add: '#mwgAddStudentBtn', dup: '.mwg-duplicate-link, [class*="duplicate"]', rows: '#mwgStudentsContainer .mwg-student-entry' },
  'math-minute.html': { blank: '#nameBlankToggle', clear: '#clearCurrentRosterButton', add: '#addStudentButton', dup: '.duplicate-student-link', rows: '#studentsContainer .student-entry' },
};
IDS['math-facts.html'] = IDS['math-minute.html'];
const srv = await serve(); const browser = await launch();

async function open(file, body, storage) {
  const p = await openPage(browser, srv.base, file, { raw: true, storage });
  if (body) {
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  }
  p.page.on('dialog', d => d.accept());
  return p;
}
const hints = (p, s) => p.page.evaluate(sel => [...document.querySelectorAll(sel)].map(e => e.querySelector('input[name="studentName"]').placeholder), s.rows);
// a row's markup with the Name's placeholder taken out
const rowsHtml = (p, s) => p.page.evaluate(sel => [...document.querySelectorAll(sel)].map(e => e.outerHTML.replace(/ placeholder="[^"]*"/g, '')), s.rows);

try {
  for (const file of FILES) {
    const s = IDS[file], ref = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' }), body = CONTROL ? ref : null;
    console.log(`${file}${CONTROL ? ` (control: ${REF})` : ''}`);
    const p = await open(file, body), base = await open(file, ref);
    const fresh = await hints(p, s);
    check(fresh.length === 3 && fresh.every(h => h === 'Optional'), `fresh: ${fresh.length} rows, Name hints ${JSON.stringify(fresh)}`);
    check(JSON.stringify(await rowsHtml(p, s)) === JSON.stringify(await rowsHtml(base, s)), `fresh rows otherwise as on ${REF}`);
    await p.page.click(s.blank); const on = await hints(p, s);
    await p.page.click(s.blank); const off = await hints(p, s);
    check(on.every(h => h === 'Prints blank') && off.every(h => h === 'Optional'), `Name blank on → ${JSON.stringify(on)}, off → ${JSON.stringify(off)}`);
    await p.page.click(s.blank); await p.page.click(s.clear); await p.page.waitForTimeout(100);
    const cleared = await hints(p, s);
    check(cleared.length === 3 && cleared.every(h => h === 'Prints blank'), `Name blank on, Clear Current Roster: ${cleared.length} rows, ${JSON.stringify(cleared)}`);
    await p.page.click(s.add); await p.page.locator(s.dup).first().click();
    const more = await hints(p, s);
    check(more.length === 5 && more.every(h => h === 'Prints blank'), `then Add Student and Duplicate: ${JSON.stringify(more)}`);
    check(!p.errors.length, `0 page errors (${p.errors.join('; ')})`);
    await p.close(); await base.close();
    // saved rosters that load to the default rows
    const key = (await (async () => { const q = await open(file, null); const k = q.spec.storageKey; await q.close(); return k; })());
    const payload = JSON.stringify({ inputMode: 'standard', worksheetsPerStudent: '1', answerKey: false, removeNumber: false, nameBlank: true, headerLine: '', advancedInput: '', standardStudents: [], students: [] });
    for (const [label, raw] of [['a saved roster with Name blank and no rows', payload], ['an unreadable saved roster', '{not json']]) {
      const q = await open(file, body, { [key]: raw }), h = await hints(q, s);
      const want = label.startsWith('a saved') ? 'Prints blank' : 'Optional';
      check(h.length === 3 && h.every(x => x === want), `${label}: ${h.length} rows, ${JSON.stringify(h)} (want "${want}")`);
      await q.close();
    }
  }
} catch (e) { check(false, e.stack.split('\n').slice(0, 3).join(' ')); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS29-default-name-hint: ${fails.length} failing check(s)` : '\nS29-default-name-hint: all green');
process.exit(fails.length ? 1 : 0);
