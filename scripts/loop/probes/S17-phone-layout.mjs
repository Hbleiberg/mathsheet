// Probe (loop S17, pass M): the roster form at phone and tablet widths, on all three pages.
// Arm 1 — the button rows: every button of every visible row lies inside the row's own box, in Standard and
// Advanced mode, on five device shapes and the production frame (mathsheet.io's WordPress column on a phone is
// ~350 px wide; the iframe is 100 % wide). The row was `nowrap` + `overflow-x:auto` + `justify-content:center`,
// so under ~762 px it overflowed on both sides and only the right side scrolled: Add Student and half of
// Generate Advanced Code were unreachable on every phone in portrait. At 1280 px each row stays one line.
// Fails on the pages before the fix (`--ref e2bb697`).
// Arm 2 — index.html's responsive rules (≤860 the Advanced box stacks over its reference card, ≤700 the roster
// grid takes two columns, ≤480 one): they lost to the injected base rules appended after the static sheet, so
// a phone showed five 60 px roster fields and a 46 px paste box. Fails on `--ref 8e40f96`.
// Arm 3 — math-facts.html's Advanced help names no side for the Level Reference, which sits beside the box on a
// desktop and below it at ≤860 px ("…in the Level Reference.", approved S17, gate 2). Fails on `--ref 13bcc9b`.
//   node scripts/loop/probes/S17-phone-layout.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, devices, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };

const SHAPES = [
  ['iPhone SE', devices['iPhone SE']],
  ['iPhone 13', devices['iPhone 13']],
  ['iPhone 13 landscape', devices['iPhone 13 landscape']],
  ['iPad Mini', devices['iPad Mini']],
  ['frame 350', { viewport: { width: 350, height: 1400 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['desktop 1280', { viewport: { width: 1280, height: 900 } }],
];

const rowReport = () => [...document.querySelectorAll('.button-row, .mwg-button-row')].filter(r => r.offsetParent).map(row => {
  const rb = row.getBoundingClientRect();
  const kids = [...row.children].filter(k => k.offsetParent);
  return {
    buttons: kids.length,
    outside: kids.filter(k => { const b = k.getBoundingClientRect(); return b.left < rb.left - 1 || b.right > rb.right + 1; })
      .map(k => k.textContent.trim()),
    // one line when every button overlaps every other vertically (the mode pill is shorter, centred)
    oneLine: Math.max(...kids.map(k => k.getBoundingClientRect().top)) < Math.min(...kids.map(k => k.getBoundingClientRect().bottom)),
  };
});

const srv = await serve(); const browser = await launch();
for (const file of ['index.html', 'math-minute.html', 'math-facts.html']) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  for (const [shape, device] of SHAPES) {
    const p = await openPage(browser, srv.base, file, { device, raw: true });
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
    }
    if (file === 'index.html') {
      const vw = (device.viewport || {}).width;
      const g = await p.page.evaluate(() => {
        const grid = document.querySelector('.mwg-student-grid');
        return { cols: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
          narrowest: Math.min(...[...grid.querySelectorAll('input, select')].filter(e => e.offsetParent).map(e => Math.round(e.getBoundingClientRect().width))) };
      });
      const want = vw <= 480 ? 1 : vw <= 700 ? 2 : 5;
      check(g.cols === want, `${shape}: roster grid ${g.cols} column(s), ${want} expected at ${vw} px (narrowest field ${g.narrowest} px)`);
    }
    for (const mode of ['standard', 'advanced']) {
      if (mode === 'advanced') await p.page.click(p.spec.modeToggle);
      if (file === 'index.html' && mode === 'advanced') {
        const vw = (device.viewport || {}).width;
        const a = await p.page.evaluate(() => ({
          cols: getComputedStyle(document.querySelector('.mwg-advanced-layout')).gridTemplateColumns.split(' ').length,
          box: Math.round(document.querySelector('#mwgAdvancedBox').getBoundingClientRect().width),
        }));
        const want = vw <= 860 ? 1 : 2;
        check(a.cols === want, `${shape}, advanced: layout ${a.cols} column(s), ${want} expected (paste box ${a.box} px wide)`);
      }
      if (file === 'math-facts.html' && mode === 'advanced' && shape === 'iPhone 13') {
        const help = await p.page.$eval('.advanced-help', e => e.innerText);
        check(/listed in the Level Reference\./.test(help) && !/to the right|on the right|to the left|below/i.test(help),
          `${shape}, advanced: the help names no side for the Level Reference (${JSON.stringify(help.split('\n')[1])})`);
      }
      const rows = await p.page.evaluate(rowReport);
      const buttons = rows.reduce((n, r) => n + r.buttons, 0);
      const outside = rows.flatMap(r => r.outside);
      check(rows.length >= 2 && buttons >= (mode === 'standard' ? 7 : 5),
        `${shape}, ${mode}: ${rows.length} button rows, ${buttons} buttons found`);
      check(outside.length === 0, `${shape}, ${mode}: every button inside its row (${outside.length ? 'cut: ' + outside.join(', ') : 'none cut'})`);
      if (shape === 'desktop 1280') check(rows.every(r => r.oneLine), `${shape}, ${mode}: each row one line (${rows.map(r => r.oneLine).join(', ')})`);
    }
    check(p.errors.length === 0, `${shape}: 0 page errors (${p.errors.join('; ')})`);
    await p.close();
  }
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS17-phone-layout: ${fails.length} failing check(s)` : '\nS17-phone-layout: all green');
process.exit(fails.length ? 1 : 0);
