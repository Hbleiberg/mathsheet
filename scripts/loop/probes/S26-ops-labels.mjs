// Probe (loop S26; found S10 in pass C on index.html, re-measured S16 and S19): index.html's Fraction / Decimal
// Operations checkboxes sit beside their labels. The injected `.mwg-student-grid label{display:block;font-weight:bold}`
// and `.mwg-student-grid input{width:100%}` load last, so each operation's checkbox stretched across its column and
// sat above a bold label, in the standalone panels and the Mixed panel's Fractions / Decimals groups alike (22
// labels, 0 beside). At 1280, 800 and 390 px: every operation label is a flex row, not bold, its checkbox ≤ 20 px wide
// with the label's text to its right on the same line (centres within 3 px); a click on the text toggles its own box.
// Fails before the change (`--ref 24cec4f`).
//   node scripts/loop/probes/S26-ops-labels.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const body = REF ? execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8' }) : null;

const srv = await serve(); const browser = await launch();
try {
  for (const W of [1280, 800, 390]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: 900 } });
    await ctx.route('**/*', r => r.request().url().startsWith(srv.base) ? r.continue() : r.abort());
    const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    if (body) await pg.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await pg.goto(srv.base + '/index.html'); await pg.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
    const rows = pg.locator('#mwgStudentsContainer .mwg-student-entry');
    for (const [i, g, t] of [[0, '5', 'fractions'], [1, '6', 'decimals'], [2, '6', 'mixed']]) {
      const r = rows.nth(i);
      await r.locator('select[name="grade"]').selectOption(g); await r.locator('select[name="problemType"]').selectOption(t);
      await r.locator('select[name="count"]').selectOption('30');
    }
    const m = await pg.evaluate(() => [...document.querySelectorAll('.mwg-ops-grid label')].map(l => {
      const cb = l.querySelector('input[type=checkbox]'), c = cb.getBoundingClientRect(), cs = getComputedStyle(l);
      const range = document.createRange(); range.selectNodeContents(l);
      const text = [...range.getClientRects()].filter(r => r.width > 0 && r.left >= c.right - 1);
      const t = text[text.length - 1];
      return { mixed: !!l.closest('.mwg-mixed-types'), flex: cs.display === 'flex', bold: +cs.fontWeight >= 600, cbW: c.width,
        beside: !!t && t.left >= c.right - 0.5 && Math.abs((t.top + t.bottom) / 2 - (c.top + c.bottom) / 2) <= 3 };
    }));
    const standalone = m.filter(x => !x.mixed).length, mixed = m.filter(x => x.mixed).length;
    check(standalone === 11 && mixed === 11, `${W} px: ${standalone} standalone and ${mixed} Mixed operation labels found (5 fraction + 6 decimal each)`);
    const bad = m.filter(x => !x.flex || x.bold || x.cbW > 20 || !x.beside);
    check(m.length > 0 && bad.length === 0, `${W} px: every operation's checkbox beside its label, ≤ 20 px wide, the label not bold (${bad.length} of ${m.length} not; widest box ${Math.max(...m.map(x => x.cbW)).toFixed(1)} px)`);
    // a click on the label's text toggles its own checkbox (the Subtraction operation, standalone and in Mixed)
    let toggled = 0;
    for (const sel of ['.mwg-ops-panel .mwg-ops-grid label:nth-child(2)', '.mwg-mixed-types .mwg-ops-grid label:nth-child(2)']) {
      const lab = pg.locator(sel).first(), cb = lab.locator('input');
      await lab.scrollIntoViewIfNeeded();   // a mouse click at a point below the viewport lands nowhere
      const before = await cb.isChecked(); const box = await lab.boundingBox(), cbb = await cb.boundingBox();
      await pg.mouse.click(Math.min(box.x + box.width - 4, cbb.x + cbb.width + 30), cbb.y + cbb.height / 2);
      if (await cb.isChecked() !== before) toggled++;
    }
    check(toggled === 2, `${W} px: a click on an operation's text toggles its checkbox (${toggled} of 2)`);
    check(errs.length === 0, `${W} px: 0 page errors (${errs.join(' | ')})`);
    await ctx.close();
  }
} catch (e) { check(false, e.message.split('\n')[0]); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS26-ops-labels: ${fails.length} failing` : '\nS26-ops-labels: all green');
process.exit(fails.length ? 1 : 0);
