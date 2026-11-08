// Probe (loop S23; found S17, pass M on math-facts.html; confirmed S19 on index.html and S23 on math-minute.html): every
// roster field, select and the paste box was 14 px (the code box 13 px), and iPhone Safari zooms the page into a field
// under 16 px when it takes focus, and stays zoomed. On a phone, upright or on its side (a touch screen under 500 px
// tall), every text field, select and textarea is 16 px, in the form, the code panel and Advanced, on all three pages;
// no sideways scroll; no placeholder cut by the larger text (the twins' Header line example); desktop and the iPad keep
// their 14 px. Fails before the change (`--ref f57d63c`).
//   node scripts/loop/probes/S23-phone-fields.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, devices, ROOT, PAGES } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const PHONES = [['iPhone SE', devices['iPhone SE']], ['iPhone 13', devices['iPhone 13']], ['iPhone 13 on its side', devices['iPhone 13 landscape']],
  ['a 350 px frame', { viewport: { width: 350, height: 1400 }, isMobile: true, hasTouch: true }]];
const OTHERS = [['desktop 1280', { viewport: { width: 1280, height: 900 } }], ['a short desktop window', { viewport: { width: 1280, height: 450 } }],
  ['iPad Mini', devices['iPad Mini']], ['iPad Mini on its side', devices['iPad Mini landscape']]];
const IDS = { 'index.html': { gen: '#mwgGenCodeBtn', close: '#mwgCloseModal', mode: '#mwgToggleModeBtn' },
  'math-minute.html': { gen: '#generateAdvancedCodeButton', close: '#closeAdvancedCodeModal', mode: '#toggleInputModeButton' },
  'math-facts.html': { gen: '#generateAdvancedCodeButton', close: '#closeAdvancedCodeModal', mode: '#toggleInputModeButton' } };
const FIELDS = app => {
  const ctx = document.createElement('canvas').getContext('2d');
  return [...document.querySelectorAll(`${app} input:not([type="checkbox"]), ${app} select, ${app} textarea`)]
    .filter(el => el.getBoundingClientRect().width > 0).map(el => {
      const s = getComputedStyle(el); ctx.font = `${s.fontSize} ${s.fontFamily}`;
      const room = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      // a one-line field's example (a textarea's wraps)
      return { id: el.id || el.name, fs: parseFloat(s.fontSize), cut: el.tagName === 'INPUT' && !!el.placeholder && !el.value && ctx.measureText(el.placeholder).width > room };
    });
};

const srv = await serve(); const browser = await launch();
async function open(file, device) {
  const p = await openPage(browser, srv.base, file, { device });
  if (REF) {
    const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
    await PAGES[file].prepare(p.page);
  }
  return p;
}
for (const [file, ids] of Object.entries(IDS)) {
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  for (const [name, device] of PHONES) {
    const p = await open(file, device), pg = p.page, seen = [];
    seen.push(...await pg.evaluate(FIELDS, p.spec.app));
    await pg.click(ids.gen); await pg.waitForTimeout(500); seen.push(...await pg.evaluate(FIELDS, p.spec.app)); await pg.click(ids.close);
    await pg.click(ids.mode); seen.push(...await pg.evaluate(FIELDS, p.spec.app)); await pg.click(ids.mode);
    const small = seen.filter(f => f.fs < 16), cut = [...new Set(seen.filter(f => f.cut).map(f => f.id))];
    const doc = await pg.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    check(seen.length > 20 && small.length === 0, `${name}: all ${seen.length} fields 16 px in the form, the code panel and Advanced (${small.length} under: ${[...new Set(small.map(f => f.id + ' ' + f.fs))].slice(0, 4).join(', ')})`);
    check(cut.length === 0, `${name}: no placeholder cut (${cut.join(', ')})`);
    check(doc[0] <= doc[1] && p.errors.length === 0, `${name}: no sideways scroll (${doc.join('/')}), 0 page errors`);
    await p.close();
  }
  for (const [name, device] of OTHERS) {
    const p = await open(file, device);
    const f = await p.page.evaluate(FIELDS, p.spec.app);
    check(f.length > 5 && f.every(x => x.fs === 14), `${name}: the fields keep their 14 px (${[...new Set(f.map(x => x.fs))].join('/')})`);
    await p.close();
  }
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS23-phone-fields: ${fails.length} failing check(s)` : '\nS23-phone-fields: all green');
process.exit(fails.length ? 1 : 0);
