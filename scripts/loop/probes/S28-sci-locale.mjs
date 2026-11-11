// Probe (loop S28; found S27, pass G on index.html): Scientific Notation writes its whole numbers the US way in every
// browser locale. `toLocaleString()` without a locale followed the browser: de-DE and es-ES printed "460.000" beside the
// coefficient's "4.6", fr-FR "160 000", en-IN "71,00,000". For each locale, 20 students of Scientific Notation (grade 8)
// with keys, read back from the DOM:
//   - every whole number on the sheets ("640,000 = ? × 10?") and the keys ("4.6 × 10⁵ =" → "460,000") is grouped by
//     commas in threes, and a coefficient keeps its decimal point;
//   - the en-US sheets and keys are byte-identical to the same seed's on every other locale (one way of writing).
// On 2f78bd2, before the fix, de-DE, fr-FR, es-ES and en-IN fail.
//   node scripts/loop/probes/S28-sci-locale.mjs
import { serve, launch } from '../harness.mjs';

const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = `(() => { let s = 20261109; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const LOCALES = ['en-US', 'he-IL', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'en-IN'];
const US = /^\d{1,3}(,\d{3})*$/;
const srv = await serve(); const browser = await launch();
const html = {};
try {
  for (const locale of LOCALES) {
    const ctx = await browser.newContext({ locale });
    await ctx.route('**/*', r => r.request().url().startsWith(srv.base) ? r.continue() : r.abort());
    await ctx.addInitScript(() => { window.print = () => {}; });
    await ctx.addInitScript(SEED);
    const errors = []; const pg = await ctx.newPage(); pg.on('pageerror', e => errors.push(String(e.message || e)));
    await pg.goto(`${srv.base}/index.html`); await pg.waitForSelector('#mwgStudentsContainer .mwg-student-entry');
    await pg.click('#mwgToggleModeBtn'); await pg.setChecked('#mwgAnswerKeyToggle', true);
    await pg.fill('#mwgAdvancedBox', Array.from({ length: 20 }, (_, i) => `S${i}, ${i}, scientificnotation, 30, 8;`).join('\n'));
    await pg.click('#mwgGenerateBtn');
    await pg.waitForFunction(() => document.querySelectorAll('#mwgResults .mwg-answer-key-sheet').length === 20);
    const r = await pg.evaluate(() => {
      const whole = [], coeff = [];
      for (const t of document.querySelectorAll('#mwgResults .mwg-worksheet .mwg-horiz-problem')) {
        const s = t.textContent.trim(); let m;
        if ((m = s.match(/^(\S+) = \? × 10\?$/))) whole.push(m[1]);
        else if ((m = s.match(/^(\S+) × 10\d+ =$/))) coeff.push(m[1]);
      }
      // a key answer to "c × 10ⁿ =" is the whole number; the other form's answer is "c × 10<sup>n</sup>" (S35; "c x 10^n" before)
      for (const a of document.querySelectorAll('#mwgResults .mwg-answer-key-sheet .mwg-horiz-cell > span')) {
        const s = a.textContent.trim(); if (!a.querySelector('sup') && !/x 10\^/.test(s)) whole.push(s); }
      return { whole, coeff, html: document.querySelector('#mwgResults').innerHTML };
    });
    html[locale] = r.html;
    const bad = r.whole.filter(x => !US.test(x)), badC = r.coeff.filter(x => !/^\d\.\d$/.test(x));
    check(r.whole.length > 300 && !bad.length && !badC.length && !errors.length,
      `${locale}: ${r.whole.length} whole numbers grouped by commas in threes (${bad.length} not${bad.length ? ': ' + bad.slice(0, 3).join(' | ') : ''}), ${r.coeff.length} coefficients d.d (${badC.length} not)${errors.length ? '; page errors ' + errors.join('; ') : ''}`);
    await ctx.close();
  }
  const differ = LOCALES.filter(l => html[l] !== html['en-US']);
  check(!differ.length, `every locale's sheets and keys byte-identical to en-US's, the same seed (${differ.join(', ') || 'none'} differ)`);
} finally { await browser.close(); await srv.close(); }
console.log(`\nS28-sci-locale: ${fails.length ? fails.length + ' failing' : 'all green'}`);
process.exit(fails.length ? 1 : 0);
