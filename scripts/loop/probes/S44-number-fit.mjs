// Probe (loop S44, pass B on math-facts.html; approved at gate 6): a long Student Number shrinks to fit its line, as a
// long name has since S9. At 18 px the Number's line holds about nine characters, so a 10-digit ID printed "1234567…"
// on paper (a CSS ellipsis) and Save PDF, which draws none, cut it mid-letter. Per page, a class whose Numbers are a
// 10-digit ID, "Room 12 B", "Gr3-Cohen-07", "07 (Tues group)", one too long even at 11 px, a Hebrew one, "1042" and
// none, with keys, under print at the paper's width: every Number is inside its line (nothing cut by CSS), whole when
// it fits at 11 px and otherwise its start with a written "…" at 11 px; a Number that fits at 18 px gets no style (its
// sheet as before); every shrunk Number rests on the 18 px Number's baseline (within 0.5 px). Then the real Save PDF
// (cdnjs; the arm says SKIP without it): rasterized, every Number's ink ends ≥ 2 px short of its line's end (a cut
// glyph runs into it) and within 3 px of where print ends it.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S44-number-fit.mjs [--ref <commit>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 's44-number-'));
const NUMBERS = ['1234567890', 'Room 12 B', 'Gr3-Cohen-07', '07 (Tues group)', 'Student ID 2024-00153 group B', 'כיתה ג׳ 1234', '1042', ''];
const SELECTOR = { 'index.html': 'add2, 30, 3', 'math-minute.html': '1', 'math-facts.html': '+3' };
const FIELD = { 'index.html': '.mwg-ws-field-value', 'math-minute.html': '.student-field-value', 'math-facts.html': '.student-field-value' };
const SHEETS = { 'index.html': '.mwg-worksheet, .mwg-answer-key-sheet', 'math-minute.html': '.worksheet', 'math-facts.html': '.worksheet' };

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

