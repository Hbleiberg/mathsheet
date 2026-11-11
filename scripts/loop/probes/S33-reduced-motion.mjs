// Probe (loop S33, pass D on math-facts.html; found S12, the same six calls on all three pages): every scroll a page
// makes on its own was `scrollIntoView({ behavior: "smooth" })`, an animation that ran even with the system's "reduce
// motion" setting on (the validation box's scroll ran 0 → 3,032 px over 700 ms on a 24-row roster). Per page, with 20
// rows, each of the six (the code panel, the validation box, Fix, the sheets after a generate with a saved roster, the
// unsaved-roster notice after a generate, the PDF status line) is fired from the top or bottom of the page with
// scrollY sampled every frame for 900 ms: under `prefers-reduced-motion: reduce` the page jumps (the first frame lands,
// at most one later move); with no preference it still glides (≥ 5 positions), which also shows the sampler sees an
// animation. Fails before the change (`--ref 43a8825`).
//   node scripts/loop/probes/S33-reduced-motion.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const IDS = {
  'index.html':       { add: '#mwgAddStudentBtn', code: '#mwgGenCodeBtn', fix: '#mwgValidationFix', box: '#mwgValidationBox', empty: 'select[name="grade"]' },
  'math-minute.html': { add: '#addStudentButton', code: '#generateAdvancedCodeButton', fix: '#mmValidationFix', box: '#mmValidationBox', empty: 'select[name="level"]' },
  'math-facts.html':  { add: '#addStudentButton', code: '#generateAdvancedCodeButton', fix: '#mmValidationFix', box: '#mmValidationBox', empty: 'select[name="level"]' },
};

/** Scroll to `from` ("top" | "bottom"), click `sel` by script (no Playwright scroll), sample scrollY each frame. */
const fire = (pg, sel, from) => pg.evaluate(({ sel, from }) => new Promise(resolve => {
  window.scrollTo(0, from === 'top' ? 0 : document.documentElement.scrollHeight);
  requestAnimationFrame(() => {
    const ys = [Math.round(scrollY)], t0 = performance.now();
    document.querySelector(sel).click();
    (function f() { ys.push(Math.round(scrollY)); if (performance.now() - t0 < 900) requestAnimationFrame(f); else resolve(ys); })();
  });
}), { sel, from });
// A jump lands in the first frame and may move once more (the PDF's offline notice grows the status box above the
// sheets, and scroll anchoring keeps the sheets in place: +52 px); a glide passes through dozens of positions.
const judge = ys => {
  const y0 = ys[0], yf = ys[ys.length - 1], after = [...new Set(ys.slice(1))];
  return { y0, y1: ys[1], yf, positions: after.length, moved: Math.abs(yf - y0) > 40, landed: Math.abs(ys[1] - y0) > 40 };
};

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(IDS)) {
    if (ONLY && ONLY !== file) continue;
    const id = IDS[file];
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    for (const motion of ['reduce', 'no-preference']) {
      const p = await openPage(browser, srv.base, file, { viewport: { width: 1280, height: 800 } });
      const pg = p.page; pg.on('dialog', d => d.accept());
      if (REF) {
        const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
        await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
        await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
      }
      await pg.route(/cdnjs\.cloudflare\.com\//, r => r.abort());   // Save PDF ends on its offline notice
      await pg.emulateMedia({ reducedMotion: motion });
      for (let i = 0; i < 17; i++) await pg.evaluate(s => document.querySelector(s).click(), id.add);
      await p.spec.prepare(pg);
      const rows = await pg.locator(`${p.spec.students} ${p.spec.entry}`).count();
      const results = [];
      const run = async (label, sel, from, before) => { if (before) await before(); results.push({ label, ...judge(await fire(pg, sel, from)) }); };

      await run('code panel', id.code, 'top');
      await pg.$eval(`${p.spec.students} ${p.spec.entry}:nth-child(1) ${id.empty}`, s => { s.value = ''; s.dispatchEvent(new Event('change', { bubbles: true })); });
      await run('validation box', p.spec.generate, 'top');
      await run('Fix', id.fix, 'bottom');
      await p.spec.prepare(pg);
      await pg.click(p.spec.save);   // a saved roster: the generate lands on the sheets
      await run('sheets after a generate', p.spec.generate, 'top');
      await pg.fill(`${p.spec.students} ${p.spec.entry}:nth-child(1) ${p.spec.name}`, 'Noa');   // unsaved: the notice
      await run('unsaved notice after a generate', p.spec.generate, 'top');
      await run('PDF status line', p.spec.pdf, 'top');

      console.log(` ${motion} (${rows} rows)`);
      for (const r of results) {
        check(r.moved && (motion === 'reduce' ? r.landed && r.positions <= 2 : r.positions >= 5),
          `${motion === 'reduce' ? 'jumps' : 'glides'}: ${r.label} ${r.y0} → ${r.yf} px, the first frame at ${r.y1}, ${r.positions} position(s)`);
      }
      check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
      await p.close();
    }
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS33-reduced-motion: ${fails.length} failing check(s)` : '\nS33-reduced-motion: all green');
process.exit(fails.length ? 1 : 0);
