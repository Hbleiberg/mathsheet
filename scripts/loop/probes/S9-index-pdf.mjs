// Probe (loop S9): index.html's real Save PDF (the cdnjs libraries, `--cdn` network) against Chromium's print of
// the very same sheets, as S8-minute-pdf does for math-minute. A roster of stacked, division, written-across,
// fraction and Mixed sheets with keys:
//   - the download is `worksheets.pdf`, one 792 × 612 pt page per sheet;
//   - no frame round the page, as on paper (the screen sheet's 1px #bbb border was cloned into every page, S8);
//   - the header's ink within 2 px of print (the clone's 1px border and 29px side padding narrowed it 2.4 px);
//   - every problem's ink no further from print than on the reference page (index's stacked rows still drift
//     5–6 px in the PDF: the open S4 P4; this probe only holds the line on it), and every page carries ink.
//   node scripts/loop/probes/S9-index-pdf.mjs [--ref <commit>]   (`--ref` serves index.html from a commit; the
//   control is `--ref 8e46ade`, before the fix: framed pages and a header off by more than 2 px)
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const ref = (i => i > 0 ? process.argv[i + 1] : null)(process.argv.indexOf('--ref'));
const BASE = '8e46ade';   // the comparison page for the problems' drift (before S9)
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const TMP = process.env.TMPDIR || '/tmp';
const SEED = `(() => { let s = 20261105; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const ROSTER = ['Avi, 1, add2, 30, 2;', 'Dana, 2, div4, 30, 5;', 'Noa, 3, rounding, 30, 5;', 'Levi, 4, longdivision, 30, 6;',
  'Rivka, 5, fractions, 30, 5;', 'Eli, 6, mixed, 40, 4;', 'Tamar, 7, add3, 60, 3;', 'Bat-Sheva Rivka Goldberg, 8, mul2, 40, 4;'].join('\n');

function pgm(file) {                  // P5 binary greymap → { w, h, px }
  const b = fs.readFileSync(file); let i = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(b[i]))) i++; let s = ''; while (!/\s/.test(String.fromCharCode(b[i]))) s += String.fromCharCode(b[i++]); tok.push(s); }
  return { w: +tok[1], h: +tok[2], px: b.subarray(i + 1) };
}
function ink(img, r, thr = 140) {     // bounding box of the dark pixels inside rect r
  let t = Infinity, b = -Infinity, l = Infinity, rr = -Infinity, n = 0;
  for (let y = Math.max(0, Math.ceil(r.t)); y < Math.min(img.h, Math.floor(r.b)); y++)
    for (let x = Math.max(0, Math.ceil(r.l)); x < Math.min(img.w, Math.floor(r.r)); x++)
      if (img.px[y * img.w + x] < thr) { n++; if (y < t) t = y; if (y > b) b = y; if (x < l) l = x; if (x > rr) rr = x; }
  return n ? { t, b, l, r: rr, n } : null;
}

// One export and its print twin; returns the rasters' comparison.
async function measure(browser, base, from, tag) {
  const p = await openPage(browser, base, 'index.html', { raw: true, cdn: true });
  await p.context.addInitScript(SEED);
  if (from) {
    const body = execSync(`git show ${from}:index.html`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
  await p.page.click(p.spec.modeToggle);
  await p.page.setChecked(p.spec.key, true);
  await p.page.fill(p.spec.advanced, ROSTER);
  const dl = p.page.waitForEvent('download', { timeout: 180000 });
  await p.page.click(p.spec.pdf);
  const d = await dl;
  const pdf = `${TMP}/s9-idx-${tag}-save.pdf`; await d.saveAs(pdf);
  const info = execSync(`pdfinfo ${pdf}`, { encoding: 'utf8' });
  const out = { name: d.suggestedFilename(), pages: +info.match(/Pages:\s+(\d+)/)[1], size: info.match(/Page size:\s+([\d.]+ x [\d.]+)/)[1], errors: p.errors.length };
  await p.page.emulateMedia({ media: 'print' });
  const geo = await p.page.evaluate(() => {
    const r = document.querySelector('#mwgResults'); r.id = 'mwg-results-print'; document.body.appendChild(r);
    return [...document.querySelectorAll('.mwg-worksheet, .mwg-answer-key-sheet')].map(s => {
      const sr = s.getBoundingClientRect(); const rel = q => ({ t: q.top - sr.top, b: q.bottom - sr.top, l: q.left - sr.left, r: q.right - sr.left });
      return { header: rel(s.querySelector('.mwg-ws-header').getBoundingClientRect()),
        cells: [...s.querySelectorAll('.mwg-problem-cell, .mwg-horiz-cell')].map(c => rel(c.getBoundingClientRect())) };
    });
  });
  out.sheets = geo.length;
  const printPdf = `${TMP}/s9-idx-${tag}-print.pdf`;
  await p.page.pdf({ path: printPdf, preferCSSPageSize: true, printBackground: true });
  execSync(`pdftoppm -r 96 -gray ${printPdf} ${TMP}/s9r-${tag}-print && pdftoppm -r 96 -gray ${pdf} ${TMP}/s9r-${tag}-save`);
  const pad = n => String(n).padStart(String(geo.length).length, '0');
  const diffs = []; out.blank = 0; out.framed = 0; out.headWorst = 0;
  for (let i = 0; i < geo.length; i++) {
    const a = pgm(`${TMP}/s9r-${tag}-print-${pad(i + 1)}.pgm`), b = pgm(`${TMP}/s9r-${tag}-save-${pad(i + 1)}.pgm`);
    let inked = 0;
    geo[i].cells.forEach((c, j) => { const x = ink(a, c), y = ink(b, c); if (y) inked++; if (x && y) diffs.push({ d: [y.t - x.t, y.b - x.b, y.l - x.l, y.r - x.r], at: `sheet ${i + 1} cell ${j + 1}` }); });
    if (inked < geo[i].cells.length * 0.9) out.blank++;
    let edge = 255; for (let y = 200; y < 600; y++) edge = Math.min(edge, b.px[y * b.w], b.px[y * b.w + b.w - 1]);
    for (let x = 200; x < 800; x++) edge = Math.min(edge, b.px[x], b.px[(b.h - 1) * b.w + x]);
    if (edge < 235) out.framed++;
    const hx = ink(a, geo[i].header), hy = ink(b, geo[i].header);
    if (hx && hy) out.headWorst = Math.max(out.headWorst, Math.abs(hx.t - hy.t), Math.abs(hx.b - hy.b), Math.abs(hx.l - hy.l), Math.abs(hx.r - hy.r));
  }
  // html2canvas draws glyphs a few px off Chromium's own (S8): measure each cell against the offset common to all.
  const med = [0, 1, 2, 3].map(k => { const v = diffs.map(c => c.d[k]).sort((x, y) => x - y); return v[v.length >> 1]; });
  out.cells = diffs.length; out.med = med; out.worst = 0;
  for (const c of diffs) { const dev = Math.max(...c.d.map((v, k) => Math.abs(v - med[k]))); if (dev > out.worst) { out.worst = dev; out.worstAt = `${c.at} (${c.d.join(', ')})`; } }
  await p.close();
  return out;
}

const srv = await serve(); const browser = await launch();
try {
  const now = await measure(browser, srv.base, ref, 'now');
  const was = await measure(browser, srv.base, BASE, 'base');
  console.log(`index.html${ref ? ` (from ${ref})` : ''}`);
  check(now.name === 'worksheets.pdf' && now.pages === now.sheets && now.size === '792 x 612', `${now.name}: ${now.pages} pages for ${now.sheets} sheets and keys, ${now.size} pt`);
  check(now.framed === 0, `no frame round the PDF page, as on paper (${now.framed} of ${now.pages} framed; ${BASE}: ${was.framed})`);
  check(now.headWorst <= 2, `the header's ink within 2 px of print (worst ${now.headWorst} px; ${BASE}: ${was.headWorst} px)`);
  check(now.blank === 0, `every page carries its problems (${now.blank} pages short of ink)`);
  check(now.worst <= was.worst + 1, `problems' ink no further from print than ${BASE}'s (worst ${now.worst} px vs ${was.worst}; ${now.cells} cells; common offset ${now.med.join(' / ')}${now.worst ? '; at ' + now.worstAt : ''})`);
  check(now.errors === 0, `0 page errors`);
} catch (e) { check(false, e.message.split('\n')[0]); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS9-index-pdf: ${fails.length} failing` : '\nS9-index-pdf: all green');
process.exit(fails.length ? 1 : 0);
