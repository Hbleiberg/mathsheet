// Probe (loop S8, pass B on math-minute.html): the real Save PDF (the cdnjs libraries, `--cdn` network)
// against Chromium's print of the very same sheets. 21 levels × 1 copy with keys and a Hebrew header line:
//   - the download is `math-minute-worksheets.pdf`, one 792 × 612 pt page per sheet, one JPEG per page;
//   - scrolled to the bottom mid-export, every page still carries its problems (content-visibility);
//   - rasterized at 96 dpi, every problem cell's ink sits where print puts it (bounding box of the dark
//     pixels in each cell, Save PDF vs print, against the offset common to all cells), and the header's ink too;
//   - no frame round the page (the screen sheet's 1px #bbb border was cloned into every PDF page, S8);
//   - the key's red answers survive the JPEG (red pixels on every key page).
// Writes the zoomed crops it looked at to $TMPDIR (s8-mm-pdf-*.png).
//   node scripts/loop/probes/S8-minute-pdf.mjs [--control] [--ref <commit>]
// `--control` drops the clone's print rows (the S4 drift); `--ref` serves math-minute.html from a commit (S8's
// frame: `--ref HEAD~` before the fix fails the frame and the Level 4 key's wrap).
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { serve, launch, openPage } from '../harness.mjs';

