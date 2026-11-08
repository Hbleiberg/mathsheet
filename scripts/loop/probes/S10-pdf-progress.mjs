// S10 probe: Save PDF reports its progress and refuses a second click (approved S3 and the S1 guard). Per page, with
// the cdnjs libraries (the smoke's `--cdn` network): the status box reads "Making your PDF: page k of N..." for every
// page k, then "PDF saved!"; the Save PDF button is disabled from the click until the save and enabled after; a
// second click mid-export starts nothing (N html2canvas calls, one download); the status box is in the viewport
// while the export runs. Offline (libraries blocked) and with no students, the button is enabled again after the
// notice. `--only <file>`; `--ref <commit>` serves the page from a commit (the control: `--ref HEAD` before the fix
// fails the progress, the guard and the disabled button).
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';
const args = process.argv.slice(2), opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const REF = opt('--ref');
const STATUS = { 'index.html': '#mwgStatus', 'math-minute.html': '#statusMessages', 'math-facts.html': '#statusMessages' };
const ROWS = { 'index.html': 'A, 1, add2, 30, 2;\nB, 2, div4, 30, 5;\nC, 3, rounding, 30, 5;\nD, 4, mixed, 40, 5;',
  'math-minute.html': 'A, 1, 1;\nB, 2, 20;\nC, 3, 21;\nD, 4, 9;', 'math-facts.html': 'A, 1, +3;\nB, 2, /7;\nC, 3, mixmd60;\nD, 4, x12;' };
const HOOK = `window.__h2c = 0; window.__status = []; let real;
Object.defineProperty(window, 'html2canvas', { configurable: true, get() { return real && function (el, o) { window.__h2c++; return real(el, o); }; }, set(v) { real = v; } });`;
const files = opt('--only') ? [opt('--only')] : Object.keys(ROWS);
const srv = await serve(); const browser = await launch();
let failing = 0;
const check = (ok, msg) => { if (!ok) failing++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); };

async function open(file, cdn) {
  const p = await openPage(browser, srv.base, file, { raw: true, cdn });
  await p.context.addInitScript(HOOK);
  if (REF) { const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body })); }
  await p.page.reload({ waitUntil: 'load' });
  await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  await p.page.evaluate(sel => { const el = document.querySelector(sel);
    new MutationObserver(() => { const t = el.textContent.trim(); if (t && window.__status[window.__status.length - 1] !== t) window.__status.push(t); }).observe(el, { childList: true, subtree: true, characterData: true }); }, STATUS[file]);
  await p.page.click(p.spec.modeToggle); await p.page.setChecked(p.spec.key, true);
  p.downloads = 0; p.page.on('download', () => p.downloads++);
  return p;
}
const disabled = (p) => p.page.$eval(p.spec.pdf, b => b.disabled);

for (const file of files) {
  console.log(`${file}${REF ? ` (from ${REF})` : ''}`);
  try {
    // online: progress, guard, button state, the box in view
    let p = await open(file, true);
    await p.page.fill(p.spec.advanced, ROWS[file]);
    const dl = p.page.waitForEvent('download', { timeout: 120000 });
    await p.page.click(p.spec.pdf);
    await p.page.waitForFunction(() => window.__h2c >= 2, null, { timeout: 60000 });
    const midDisabled = await disabled(p);
    const inView = await p.page.$eval(STATUS[file], el => { const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight; });
    await p.page.$eval(p.spec.pdf, b => b.click());   // a second click mid-export
    await dl;
    await p.page.waitForFunction(() => /PDF saved!/.test(window.__status[window.__status.length - 1] || ''), null, { timeout: 60000 }).catch(() => {});
    await p.page.waitForTimeout(1500);                 // a second pipeline would still be running
    const sheets = await p.page.locator(`${p.spec.sheet}, ${p.spec.keySheet}`).count();
    const st = await p.page.evaluate(() => ({ h2c: window.__h2c, status: window.__status }));
    const afterDisabled = await disabled(p);
    const pages = st.status.filter(s => /^Making your PDF: page \d+ of \d+\.\.\.$/.test(s));
    check(sheets === 8, `${sheets} sheets and keys generated`);
    check(pages.length === sheets && pages[0] === `Making your PDF: page 1 of ${sheets}...` && pages[pages.length - 1] === `Making your PDF: page ${sheets} of ${sheets}...`,
      `the status box counts every page ("${pages[0] || st.status[0] || ''}" … "${pages[pages.length - 1] || ''}"; ${pages.length} of ${sheets})`);
    // "PDF saved!", then S18's approved notice when the roster is not the saved one (read as one text here)
    check(/^PDF saved!/.test(st.status[st.status.length - 1] || ''), `ends on "PDF saved!" (last: "${st.status[st.status.length - 1]}")`);
    check(midDisabled === true && afterDisabled === false, `Save PDF disabled during the export (${midDisabled}) and enabled after (${!afterDisabled})`);
    check(st.h2c === sheets && p.downloads === 1, `a second click mid-export starts nothing: ${st.h2c} page captures for ${sheets} sheets, ${p.downloads} download`);
    check(inView, `the status box is in the viewport while the export runs`);
    await p.close();
    // offline: the notice, then the button enabled again
    p = await open(file, false);
    await p.page.fill(p.spec.advanced, ROWS[file]);
    await p.page.click(p.spec.pdf);
    await p.page.waitForFunction(() => window.__status.some(s => /PDF/.test(s) && !/Making|saved/.test(s)), null, { timeout: 20000 });
    await p.page.waitForTimeout(300);
    check((await disabled(p)) === false, `offline: after the notice ("${(await p.page.evaluate(() => window.__status)).find(s => /PDF/.test(s))}") the button is enabled again`);
    await p.close();
    // no students: the button enabled again
    p = await open(file, true);
    await p.page.fill(p.spec.advanced, '');
    await p.page.click(p.spec.pdf);
    await p.page.waitForTimeout(800);
    check((await disabled(p)) === false, `no students: the button is enabled again after "${(await p.page.evaluate(() => window.__status))[0] || ''}"`);
    await p.close();
  } catch (e) { check(false, e.message.split('\n')[0]); }
}
console.log(`S10-pdf-progress: ${failing ? failing + ' failing' : 'all green'}`);
await browser.close(); await srv.close();
process.exit(failing ? 1 : 0);
