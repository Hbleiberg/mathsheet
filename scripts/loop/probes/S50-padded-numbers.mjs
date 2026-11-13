// Probe (loop S50, pass E; all three pages): Add Student and Duplicate count on a zero-padded Student Number at its
// width. They counted with `parseInt`, so a class numbered 001, 002, 003 got "4" and "5" from Add Student and "6" from
// Duplicate, and printed "4" beside "003". Per page, by real clicks:
//   - 001 / 002 / 003, Add Student ×2 → 004, 005; Duplicate the last → 006; Duplicate 002 mid-class → empty (003 is held);
//   - 007 with the default rows 2-3 blank → Add 010, Duplicate 008; 099 → Add 102, Duplicate 100; 00 → Add 03, Duplicate 01;
//   - every Number that is not zero-padded counts as on the commit before the change (12, 0, 9, -3, +4, 12.5, 14B, " 9 ",
//     12345678901234567890): the same Add and Duplicate results there and here;
//   - the class 001-005 generates, and the sheets print 001 … 005 in order;
//   - 0 page errors.
// Fails before the change (`--ref <commit before S50's fix>`).
//   node scripts/loop/probes/S50-padded-numbers.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, generate, PAGES, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const FILES = Object.keys(PAGES).filter(f => !ONLY || f === ONLY);
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const BTN = f => f === 'index.html' ? { add: '#mwgAddStudentBtn', dup: '.mwg-duplicate-link' } : { add: '#addStudentButton', dup: '.duplicate-student-link' };
// the commit before the change, for the numbers it must count as it did
const FIXED = execSync('git log -1 --format=%h -S"function numberAfter" -- math-facts.html', { cwd: ROOT, encoding: 'utf8' }).trim();
const BEFORE = REF || (FIXED ? FIXED + '~1' : 'HEAD');   // HEAD while the change is uncommitted

const srv = await serve(); const browser = await launch();
async function open(file, ref) {
  const p = await openPage(browser, srv.base, file, { raw: true });
  if (ref) {
    const body = execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
  }
  p.b = BTN(file);
  return p;
}
const row = (p, i) => `${p.spec.students} ${p.spec.entry} >> nth=${i}`;
const nums = p => p.page.$$eval(`${p.spec.students} ${p.spec.entry} input[name="studentNumber"]`, a => a.map(e => e.value));
// Student 1's Number set, Add Student, then Duplicate Student 1: [Add's Number, Duplicate's Number]
async function addDup(file, ref, v) {
  const p = await open(file, ref);
  await p.page.fill(`${row(p, 0)} >> input[name="studentNumber"]`, v);
  await p.page.click(p.b.add); const add = (await nums(p))[3];
  await p.page.locator(`${row(p, 0)} >> ${p.b.dup}`).click(); const dup = (await nums(p))[1];
  const errors = p.errors.slice(); await p.close();
  return { add, dup, errors };
}

try {
  for (const file of FILES) {
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const ref = REF || null;
    // the class 001-003
    {
      const p = await open(file, ref);
      for (let i = 0; i < 3; i++) await p.page.fill(`${row(p, i)} >> input[name="studentNumber"]`, '00' + (i + 1));
      await p.page.click(p.b.add); await p.page.click(p.b.add);
      const a = await nums(p);
      await p.page.locator(`${row(p, 4)} >> ${p.b.dup}`).click(); const b = await nums(p);
      await p.page.locator(`${row(p, 1)} >> ${p.b.dup}`).click(); const c = await nums(p);
      check(a.slice(3).join() === '004,005', `001-003, Add Student ×2 → ${JSON.stringify(a.slice(3))} (want 004, 005)`);
      check(b[5] === '006', `Duplicate 005 → "${b[5]}" (want 006)`);
      check(c[2] === '', `Duplicate 002 mid-class → "${c[2]}" (want empty: 003 is held)`);
      // the class generates 001 … 005 (the two copies gone first)
      const del = async i => p.page.locator(`${row(p, i)} >> ${file === 'index.html' ? '.mwg-delete-link' : '.delete-student-link'}`).click();
      await del(2); await del(5);
      await p.spec.prepare(p.page);
      await generate(p);
      const printed = await p.page.$$eval(p.spec.sheet, (ss, f) => ss.map(s => { const v = s.querySelectorAll(f); return v.length > 1 ? v[1].textContent : ''; }),
        file === 'index.html' ? '.mwg-ws-header-main > .mwg-ws-field > .mwg-ws-field-value' : '.worksheet-header-main > .student-field > .student-field-value');
      check(printed.join() === '001,002,003,004,005', `the class prints its Numbers as written: ${JSON.stringify(printed)}`);
      check(!p.errors.length, `0 page errors (${p.errors.join('; ')})`);
      await p.close();
    }
    // padded numbers with rows 2-3 blank
    for (const [v, add, dup] of [['007', '010', '008'], ['099', '102', '100'], ['00', '03', '01']]) {
      const r = await addDup(file, ref, v);
      check(r.add === add && r.dup === dup && !r.errors.length, `"${v}": Add → "${r.add}", Duplicate → "${r.dup}" (want ${add}, ${dup})${r.errors.length ? '; errors ' + r.errors.join('; ') : ''}`);
    }
    // the others count as before the change
    if (!REF) {
      const odd = [];
      for (const v of ['12', '0', '9', '-3', '+4', '12.5', '14B', ' 9 ', '12345678901234567890']) {
        const [now, was] = [await addDup(file, null, v), await addDup(file, BEFORE, v)];
        if (now.add !== was.add || now.dup !== was.dup || now.errors.length) odd.push(`"${v}": ${now.add} / ${now.dup} (was ${was.add} / ${was.dup})`);
      }
      check(!odd.length, `nine unpadded Numbers count as on ${BEFORE} (${odd.join('; ') || 'all the same'})`);
    }
  }
} catch (e) { check(false, e.stack.split('\n').slice(0, 3).join(' ')); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS50-padded-numbers: ${fails.length} failing check(s)` : '\nS50-padded-numbers: all green');
process.exit(fails.length ? 1 : 0);
