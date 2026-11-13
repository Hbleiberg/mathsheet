// Probe (loop S50, pass E; all three pages, index's fix): the validation box goes when the roster it speaks of changes.
// index's `clearStatus()` emptied the status line and left the box, where the twins' `clearStatusMessages()` hides it, so
// Add Student, Duplicate, Delete, Clear Current Roster, Save, Generate Advanced Code and the mode switch left "The
// following students have unfilled required fields: Student 1 (Avi)…" up on index; in Advanced mode it named Standard
// rows that were hidden, and its Generate Anyway ran the Advanced roster ("No valid students"). Per page, by real clicks,
// each from a fresh page with Student 1 named and no level, Generate & Print → the box:
//   - Add Student, Duplicate, Delete Student 3, Delete the marked Student 1, Clear Current Roster, Advanced Input, Save
//     Roster, Generate Advanced Code, Clear Saved Roster: the box hidden;
//   - picking Student 2's level keeps it (as before, all three pages), and its Generate Anyway still prints;
//   - Advanced Input and back, Generate & Print: the box again, "Student 1: missing …";
//   - 0 page errors.
// Fails before the change on index (`--ref <commit before S50's fix>`).
//   node scripts/loop/probes/S50-validation-box-clears.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, PAGES, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const FILES = Object.keys(PAGES).filter(f => !ONLY || f === ONLY);
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const IDS = f => f === 'index.html'
  ? { box: '#mwgValidationBox', anyway: '#mwgValidationGenerate', add: '#mwgAddStudentBtn', dup: '.mwg-duplicate-link', del: '.mwg-delete-link', clear: '#mwgClearCurrentBtn', code: '#mwgGenCodeBtn', clearSaved: '#mwgClearSavedBtn' }
  : { box: '#mmValidationBox', anyway: '#mmValidationGenerate', add: '#addStudentButton', dup: '.duplicate-student-link', del: '.delete-student-link', clear: '#clearCurrentRosterButton', code: '#generateAdvancedCodeButton', clearSaved: '#clearSavedRosterButton' };

const srv = await serve(); const browser = await launch();
async function open(file) {
  const p = await openPage(browser, srv.base, file, { raw: true });
  if (REF) {
    const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
  }
  p.page.on('dialog', d => d.accept());
  p.u = IDS(file);
  return p;
}
const row = (p, i) => `${p.spec.students} ${p.spec.entry} >> nth=${i}`;
const boxShown = p => p.page.locator(p.u.box).isVisible();
const boxText = p => p.page.locator(p.u.box).innerText();
async function withBox(file) {
  const p = await open(file);
  await p.page.fill(`${row(p, 0)} >> input[name="studentName"]`, 'Avi');
  await p.page.click(p.spec.generate);
  return p;
}
const pickLevel = (p, i) => p.page.evaluate(([sel, i]) => { const e = document.querySelectorAll(sel)[i];
  for (const s of e.querySelectorAll('select')) { const o = [...s.options].find(o => o.value && o.value !== 'mixed'); if (o && !s.value) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); } } }, [`${p.spec.students} ${p.spec.entry}`, i]);

try {
  for (const file of FILES) {
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const hides = {
      'Add Student': p => p.page.click(p.u.add),
      'Duplicate Student 2': p => p.page.locator(`${row(p, 1)} >> ${p.u.dup}`).click(),
      'Delete Student 3': p => p.page.locator(`${row(p, 2)} >> ${p.u.del}`).click(),
      'Delete the marked Student 1': p => p.page.locator(`${row(p, 0)} >> ${p.u.del}`).click(),
      'Clear Current Roster': p => p.page.click(p.u.clear),
      'Advanced Input': p => p.page.click(p.spec.modeToggle),
      'Save Roster': p => p.page.click(p.spec.save),
      'Generate Advanced Code': async p => { await p.page.click(p.u.code); await p.page.keyboard.press('Escape'); },
      'Clear Saved Roster': p => p.page.click(p.u.clearSaved),
    };
    for (const [label, act] of Object.entries(hides)) {
      const p = await withBox(file);
      const first = await boxShown(p);
      await act(p); await p.page.waitForTimeout(60);
      const after = await boxShown(p);
      check(first && !after && !p.errors.length, `${label}: the box ${first ? 'shown' : 'NOT shown'}, then ${after ? 'still up' : 'hidden'}${p.errors.length ? '; errors ' + p.errors.join('; ') : ''}`);
      await p.close();
    }
    // a pick keeps it, and its Generate Anyway prints
    {
      const p = await withBox(file);
      await pickLevel(p, 1); await p.page.waitForTimeout(60);
      const kept = await boxShown(p);
      await p.page.click(p.u.anyway);
      await p.page.waitForFunction(() => window.__prints > 0, null, { timeout: 10000 }).catch(() => {});
      const prints = await p.prints(), sheets = await p.page.locator(p.spec.sheet).count();
      check(kept && prints === 1 && sheets >= 1 && !p.errors.length, `picking Student 2's level keeps the box (${kept}); Generate Anyway prints (${prints} print, ${sheets} sheets)`);
      await p.close();
    }
    // Advanced and back: the box comes again on Generate
    {
      const p = await withBox(file);
      await p.page.click(p.spec.modeToggle); await p.page.click(p.spec.modeToggle);
      const gone = !(await boxShown(p));
      await p.page.click(p.spec.generate);
      const again = await boxShown(p), text = again ? await boxText(p) : '';
      check(gone && again && /Student 1: missing/.test(text) && !p.errors.length, `Advanced and back: the box gone (${gone}); Generate & Print shows it again for Student 1 ("${text.replace(/\s+/g, ' ').slice(0, 80)}")`);
      await p.close();
    }
  }
} catch (e) { check(false, e.stack.split('\n').slice(0, 3).join(' ')); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS50-validation-box-clears: ${fails.length} failing check(s)` : '\nS50-validation-box-clears: all green');
process.exit(fails.length ? 1 : 0);
