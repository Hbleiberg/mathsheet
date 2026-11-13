// Probe (loop S38, pass M on math-facts.html): a class generated on a phone prints its names as one generated on a
// desktop does. The twins' phone query (≤560 px) restyled the worksheet header on screen: the name and Number fields
// 8 px apart for 14, the description box stacked (a 91 px header for 46). The sheet is 11 in wide at every width and
// prints without that query, but `fitLongNames()` sizes each name on screen: on a phone a name got 0.5 px more than
// its printed line holds, and printed with its last letter turned to "…" (Save PDF cut it mid-letter): 140 of 164
// sheets of a long-name class. Per twin, with Math.random seeded: the same class generated on a phone and at 1280 px,
// with the Number and without; the phone's sheets byte-identical to the desktop's; at the paper's width under print
// no name past its line; the phone's header as tall as the desktop's, its description box a row; the form keeps its
// phone layout; the desktop pixel-identical to before. `--cdn` adds a real Save PDF on both, page by page. The desktop
// runs at the phone's pixel density: a small name's line height is measured on screen and differs by density alone
// (24 px at 1×, 26 at 3×; logged S38).
// Fails before the change (`--ref a00e10c`).
//   node scripts/loop/probes/S38-phone-sheet-header.mjs [--only <file>] [--ref <commit>] [--cdn]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serve, launch, openPage, devices, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only'), CDN = process.argv.includes('--cdn'), BEFORE = 'a00e10c';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const CODE = { 'math-minute.html': '5', 'math-facts.html': '+3' };
// 24 to 64 characters, a letter at a time: from no shrink to the 11 px floor, through the phone's extra 4 px
const NAMES = Array.from({ length: 41 }, (_, k) => 'Shoshana Rosenthal-Goldberg ' + 'Levinsohnabcdefghijklmnopqrstuvwxyz'.slice(0, k));
const DESK = { viewport: { width: 1280, height: 900 } }, deskAt = dev => ({ ...DESK, deviceScaleFactor: dev.deviceScaleFactor || 1 });
const SEED = () => { let a = 20261111; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

async function open(browser, base, file, dev, ref, opts = {}) {
  const p = await openPage(browser, base, file, { raw: true, device: dev, ...opts });
  const { page } = p; page.on('dialog', d => d.accept());
  await page.addInitScript(SEED);
  if (ref) { let body = execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    // S45's Level Reference in as many columns as fit (math-facts, approved at gate 3) moved the Advanced-mode form this
    // arm shoots, and the sheet below it, by design: replay that rule into the reference (repaired S45, S42's rule)
    if (file === 'math-facts.html' && !body.includes('repeat(auto-fill,minmax(84px,1fr))')) {
      const rule = fs.readFileSync(`${ROOT}/math-facts.html`, 'utf8').match(/grid-template-columns:repeat\(auto-fill,minmax\(84px,1fr\)\);[^\n]*/);
      if (!rule) throw new Error("math-facts.html lacks S45's Level Reference rule");
      body = body.replace('grid-template-columns:minmax(0,1fr) minmax(0,1fr);\ngap:6px 18px;', () => rule[0] + '\ngap:6px 18px;')
        .replace('    grid-template-columns:minmax(0,1fr) minmax(0,1fr);\n    gap:6px 12px;', '    gap:6px 12px;')
        .replace('    grid-template-columns:minmax(120px,1fr) minmax(120px,1fr);\n', '');
    }
    await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body })); }
  await page.reload({ waitUntil: 'load' }); await page.waitForSelector('#studentsContainer .student-entry');
  return p;
}
async function fill(page, file, names, { perStudent = '2', key = true, noNumber = false } = {}) {
  await page.click('#toggleInputModeButton');
  await page.fill('#advancedInputBox', names.map((n, i) => `${n}, ${i + 1}, ${CODE[file]};`).join('\n'));
  await page.selectOption('#worksheetsPerStudent', perStudent);
  if (key) await page.check('#answerKeyToggle');
  if (noNumber) await page.check('#removeNumberToggle');
}
async function generated(browser, base, file, dev, noNumber) {
  const p = await open(browser, base, file, dev, REF);
  const { page } = p;
  await fill(page, file, NAMES, { noNumber });
  await page.click('#generatePrintButton'); await page.waitForFunction(() => window.__prints > 0);
  const out = await page.evaluate(() => {
    const s = document.querySelector('#results .worksheet');
    const grid = getComputedStyle(document.querySelector('#studentsContainer .student-grid')).gridTemplateColumns.split(' ').length;
    return { html: document.getElementById('results').innerHTML, sheets: document.querySelectorAll('#results .worksheet').length,
      shrunk: document.querySelectorAll('#results .student-field-value[style*="font-size"]').length,
      header: s.querySelector('.worksheet-header').getBoundingClientRect().height, desc: getComputedStyle(s.querySelector('.description-box')).flexDirection,
      grid, actions: getComputedStyle(document.querySelector('.primary-actions')).flexDirection };
  });
  // under print at the paper's width (Chromium lays print out at the page's 11 in; emulateMedia alone keeps 390 px)
  await page.setViewportSize({ width: 1056, height: 816 });
  await page.emulateMedia({ media: 'print' });
  out.over = await page.evaluate(() => {
    const r = document.getElementById('results'); r.id = 'results-print'; document.body.appendChild(r);
    return [...document.querySelectorAll('.worksheet .worksheet-header-main > .student-field:first-child > .student-field-value')].filter(f => f.textContent).map(f => {
      const cs = getComputedStyle(f), room = f.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return f.firstElementChild.getBoundingClientRect().width - room;
    });
  });
  out.errors = p.errors.slice();
  await p.close();
  return out;
}

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(CODE)) {
    if (ONLY && ONLY !== file) continue;
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    for (const [shape, dev, noNumber] of [['iPhone 13', devices['iPhone 13'], false], ['the 350 px frame', { viewport: { width: 350, height: 1400 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, true]]) {
      const what = noNumber ? ', no Number' : '';
      const ph = await generated(browser, srv.base, file, dev, noNumber), dk = await generated(browser, srv.base, file, deskAt(dev), noNumber);
      check(ph.sheets === 164 && dk.sheets === 164 && dk.shrunk > 100, `${shape}${what}: 164 sheets and keys on each, ${dk.shrunk} names fitted smaller on the desktop`);
      check(ph.html === dk.html, `${shape}${what}: the phone's sheets byte-identical to the desktop's (${ph.html.length} / ${dk.html.length} chars)`);
      const past = ph.over.filter(x => x > 0.25);
      check(ph.over.length === 164 && past.length === 0, `${shape}${what}: printed at the paper's width, no name past its line (${past.length} of ${ph.over.length}, up to ${Math.max(0, ...ph.over).toFixed(2)} px)`);
      check(Math.abs(ph.header - dk.header) < 0.25 && ph.desc === 'row', `${shape}${what}: the header ${ph.header.toFixed(2)} px tall as on the desktop (${dk.header.toFixed(2)}), its description box a ${ph.desc}`);
      check(ph.grid === 1 && ph.actions === 'column' && dk.grid === 3, `${shape}: the form keeps its phone layout (the roster in ${ph.grid} column, the big buttons stacked; ${dk.grid} on the desktop)`);
      check(!ph.errors.length && !dk.errors.length, `${shape}${what}: 0 page errors (${ph.errors.concat(dk.errors).join('; ')})`);
    }
    // the desktop as before the change: the form and the first sheet, pixel for pixel
    if (!REF) {
      const shot = async ref => {   // reduced motion: the generate's scroll jumps, so nothing is caught mid-way
        const p = await open(browser, srv.base, file, { ...DESK, reducedMotion: 'reduce' }, ref);
        await fill(p.page, file, NAMES.slice(0, 6));
        await p.page.click('#generatePrintButton'); await p.page.waitForFunction(() => window.__prints > 0);
        await p.page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); }); await p.page.waitForTimeout(200);
        const a = await (await p.page.$('#mathMinuteForm')).screenshot(), b = await (await p.page.$('#results .worksheet')).screenshot();
        await p.close(); return [a, b];
      };
      const [a1, b1] = await shot(BEFORE), [a2, b2] = await shot(null);
      check(a1.equals(a2) && b1.equals(b2), `the desktop pixel-identical to ${BEFORE}'s (the form ${a1.equals(a2) ? 'same' : 'DIFFERENT'}, the first sheet ${b1.equals(b2) ? 'same' : 'DIFFERENT'})`);
    }
    // a real Save PDF from the phone and from the desktop: the same pages
    if (CDN) {
      const pick = NAMES.filter((_, k) => k % 5 === 2).concat('Avi Cohen');
      const pdf = async dev => {
        const p = await open(browser, srv.base, file, dev, REF, { cdn: true });
        await fill(p.page, file, pick, { perStudent: '1', key: false });
        const [dl] = await Promise.all([p.page.waitForEvent('download', { timeout: 180000 }), p.page.click('#savePdfButton')]);
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 's38-')), f = path.join(dir, 'out.pdf');
        await dl.saveAs(f);
        execSync(`pdftoppm -r 48 -png ${f} ${path.join(dir, 'pg')}`);
        const pages = fs.readdirSync(dir).filter(x => x.startsWith('pg')).sort().map(x => fs.readFileSync(path.join(dir, x)));
        fs.rmSync(dir, { recursive: true }); await p.close(); return pages;
      };
      const reach = await (async () => { try { execSync('curl -sSfI https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js -o /dev/null', { timeout: 20000 }); return true; } catch (e) { return false; } })();
      if (!reach) { console.log('  SKIP the PDF arm: cdnjs unreachable'); continue; }
      const ph = await pdf(devices['iPhone 13']), dk = await pdf(deskAt(devices['iPhone 13']));
      const same = ph.map((x, i) => dk[i] && x.equals(dk[i]));
      check(ph.length === pick.length && dk.length === pick.length && same.every(Boolean), `a real Save PDF: the phone's ${ph.length} pages the desktop's ${dk.length}, raster for raster (${same.map(s => s ? '=' : 'x').join('')})`);
    }
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS38-phone-sheet-header: ${fails.length} failing check(s)` : '\nS38-phone-sheet-header: all green');
process.exit(fails.length ? 1 : 0);
