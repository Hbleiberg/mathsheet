// Probe (loop S18, pass H on index.html; all three pages): a class typed in and printed was gone at the next visit
// unless Save Roster was clicked — Generate never saves, and nothing said so (a 22-student walkthrough took 52
// clicks and keystrokes to rebuild). Approved S18 (gate 2): after Generate & Print or Save PDF, when the roster on
// screen is not the saved one, a notice reads "This roster isn't saved. Click Save Roster to keep it for next time."
// Nothing is saved without the click.
// Arms, per page: a new roster → the notice, in view once the scroll settles, print still called; Save Roster →
// none; reload (the saved roster restored, index's Mixed and Fractions rows included) → none; an edited name → the
// notice again; Advanced mode unsaved → the notice, saved → none; Save PDF (stubbed libraries) → "PDF saved!" with
// the notice under it; storage denied → no notice (Save Roster cannot help there), the sheets still print.
// Fails on the pages before the change (`--ref e71f8fc`).
//   node scripts/loop/probes/S18-unsaved-reminder.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const TEXT = "This roster isn't saved. Click Save Roster to keep it for next time.";
const STATUS = { 'index.html': '#mwgStatus', 'math-minute.html': '#statusMessages', 'math-facts.html': '#statusMessages' };
const H2C_STUB = 'window.html2canvas = function () { var c = document.createElement("canvas"); c.width = 4; c.height = 4; return Promise.resolve(c); };';
const JSPDF_STUB = 'window.jspdf = { jsPDF: function () { return { addPage: function () {}, addImage: function () {}, save: function (n) { window.__pdfSaved = n; } }; } };';

async function open(browser, base, file, opts = {}) {
  const p = await openPage(browser, base, file, opts);
  if (REF) {
    const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
    if (!opts.raw) await p.spec.prepare(p.page);
  }
  await p.page.route(/cdnjs\.cloudflare\.com\/.*html2canvas/, r => r.fulfill({ contentType: 'text/javascript', body: H2C_STUB }));
  await p.page.route(/cdnjs\.cloudflare\.com\/.*jspdf/, r => r.fulfill({ contentType: 'text/javascript', body: JSPDF_STUB }));
  return p;
}
/** Click Generate & Print; wait for print and the smooth scroll; read the status box. */
async function printRun(p, file) {
  const pg = p.page, before = await p.prints();
  await pg.click(p.spec.generate);
  await pg.waitForFunction(n => window.__prints > n, before, { timeout: 8000 }).catch(() => {});
  await pg.waitForTimeout(900);
  return pg.evaluate(sel => {
    const box = document.querySelector(sel), notes = [...box.children].map(c => c.className + ': ' + c.textContent);
    const r = box.getBoundingClientRect();
    return { notes, inView: r.height > 0 && r.top >= 0 && r.bottom <= innerHeight, prints: window.__prints };
  }, STATUS[file]);
}
const has = r => r.notes.some(n => n.startsWith('notice-box') || n.startsWith('mwg-notice-box') ? n.endsWith(TEXT) : false);

const srv = await serve(); const browser = await launch();
for (const file of ['index.html', 'math-minute.html', 'math-facts.html']) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  let p = await open(browser, srv.base, file);
  const pg = p.page, s = p.spec;
  await pg.fill(`${s.students} ${s.entry}:nth-child(1) ${s.name}`, 'Avi Cohen');
  await pg.fill(`${s.students} ${s.entry}:nth-child(2) ${s.name}`, 'שרה כ.');
  if (file === 'index.html') {   // a Fractions row with one operation and a Mixed row with a narrowed pool must restore equal
    await pg.evaluate(() => {
      const rows = document.querySelectorAll('#mwgStudentsContainer .mwg-student-entry'), fire = s => s.dispatchEvent(new Event('change', { bubbles: true }));
      let g = rows[1].querySelector('[name="grade"]'); g.value = '5'; fire(g);
      let t = rows[1].querySelector('[name="problemType"]'); t.value = 'fractions'; fire(t);
      for (const cb of rows[1].querySelectorAll('.mwg-ops-panel input[type="checkbox"]')) if (!/add/.test(cb.value)) { cb.checked = false; fire(cb); }
      g = rows[2].querySelector('[name="grade"]'); g.value = '3'; fire(g);
      t = rows[2].querySelector('[name="problemType"]'); t.value = 'mixed'; fire(t);
      const mixed = rows[2].querySelectorAll('.mwg-mixed-cb'); mixed[0].checked = false; fire(mixed[0]);
      const c = rows[2].querySelector('[name="count"]'); c.value = '40'; fire(c);
    });
  }
  let r = await printRun(p, file);
  check(has(r) && r.inView && r.prints === 1, `new roster: the notice shows, in view, and print ran (${JSON.stringify(r.notes)}, in view ${r.inView}, prints ${r.prints})`);
  await pg.click(s.save);
  r = await printRun(p, file);
  check(!has(r) && r.prints === 2, `after Save Roster: no notice (${JSON.stringify(r.notes)})`);
  await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${s.students} ${s.entry}`);
  r = await printRun(p, file);
  check(!has(r) && r.prints === 1, `the saved roster reloaded: no notice (${JSON.stringify(r.notes)}, prints ${r.prints})`);
  await pg.fill(`${s.students} ${s.entry}:nth-child(1) ${s.name}`, 'Avi C.');
  r = await printRun(p, file);
  check(has(r), `a name edited after saving: the notice again (${JSON.stringify(r.notes)})`);
  // Advanced mode
  await pg.click(s.modeToggle);
  await pg.fill(s.advanced, s.advancedSample);
  r = await printRun(p, file);
  check(has(r), `Advanced, unsaved: the notice (${JSON.stringify(r.notes)})`);
  await pg.click(s.save);
  r = await printRun(p, file);
  check(!has(r), `Advanced, saved: no notice (${JSON.stringify(r.notes)})`);
  // Save PDF, stubbed libraries
  await pg.fill(s.advanced, s.advancedSample + '\nNew, 9, ' + s.advancedSample.split('\n')[0].split(',').slice(3).join(',').trim());
  await pg.click(s.pdf);
  await pg.waitForFunction(() => window.__pdfSaved, null, { timeout: 15000 }).catch(() => {});
  await pg.waitForTimeout(300);
  const pdf = await pg.$eval(STATUS[file], b => [...b.children].map(c => c.className + ': ' + c.textContent));
  check(pdf.length === 2 && /PDF saved!$/.test(pdf[0]) && pdf[1].endsWith(TEXT), `Save PDF: "PDF saved!" then the notice (${JSON.stringify(pdf)})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
  // storage denied
  const ctxOpts = {};
  p = await open(browser, srv.base, file, ctxOpts);
  await p.context.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } }); });
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${s.students} ${s.entry}`); await s.prepare(p.page);
  r = await printRun(p, file);
  const sheets = await p.page.locator(s.sheet).count();
  const denied = await p.page.evaluate(() => { try { return !window.localStorage; } catch (e) { return true; } });
  check(denied && !has(r) && sheets > 0 && r.prints === 1, `storage denied (${denied}): no notice, ${sheets} sheets printed (${JSON.stringify(r.notes)})`);
  check(p.errors.length === 0, `storage denied: 0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS18-unsaved-reminder: ${fails.length} failing check(s)` : '\nS18-unsaved-reminder: all green');
process.exit(fails.length ? 1 : 0);
