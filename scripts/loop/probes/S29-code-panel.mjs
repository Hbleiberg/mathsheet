// Probe (loop S29; found S5, pass C): "Generate Advanced Code" opens its panel under the roster's button row, where the
// button is, not after the results: there it opened below every generated sheet (3,400 px down after 3 sheets) and the
// page scrolled away from the roster to it. Per page, at 1280 × 900 and 390 × 844, after a Generate of 3 students with
// keys (6 sheets), by real clicks:
//   - the panel's top is within 40 px of the button row's bottom, above the Generate buttons and the sheets;
//   - once the scroll settles the whole panel and the button that opened it are on screen, focus in the code;
//   - the code is the roster's; Use in Advanced Input fills the box and closes the panel; Close and Escape close it;
//   - every element of the open panel has the same computed style as on the reference page (the move changes only
//     where the panel sits), and nothing else in the app moves while it is closed.
// Fails on the pages before the change (`--ref a53342b`).
//   node scripts/loop/probes/S29-code-panel.mjs [--ref <commit>] [--only <file>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only'), BASE = 'a53342b';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const IDS = {
  'index.html': { panel: '#mwgCodePanel', open: '#mwgGenCodeBtn', row: '.mwg-button-row:not([style])', out: '#mwgCodeOutput', use: '#mwgUseCodeBtn',
    close: '#mwgCloseModal', box: '#mwgAdvancedBox', gen: '#mwgGenerateBtn', results: '#mwgResults', app: '#mwg-app' },
  'math-minute.html': { panel: '#advancedCodePanel', open: '#generateAdvancedCodeButton', row: '.button-row:not([style])', out: '#advancedCodeOutput',
    use: '#useAdvancedCodeButton', close: '#closeAdvancedCodeModal', box: '#advancedInputBox', gen: '#generatePrintButton', results: '#results', app: '#math-minute-app' },
};
IDS['math-facts.html'] = { ...IDS['math-minute.html'], app: '#math-facts-app' };
const VIEWS = [{ name: '1280', viewport: { width: 1280, height: 900 } }, { name: '390', viewport: { width: 390, height: 844 } }];
const srv = await serve(); const browser = await launch();

async function open(file, ref, view) {
  const p = await openPage(browser, srv.base, file, { viewport: view.viewport });
  if (ref) {
    const body = execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
    await p.spec.prepare(p.page);
  }
  // three named students (index's prepare fills grade / type / count; the twins' a level)
  await p.page.evaluate(() => document.querySelectorAll('input[name="studentName"]').forEach((x, i) => { x.value = ['Avi Cohen', 'יעל לוי', "Mary O'Brien"][i] || 'S' + i; x.dispatchEvent(new Event('input', { bubbles: true })); }));
  return p;
}
// every element of the panel: tag, id and the computed styles that draw it (not its position)
const STYLE = sel => [document.querySelector(sel), ...document.querySelectorAll(sel + ' *')].map(e => {
  const c = getComputedStyle(e); const r = e.getBoundingClientRect();
  return [e.tagName, e.id, c.fontFamily, c.fontSize, c.fontWeight, c.color, c.backgroundColor, c.borderTop, c.padding, c.margin, c.display, c.width, Math.round(r.width), Math.round(r.height)].join('|');
});
// Duplicate / Delete by their text: S30 padded their targets (a negative margin takes the padding back, so nothing moves)
const LAYOUT = app => [...document.querySelectorAll(app + ' *')].filter(e => e.offsetParent).slice(0, 400).map(e => {
  let r = e.getBoundingClientRect();
  if (/duplicate|delete/.test(e.className)) { const g = document.createRange(); g.selectNodeContents(e); r = g.getBoundingClientRect(); }
  return `${e.tagName}#${e.id}:${Math.round(r.top + scrollY)},${Math.round(r.left)},${Math.round(r.width)}x${Math.round(r.height)}`; });

