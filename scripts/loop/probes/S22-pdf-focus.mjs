// Probe (loop S22, pass D on math-minute.html; the same block on all three pages): Save PDF disables its button for the
// export (S10), and a focused button that is disabled loses focus to the page's start, so after "PDF saved!" a keyboard
// user's next Tab landed on the mode toggle at the top: some 120 Tabs back to Save PDF with 22 students. Offline (the
// two cdnjs libraries stubbed, the html2canvas stub slow enough to act during the export), per page: Enter on Save PDF
// → after the save, focus is on Save PDF again and visible, the "PDF saved!" message in view beside it; a Tab during
// the export keeps the focus where the Tab put it; a mouse click is left as it was (no focus ring, no scroll: focusing the
// button scrolled a 22-row page ~470 px at the save's end); the notice path (the libraries refused) gives focus back too. Fails before the change (`--ref ac0a2e4`).
//   node scripts/loop/probes/S22-pdf-focus.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const H2C_STUB = `window.html2canvas = function () { var cv = document.createElement('canvas'); cv.width = 4; cv.height = 4;
  return new Promise(function (r) { setTimeout(function () { r(cv); }, 120); }); };`;   // ~0.2 s a page: time to Tab
const JSPDF_STUB = `window.jspdf = { jsPDF: function () { return { addPage: function () {}, addImage: function () {},
  save: function (n) { window.__pdfSaved = (window.__pdfSaved || 0) + 1; } }; } };`;
const STATUS = { 'index.html': '#mwgStatus', 'math-minute.html': '#statusMessages', 'math-facts.html': '#statusMessages' };

const srv = await serve(); const browser = await launch();
for (const file of Object.keys(STATUS)) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  const open = async (offline) => {
    const p = await openPage(browser, srv.base, file);
    const pg = p.page;
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' }); await p.spec.prepare(pg);
    }
    if (offline) await pg.route(/cdnjs\.cloudflare\.com\//, r => r.abort());
    else {
      await pg.route(/cdnjs\.cloudflare\.com\/.*html2canvas/, r => r.fulfill({ contentType: 'text/javascript', body: H2C_STUB }));
      await pg.route(/cdnjs\.cloudflare\.com\/.*jspdf/, r => r.fulfill({ contentType: 'text/javascript', body: JSPDF_STUB }));
    }
    await pg.selectOption(p.spec.perStudent, '3');   // 9 pages, ~2 s
    return p;
  };
  const state = (pg, pdf, status) => pg.evaluate(({ pdf, status }) => {
    const e = document.activeElement, b = document.querySelector(pdf), s = document.querySelector(status);
    const inView = el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; };
    const ring = document.querySelector(':focus-visible');
    return { on: e === document.body ? 'BODY' : `${e.tagName.toLowerCase()}#${e.id}`, isPdf: e === b, visible: e.matches(':focus-visible'), ring: ring ? ring.id : null,
      btnInView: inView(b), status: s.innerText.trim(), statusInView: inView(s), disabled: b.disabled };
  }, { pdf, status });

  // 1. the keyboard: Enter on Save PDF
  let p = await open(false); let pg = p.page;
  await pg.focus(p.spec.pdf); await pg.keyboard.press('Enter');
  await pg.waitForFunction(() => window.__pdfSaved > 0, null, { timeout: 30000 }); await pg.waitForTimeout(200);
  let s = await state(pg, p.spec.pdf, STATUS[file]);
  check(s.status.startsWith('PDF saved!'), `the PDF is saved ("${s.status.slice(0, 40)}")`);
  check(s.isPdf && !s.disabled, `Enter on Save PDF: focus back on Save PDF after the save (${s.on})`);
  check(s.isPdf && s.visible, `its focus ring shows (${s.visible})`);
  check(s.btnInView && s.statusInView, `the button and "PDF saved!" both in view (${s.btnInView}, ${s.statusInView})`);
  await pg.keyboard.press('Shift+Tab');
  const back = await pg.evaluate(() => document.activeElement.id);
  check(/generate/i.test(back), `Shift+Tab from there is Generate & Print, not the page's end (${back})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();

  // 2. a Tab during the export keeps the focus where the Tab put it
  p = await open(false); pg = p.page;
  await pg.focus(p.spec.pdf); await pg.keyboard.press('Enter'); await pg.waitForTimeout(400);
  await pg.keyboard.press('Tab');
  const moved = await pg.evaluate(() => document.activeElement.id);
  await pg.waitForFunction(() => window.__pdfSaved > 0, null, { timeout: 30000 }); await pg.waitForTimeout(200);
  s = await state(pg, p.spec.pdf, STATUS[file]);
  check(moved && !s.isPdf && s.on.endsWith(`#${moved}`), `a Tab during the export is kept (on ${moved}, after the save ${s.on})`);
  await p.close();

  // 3. the mouse: no focus ring after the save
  p = await open(false); pg = p.page;
  await pg.click(p.spec.pdf);
  await pg.waitForFunction(() => window.__pdfSaved > 0, null, { timeout: 30000 }); await pg.waitForTimeout(200);
  s = await state(pg, p.spec.pdf, STATUS[file]);
  check(s.ring === null && s.on === 'BODY', `a mouse click is left as it was: no focus ring, no focus moved (${s.ring || 'none'}, focus ${s.on})`);
  await p.close();

  // 4. the libraries refused: the notice, and the focus back on Save PDF
  p = await open(true); pg = p.page;
  await pg.focus(p.spec.pdf); await pg.keyboard.press('Enter');
  await pg.waitForFunction(sel => /could not be downloaded/.test(document.querySelector(sel).innerText), STATUS[file], { timeout: 15000 });
  await pg.waitForTimeout(100);
  s = await state(pg, p.spec.pdf, STATUS[file]);
  check(s.isPdf && !s.disabled, `offline: the notice, and focus back on Save PDF (${s.on})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS22-pdf-focus: ${fails.length} failing check(s)` : '\nS22-pdf-focus: all green');
process.exit(fails.length ? 1 : 0);
