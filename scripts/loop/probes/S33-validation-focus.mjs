// Probe (loop S33, pass D on math-facts.html; the same block on all three pages): the validation box's two buttons hide
// with the box, and a focused button that is hidden drops focus to the page's start, so after Generate Anyway a keyboard
// user's next Tab landed on the mode toggle at the top (some 120 Tabs back to Generate with 22 students), and Fix did
// the same once every marked field had been filled. Per page, one row's level (index: its grade) emptied: Enter on
// Generate & Print, Shift+Tab to Generate Anyway, Enter → the sheets print and focus is back on Generate & Print,
// its ring showing; the same from Save PDF (offline, the libraries refused) → focus on Save PDF after the notice; Fix
// with the row filled meanwhile → focus on the button that asked; Fix with the row still empty → focus on the marked
// field, as since S16; a mouse click on Generate Anyway is left as it was (no ring, as Save PDF's since S22).
// Fails before the change (`--ref a130707`).
//   node scripts/loop/probes/S33-validation-focus.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const V = {
  'index.html':       { box: '#mwgValidationBox', fix: '#mwgValidationFix', anyway: '#mwgValidationGenerate', status: '#mwgStatus', empty: 'select[name="grade"]' },
  'math-minute.html': { box: '#mmValidationBox', fix: '#mmValidationFix', anyway: '#mmValidationGenerate', status: '#statusMessages', empty: 'select[name="level"]' },
  'math-facts.html':  { box: '#mmValidationBox', fix: '#mmValidationFix', anyway: '#mmValidationGenerate', status: '#statusMessages', empty: 'select[name="level"]' },
};

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(V)) {
    if (ONLY && ONLY !== file) continue;
    const v = V[file];
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const open = async () => {
      const p = await openPage(browser, srv.base, file);
      const pg = p.page;
      if (REF) {
        const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
        await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
        await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' }); await p.spec.prepare(pg);
      }
      await pg.route(/cdnjs\.cloudflare\.com\//, r => r.abort());   // Save PDF ends on its offline notice
      // row 2's level (index: grade) emptied: the validation box asks
      await pg.$eval(`${p.spec.students} ${p.spec.entry}:nth-child(2) ${v.empty}`, s => { s.value = ''; s.dispatchEvent(new Event('change', { bubbles: true })); });
      return p;
    };
    const state = (pg, want) => pg.evaluate(want => {
      const e = document.activeElement, w = document.querySelector(want);
      return { on: e === document.body ? 'BODY' : `${e.tagName.toLowerCase()}#${e.id || e.name}`, isWant: e === w, ring: e.matches(':focus-visible'), anyRing: !!document.querySelector(':focus-visible') };
    }, want);
    const ask = async (pg, opener) => {   // Enter on the opener: the box shows, focus stays on the opener
      await pg.focus(opener); await pg.keyboard.press('Enter');
      await pg.waitForSelector(v.box, { state: 'visible', timeout: 5000 });
    };
    const toBox = async (pg, target, presses) => {   // Shift+Tab back from the opener into the box
      for (let i = 0; i < presses; i++) await pg.keyboard.press('Shift+Tab');
      return pg.evaluate(t => document.activeElement === document.querySelector(t), target);
    };

    // 1. Generate Anyway from Generate & Print, by keyboard
    let p = await open(), pg = p.page;
    const before = await p.prints();
    await ask(pg, p.spec.generate);
    check(await toBox(pg, v.anyway, 1), 'Shift+Tab from Generate & Print reaches Generate Anyway');
    await pg.keyboard.press('Enter');
    await pg.waitForFunction(n => window.__prints > n, before, { timeout: 15000 }).catch(() => {});
    let s = await state(pg, p.spec.generate);
    check(await p.prints() === before + 1, `Generate Anyway prints (${await p.prints() - before})`);
    check(s.isWant && s.ring, `Generate Anyway (Enter): focus back on Generate & Print, ring showing (${s.on}, ring ${s.ring})`);
    await pg.keyboard.press('Tab');
    const next = await pg.evaluate(() => document.activeElement.id);
    check(next === p.spec.pdf.slice(1), `the next Tab is Save PDF, not the page's start (${next})`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
    await p.close();

    // 2. Generate Anyway from Save PDF, by keyboard: offline, the notice, and focus on Save PDF
    p = await open(); pg = p.page;
    await ask(pg, p.spec.pdf);
    check(await toBox(pg, v.anyway, 2), 'Shift+Tab ×2 from Save PDF reaches Generate Anyway');
    await pg.keyboard.press('Enter');
    await pg.waitForFunction(sel => /could not be downloaded/.test(document.querySelector(sel).innerText), v.status, { timeout: 15000 }).catch(() => {});
    await pg.waitForTimeout(100);
    s = await state(pg, p.spec.pdf);
    check(s.isWant && s.ring && !(await pg.$eval(p.spec.pdf, b => b.disabled)), `Generate Anyway from Save PDF: after the notice, focus on Save PDF (${s.on}, ring ${s.ring})`);
    await p.close();

    // 3. Fix after the marked row was filled meanwhile: nothing left to fix, focus on the button that asked
    p = await open(); pg = p.page;
    await ask(pg, p.spec.generate);
    await p.spec.prepare(pg);   // every row set again: the red border clears (S23)
    const red = await pg.$$eval(`${p.spec.students} input, ${p.spec.students} select`, els => els.filter(e => /204,\s*0,\s*0/.test(e.style.border)).length);
    check(red === 0, `the filled row lost its red border (${red} still marked)`);
    check(await toBox(pg, v.fix, 2), 'Shift+Tab ×2 from Generate & Print reaches Fix');
    await pg.keyboard.press('Enter');
    s = await state(pg, p.spec.generate);
    check(s.isWant && s.ring, `Fix with nothing left to fix: focus on Generate & Print (${s.on})`);
    await p.close();

    // 4. Fix with the row still empty: focus on the marked field (S16 holds)
    p = await open(); pg = p.page;
    await ask(pg, p.spec.generate);
    await toBox(pg, v.fix, 2); await pg.keyboard.press('Enter'); await pg.waitForTimeout(100);
    s = await state(pg, `${p.spec.students} ${p.spec.entry}:nth-child(2) ${v.empty}`);
    check(s.isWant, `Fix with the row still empty: focus on its ${v.empty.match(/"(\w+)"/)[1]} (${s.on})`);
    await p.close();

    // 5. the mouse: Generate Anyway clicked is left as it was (no ring, no focus moved)
    p = await open(); pg = p.page;
    const b5 = await p.prints();
    await pg.click(p.spec.generate); await pg.waitForSelector(v.box, { state: 'visible' });
    await pg.click(v.anyway);
    await pg.waitForFunction(n => window.__prints > n, b5, { timeout: 15000 }).catch(() => {});
    s = await state(pg, p.spec.generate);
    check(await p.prints() === b5 + 1 && !s.isWant && !s.anyRing, `a click on Generate Anyway prints and moves no focus (${s.on}, a ring: ${s.anyRing})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS33-validation-focus: ${fails.length} failing check(s)` : '\nS33-validation-focus: all green');
process.exit(fails.length ? 1 : 0);