try {
  for (const file of Object.keys(IDS)) {
    if (ONLY && ONLY !== file) continue;
    const s = IDS[file];
    for (const view of VIEWS) {
      console.log(`${file} at ${view.name} px${REF ? ` (served from ${REF})` : ''}`);
      const p = await open(file, REF, view), base = await open(file, REF ? null : BASE, view), pg = p.page;
      // closed, the app is laid out as on the reference page
      const [la, lb] = [await pg.evaluate(LAYOUT, s.app), await base.page.evaluate(LAYOUT, s.app)];
      check(la.length > 50 && JSON.stringify(la) === JSON.stringify(lb), `closed, the form is laid out as on ${REF ? 'HEAD' : BASE} (${la.length} elements${JSON.stringify(la) === JSON.stringify(lb) ? '' : '; first differs: ' + la.find((x, i) => x !== lb[i])})`);
      await pg.setChecked(p.spec.key, true);
      const n = await p.prints(); await pg.click(s.gen); await pg.waitForFunction(n => window.__prints > n, n);
      const sheets = await pg.locator(`${s.results} > *`).count();
      await pg.locator(s.open).scrollIntoViewIfNeeded(); await pg.waitForTimeout(300);
      await pg.click(s.open); await pg.waitForTimeout(1500);   // the smooth scroll settles
      const g = await pg.evaluate(s => {
        const r = q => document.querySelector(q).getBoundingClientRect(), panel = r(s.panel), row = [...document.querySelectorAll(s.row)].find(e => e.contains(document.querySelector(s.open))).getBoundingClientRect();
        const btn = r(s.open), gen = r(s.gen), res = r(s.results);
        return { gap: panel.top - row.bottom, belowGen: panel.top > gen.top, belowResults: panel.top >= res.bottom - 1, panelTop: panel.top, panelBottom: panel.bottom, vh: innerHeight,
          btnTop: btn.top, btnBottom: btn.bottom, focus: document.activeElement && document.activeElement.id, code: document.querySelector(s.out).value };
      }, s);
      check(sheets >= 6 && g.gap >= 0 && g.gap <= 40 && !g.belowGen && !g.belowResults, `after ${sheets} sheets the panel opens ${g.gap.toFixed(0)} px under the button row (want 0–40), ${g.belowGen ? 'below' : 'above'} the Generate buttons, ${g.belowResults ? 'after' : 'before'} the sheets`);
      check(g.panelTop >= 0 && g.panelBottom <= g.vh && g.btnTop >= 0 && g.btnBottom <= g.vh, `the panel (${g.panelTop.toFixed(0)}–${g.panelBottom.toFixed(0)}) and its button (${g.btnTop.toFixed(0)}–${g.btnBottom.toFixed(0)}) on screen (0–${g.vh})`);
      check(g.focus === s.out.slice(1) && /Avi Cohen/.test(g.code) && /יעל לוי/.test(g.code), `focus in the code (${g.focus}); the code is the roster's (${g.code.split('\n').length} lines)`);
      // the open panel draws as on the reference page
      await base.page.click(s.open); await base.page.waitForTimeout(800);
      const [sa, sb] = [await pg.evaluate(STYLE, s.panel), await base.page.evaluate(STYLE, s.panel)];
      const d = sa.findIndex((x, i) => x !== sb[i]);
      check(sa.length >= 8 && d < 0 && sa.length === sb.length, `every element of the open panel styled as on ${REF ? 'HEAD' : BASE} (${sa.length} elements${d >= 0 ? `; ${sa[d]} vs ${sb[d]}` : ''})`);
      // Escape, Close, Use
      await pg.keyboard.press('Escape');
      const esc = await pg.evaluate(s => [getComputedStyle(document.querySelector(s.panel)).display, document.activeElement.id], s);
      await pg.click(s.open); await pg.waitForTimeout(400); await pg.click(s.close);
      const cls = await pg.evaluate(s => [getComputedStyle(document.querySelector(s.panel)).display, document.activeElement.id], s);
      await pg.click(s.open); await pg.waitForTimeout(400); const code = await pg.inputValue(s.out); await pg.click(s.use);
      const use = await pg.evaluate(s => [getComputedStyle(document.querySelector(s.panel)).display, document.activeElement.id, document.querySelector(s.box).value], s);
      check(esc[0] === 'none' && esc[1] === s.open.slice(1) && cls[0] === 'none' && cls[1] === s.open.slice(1) && use[0] === 'none' && use[1] === s.box.slice(1) && use[2] === code,
        `Escape and Close close it, focus back on its button (${esc[1]}, ${cls[1]}); Use fills the Advanced box and closes it (${use[1]})`);
      check(!p.errors.length && !base.errors.length, `0 page errors (${[...p.errors, ...base.errors].join('; ')})`);
      await p.close(); await base.close();
    }
  }
} catch (e) { check(false, e.stack.split('\n').slice(0, 3).join(' ')); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS29-code-panel: ${fails.length} failing check(s)` : '\nS29-code-panel: all green');
process.exit(fails.length ? 1 : 0);