const srv = await serve(); const browser = await launch();
let cdn = true;
try {
  const probe = await openPage(browser, srv.base, 'math-facts.html', { raw: true, cdn: true });
  cdn = await probe.page.evaluate(() => fetch('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', { method: 'HEAD' }).then(r => r.ok, () => false));
  await probe.close();
  for (const file of Object.keys(SELECTOR)) {
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const p = await openPage(browser, srv.base, file, { raw: true, cdn });
    const { page, spec } = p;
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await page.reload({ waitUntil: 'load' }); await page.waitForSelector(`${spec.students} ${spec.entry}`);
    }
    await page.click(spec.modeToggle);
    await page.check(spec.key);
    await page.fill(spec.advanced, NUMBERS.map((n, i) => `Student ${i + 1}, ${n}, ${SELECTOR[file]};`).join('\n'));
    let pdf = null;
    if (cdn) {
      const dl = page.waitForEvent('download', { timeout: 120000 });
      await page.click(spec.pdf);
      pdf = path.join(TMP, `${file}-save.pdf`); await (await dl).saveAs(pdf);
    } else {
      const n = await p.prints(); await page.click(spec.generate); await page.waitForFunction(n => window.__prints > n, n);
    }
    await page.setViewportSize({ width: 1056, height: 816 });
    await page.emulateMedia({ media: 'print' });
    const m = await page.evaluate(([resSel, printId, sheetSel, fieldSel]) => {
      const res = document.querySelector(resSel); res.id = printId; document.body.appendChild(res);
      return [...res.querySelectorAll(sheetSel)].map(s => {
        const sr = s.getBoundingClientRect(), f = s.querySelectorAll(fieldSel)[1], fr = f.getBoundingClientRect(), cs = getComputedStyle(f);
        const mark = document.createElement('span'); mark.style.cssText = 'display:inline-block;width:0;height:0';
        const out = { text: f.textContent, size: parseFloat(cs.fontSize), styled: f.hasAttribute('style'), inside: f.scrollWidth <= f.clientWidth + 1,
          box: { t: fr.top - sr.top, b: fr.bottom - sr.top - 2, l: fr.left - sr.left, r: fr.right - sr.left } };
        f.appendChild(mark); out.baseline = mark.getBoundingClientRect().top - sr.top; f.removeChild(mark);
        return out;
      });
    }, [spec.results, spec.printId, SHEETS[file], FIELD[file]]);
    check(m.length === NUMBERS.length * 2, `${m.length} sheets and keys (${NUMBERS.length * 2} expected)`);
    const ref18 = m.filter(x => x.text === '1042');
    const bad = [], partial = [];
    m.forEach((x, i) => {
      const want = NUMBERS[i % NUMBERS.length];
      if (!x.inside) bad.push(`"${x.text}" cut by CSS`);
      if (want === '1042' || want === '') { if (x.styled || x.text !== want) bad.push(`"${want}" changed (${x.styled ? 'styled' : x.text})`); return; }
      if (x.text === want) { if (x.size < 11) bad.push(`"${want}" at ${x.size} px`); }
      else if (x.text.endsWith('…') && want.startsWith(x.text.slice(0, -1).trimEnd()) && x.size === 11) partial.push(x.text);
      else bad.push(`"${want}" printed "${x.text}" at ${x.size} px`);
    });
    check(bad.length === 0, `every Number inside its line, whole or (too long at 11 px) its start and a written "…"; "1042" and none untouched (${bad.slice(0, 4).join('; ') || 'sizes ' + m.slice(0, NUMBERS.length - 2).map(x => x.size).join(' / ') + ' px'})`);
    check(partial.length === 2 && partial.every(t => t.startsWith('Student ID')), `only the 29-character Number ends in "…", at 11 px, on its sheet and key (${partial.join(' | ')})`);
    const drift = Math.max(...m.filter(x => x.text).map((x, i) => Math.abs(x.baseline - ref18[0].baseline)));
    check(ref18.length === 2 && drift <= 0.5, `every Number on the 18 px Number's baseline (worst ${drift.toFixed(2)} px)`);
    if (!cdn) { console.log('  SKIP the Save PDF arm: cdnjs unreachable'); await p.close(); continue; }
    const printPdf = path.join(TMP, `${file}-print.pdf`);
    await page.pdf({ path: printPdf, preferCSSPageSize: true, printBackground: true });
    execSync(`pdftoppm -r 96 -gray ${printPdf} ${TMP}/${file}-p && pdftoppm -r 96 -gray ${pdf} ${TMP}/${file}-s`);
    const pad = n => String(n).padStart(String(m.length).length, '0');
    const edge = [], apart = [];
    m.forEach((x, i) => {
      if (!x.text) return;
      const a = ink(pgm(`${TMP}/${file}-p-${pad(i + 1)}.pgm`), x.box), b = ink(pgm(`${TMP}/${file}-s-${pad(i + 1)}.pgm`), x.box);
      if (!a || !b) { edge.push(`"${x.text}" no ink`); return; }
      if (b.r > x.box.r - 2) edge.push(`"${x.text}" ${(x.box.r - b.r).toFixed(1)} px`);
      if (Math.abs(b.r - a.r) > 3) apart.push(`"${x.text}" print ${a.r} / PDF ${b.r}`);
    });
    check(edge.length === 0, `Save PDF: every Number's ink ends ≥ 2 px short of its line's end, no glyph cut (${edge.slice(0, 4).join('; ') || m.length - 2 + ' fields'})`);
    check(apart.length === 0, `Save PDF: every Number ends within 3 px of where print ends it (${apart.slice(0, 4).join('; ') || 'all'})`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); fs.rmSync(TMP, { recursive: true, force: true }); }
console.log(fails.length ? `\nS44-number-fit: ${fails.length} failing check(s)` : `\nS44-number-fit: all green${cdn ? '' : ' (the Save PDF arm skipped: no cdnjs)'}`);
process.exit(fails.length ? 1 : cdn ? 0 : 2);