const control = process.argv.includes('--control');
const ref = (i => i > 0 ? process.argv[i + 1] : null)(process.argv.indexOf('--ref'));
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const TMP = process.env.TMPDIR || '/tmp';
const SEED = `(() => { let s = 20261105; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const LINE = 'Week of Parashat Noach · פרשת נח';

function pgm(file) {                  // P5 binary greymap → { w, h, px }
  const b = fs.readFileSync(file); let i = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(b[i]))) i++; let s = ''; while (!/\s/.test(String.fromCharCode(b[i]))) s += String.fromCharCode(b[i++]); tok.push(s); }
  return { w: +tok[1], h: +tok[2], px: b.subarray(i + 1) };
}
function ppm(file) {                  // P6 colour → { w, h, px (rgb) }
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

const srv = await serve(); const browser = await launch();
try {
  const p = await openPage(browser, srv.base, 'math-minute.html', { raw: true, cdn: true });
  await p.context.addInitScript(SEED);
  if (control || ref) {
    const page = ref ? execSync(`git show ${ref}:math-minute.html`, { cwd: new URL('../../..', import.meta.url).pathname, encoding: 'utf8' })
      : fs.readFileSync(new URL('../../../math-minute.html', import.meta.url), 'utf8');
    const body = control ? page.replace('for (var rc in printRows) if', 'for (var rc in printRows) if (false) if') : page;
    await p.page.route(/\/math-minute\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
  await p.page.click(p.spec.modeToggle);
  await p.page.setChecked(p.spec.key, true);
  await p.page.fill('#headerLineInput', LINE);
  await p.page.fill(p.spec.advanced, Array.from({ length: 21 }, (_, i) => `Student ${i + 1}, ${i + 1}, ${i + 1};`).join('\n'));
  const dl = p.page.waitForEvent('download', { timeout: 180000 });
  const t0 = Date.now();
  await p.page.click(p.spec.pdf);
  await p.page.waitForSelector('.worksheet');
  await p.page.waitForTimeout(1500);
  await p.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));     // scrolled away mid-export
  const d = await dl;
  const secs = (Date.now() - t0) / 1000;
  const pdf = `${TMP}/s8-mm-save.pdf`; await d.saveAs(pdf);
  const sheets = await p.page.locator('#results .worksheet').count();
  const info = execSync(`pdfinfo ${pdf}`, { encoding: 'utf8' });
  const pages = +info.match(/Pages:\s+(\d+)/)[1], size = info.match(/Page size:\s+([\d.]+ x [\d.]+)/)[1];
  const imgs = execSync(`pdfimages -list ${pdf}`, { encoding: 'utf8' }).trim().split('\n').slice(2).map(l => l.trim().split(/\s+/));
  const bytes = fs.statSync(pdf).size;
  check(d.suggestedFilename() === 'math-minute-worksheets.pdf', `file name ${d.suggestedFilename()}`);
  check(sheets === 42 && pages === sheets && size === '792 x 612', `${pages} pages for ${sheets} sheets, ${size} pt`);
  check(imgs.length === pages && imgs.every(r => r[3] === '1584' && r[4] === '1224'), `one 1584 × 1224 JPEG per page (${imgs.length}; ${[...new Set(imgs.map(r => `${r[3]}×${r[4]} ${r[2]}`))].join(', ')})`);
  console.log(`       ${(bytes / 1024).toFixed(0)} KB, ${(bytes / 1024 / pages).toFixed(0)} KB a page, ${secs.toFixed(1)} s from the click`);

  // The same sheets under print: the cell rects, then Chromium's own PDF.
  await p.page.emulateMedia({ media: 'print' });
  const geo = await p.page.evaluate(() => {
    const r = document.querySelector('#results'); r.id = 'results-print'; document.body.appendChild(r);
    return [...document.querySelectorAll('.worksheet')].map(s => {
      const sr = s.getBoundingClientRect(); const rel = q => ({ t: q.top - sr.top, b: q.bottom - sr.top, l: q.left - sr.left, r: q.right - sr.left });
      return { key: /ANSWER KEY/.test(s.querySelector('.description-text').textContent),
        header: rel(s.querySelector('.worksheet-header').getBoundingClientRect()),
        cells: [...s.querySelectorAll('.problems-grid > .problem-cell')].map(c => rel(c.getBoundingClientRect())) };
    });
  });
  const printPdf = `${TMP}/s8-mm-print.pdf`;
  await p.page.pdf({ path: printPdf, preferCSSPageSize: true, printBackground: true });
  execSync(`pdftoppm -r 96 -gray ${printPdf} ${TMP}/s8r-print && pdftoppm -r 96 -gray ${pdf} ${TMP}/s8r-save && pdftoppm -r 96 ${pdf} ${TMP}/s8r-savec`);
  const pad = n => String(n).padStart(2, '0');
  const diffs = []; let blank = 0, headWorst = 0, redless = 0, framed = 0;
  for (let i = 0; i < geo.length; i++) {
    const a = pgm(`${TMP}/s8r-print-${pad(i + 1)}.pgm`), b = pgm(`${TMP}/s8r-save-${pad(i + 1)}.pgm`);
    let inked = 0;
    geo[i].cells.forEach((c, j) => {
      const x = ink(a, c), y = ink(b, c);
      if (y) inked++;
      if (x && y) diffs.push({ d: [y.t - x.t, y.b - x.b, y.l - x.l, y.r - x.r], at: `sheet ${i + 1} cell ${j + 1}` });
    });
    if (inked < geo[i].cells.length) blank++;
    // print has no frame (border:none); the screen sheet's 1px #bbb border printed one round every PDF page
    let edge = 255; for (let y = 200; y < 600; y++) edge = Math.min(edge, b.px[y * b.w], b.px[y * b.w + b.w - 1]);
    for (let x = 200; x < 800; x++) edge = Math.min(edge, b.px[x], b.px[(b.h - 1) * b.w + x]);
    if (edge < 235) framed++;
    const hx = ink(a, geo[i].header), hy = ink(b, geo[i].header);
    if (hx && hy) headWorst = Math.max(headWorst, Math.abs(hx.t - hy.t), Math.abs(hx.b - hy.b), Math.abs(hx.l - hy.l), Math.abs(hx.r - hy.r));
    if (geo[i].key) {
      const c = ppm(`${TMP}/s8r-savec-${pad(i + 1)}.ppm`); let red = 0;
      for (let k = 0; k < c.w * c.h; k++) { const R = c.px[k * 3], G = c.px[k * 3 + 1], B = c.px[k * 3 + 2]; if (R > 130 && G < 90 && B < 90) red++; }
      if (red < 500) redless++;
    }
  }
  check(blank === 0, `every Save PDF page carries every problem, scrolled away mid-export (${blank} pages missing ink)`);
  // html2canvas draws glyphs a few px off Chromium's own (top edge +3 px at 96 dpi, 0-4 by digit shape) while the
  // layout is identical (S8: 0.0 px in the DOM): a layout drift shows as a cell departing > 3 px from that offset.
  const med = [0, 1, 2, 3].map(k => { const v = diffs.map(c => c.d[k]).sort((a, b) => a - b); return v[v.length >> 1]; });
  let worst = 0, worstAt = '';
  for (const c of diffs) { const dev = Math.max(...c.d.map((v, k) => Math.abs(v - med[k]))); if (dev > worst) { worst = dev; worstAt = `${c.at} (${c.d.join(', ')})`; } }
  check(diffs.length > 1000 && worst <= 3, `every problem's ink where print puts it, within 3 px of the renderer's common offset (top/bottom/left/right ${med.join(' / ')} px; ${diffs.length} cells; worst ${worst} px${worst ? ' at ' + worstAt : ''})`);
  check(headWorst <= 2, `the header's ink within 2 px of print (worst ${headWorst} px)`);
  check(framed === 0, `no frame round the PDF page, as on paper (${framed} of ${geo.length} pages framed)`);
  check(redless === 0, `red answers on every key page (${redless} without)`);

  // Zoomed crops for the eye: the native 144 ppi raster of a 60-problem key and a division key.
  for (const [n, label] of [[30, 'key-rows6'], [40, 'key-div60']]) {
    execSync(`pdftoppm -r 144 -f ${n} -l ${n} -png ${pdf} ${TMP}/s8-mm-pdf-${label}`);
  }
  check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
  await p.close();
} catch (e) { check(false, e.message.split('\n')[0]); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS8-minute-pdf: ${fails.length} failing` : '\nS8-minute-pdf: all green');
process.exit(fails.length ? 1 : 0);
