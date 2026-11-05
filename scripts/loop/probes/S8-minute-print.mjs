// Probe (loop S8, pass B on math-minute.html): the printed artifact, every level.
// Arm 1, geometry under emulated print (the page's own move-to-body trick), for three configurations:
//   plain (1 copy, key), heavy (5 copies, key, an 80-character header line, 30-character names) and
//   bare (3 copies, key, header line, Student Number removed, Name blank). Every sheet 1056 × 816,
//   print-break on all but the last, every problem's ink inside its cell and above the paper's inner
//   bottom (816 − 24 px), no problem's ink running into the one below it, header text inside its box.
// Arm 2, Chromium's own print-to-PDF of the same sheets: one Letter-landscape page per sheet, and how A4
//   (landscape and portrait) scales it (`--a4`).
// `--control` plants two print defects (S2's invalid `@page{size:11in 8.5in landscape}`, and rows-6 at
// 1.5 in) and must fail.
//   node scripts/loop/probes/S8-minute-print.mjs [--only plain|heavy|bare] [--a4] [--json] [--control]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { serve, launch, openPage } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const only = arg('--only'), a4 = process.argv.includes('--a4'), asJson = process.argv.includes('--json');
const control = process.argv.includes('--control');
const PLANTED = control ? fs.readFileSync(new URL('../../../math-minute.html', import.meta.url), 'utf8')
  .replace('size:11in 8.5in;', 'size:11in 8.5in landscape;')
  .replace('.rows-6{ grid-template-rows:repeat(6,1.2in) !important; }', '.rows-6{ grid-template-rows:repeat(6,1.5in) !important; }') : null;
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const TMP = process.env.TMPDIR || '/tmp';
const SEED = `(() => { let s = 20261105; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const LONG = 'Bat-Sheva Rivka Goldenberg-Levi';                    // 31 characters
const LINE80 = 'Unit 3 review · Parashat Noach · פרשת נח · Week of November 3 · Mr. Cohen-Levi';
const CONFIGS = {
  plain: { copies: '1', line: '', removeNumber: false, nameBlank: false, name: n => `S${n}` },
  heavy: { copies: '5', line: LINE80.slice(0, 80), removeNumber: false, nameBlank: false, name: () => LONG },
  bare: { copies: '3', line: LINE80.slice(0, 80), removeNumber: true, nameBlank: true, name: n => `S${n}` },
};
const LEVELS = Array.from({ length: 21 }, (_, i) => i + 1);

const MEASURE = () => {
  const out = [];
  const sheets = [...document.querySelectorAll('.worksheet')];
  sheets.forEach((s, i) => {
    const sr = s.getBoundingClientRect();
    const inner = sr.bottom - parseFloat(getComputedStyle(s).paddingBottom);
    const body = s.querySelector('.worksheet-body').getBoundingClientRect();
    const box = s.querySelector('.description-box').getBoundingClientRect();
    const txt = s.querySelector('.description-text');
    const tr = txt.getBoundingClientRect();
    const set = s.querySelector('.worksheet-set-label');
    const setR = set && set.getBoundingClientRect();
    const line = s.querySelector('.worksheet-header-line');
    const names = [...s.querySelectorAll('.student-field-value')];
    const header = s.querySelector('.worksheet-header').getBoundingClientRect();
    const grid = s.querySelector('.problems-grid');
    const rows = (grid.className.match(/rows-(\d)/) || [])[1] | 0;
    const cells = [...grid.children].map(c => {
      const cr = c.getBoundingClientRect();
      let t = Infinity, b = -Infinity, l = Infinity, r = -Infinity;
      for (const el of c.querySelectorAll('*')) {
        const q = el.getBoundingClientRect(); if (!q.width && !q.height) continue;
        t = Math.min(t, q.top); b = Math.max(b, q.bottom); l = Math.min(l, q.left); r = Math.max(r, q.right);
      }
      return { ct: cr.top, cb: cr.bottom, cl: cr.left, cr: cr.right, t, b, l, r };
    });
    // the nearest ink below each problem, same column
    let minGap = Infinity;
    cells.forEach((c, j) => { const d = cells[j + 10]; if (d) minGap = Math.min(minGap, d.t - c.b); });
    out.push({
      i, w: Math.round(sr.width), h: Math.round(sr.height), brk: s.classList.contains('print-break'),
      key: /ANSWER KEY/.test(txt.textContent), desc: txt.textContent, rows, n: cells.length,
      headerH: Math.round(header.height), gridTop: Math.round(grid.getBoundingClientRect().top - sr.top),
      gridH: Math.round(grid.getBoundingClientRect().height),
      lowestInk: Math.max(...cells.map(c => c.b)) - sr.top, innerBottom: inner - sr.top, bodyBottom: body.bottom - sr.top,
      outCell: cells.filter(c => c.l < c.cl - 0.5 || c.r > c.cr + 0.5).length,
      aboveCell: cells.filter(c => c.t < c.ct - 0.5).length,
      cut: cells.filter(c => c.b > Math.min(inner, body.bottom, sr.bottom) + 0.5).length,
      minGap,
      descOver: tr.bottom > box.bottom + 0.5 || tr.right > box.right + 0.5 || (setR && tr.right > setR.left + 0.5),
      descLines: Math.round(tr.height / 15),
      setOver: setR ? setR.right > box.right + 0.5 || setR.bottom > box.bottom + 0.5 : false,
      lineCut: line ? line.scrollWidth > line.clientWidth + 1 : null, lineText: line ? line.textContent : '',
      nameCut: names.filter(e => e.scrollWidth > e.clientWidth + 1).length, fields: names.length,
    });
  });
  return out;
};

async function setup(p, cfg) {
  await p.page.click(p.spec.modeToggle);
  await p.page.selectOption(p.spec.perStudent, cfg.copies);
  await p.page.setChecked(p.spec.key, true);
  await p.page.setChecked('#removeNumberToggle', cfg.removeNumber);
  await p.page.setChecked('#nameBlankToggle', cfg.nameBlank);
  await p.page.fill('#headerLineInput', cfg.line);
  await p.page.fill(p.spec.advanced, LEVELS.map(n => `${cfg.name(n)}, ${100 + n}, ${n};`).join('\n'));
  const n = await p.prints();
  await p.page.click(p.spec.generate);
  await p.page.waitForFunction(n => window.__prints > n, n, { timeout: 60000 });
}

const srv = await serve(); const browser = await launch();
const report = {};
try {
  for (const [name, cfg] of Object.entries(CONFIGS)) {
    if (only && only !== name) continue;
    console.log(`math-minute.html — ${name} (${cfg.copies} cop${cfg.copies === '1' ? 'y' : 'ies'}, key${cfg.line ? ', header line' : ''}${cfg.removeNumber ? ', no number' : ''}${cfg.nameBlank ? ', name blank' : ''})`);
    const p = await openPage(browser, srv.base, 'math-minute.html', { raw: true });
    await p.context.addInitScript(SEED);
    if (PLANTED) await p.page.route(/\/math-minute\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: PLANTED }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
    await setup(p, cfg);
    await p.page.emulateMedia({ media: 'print' });
    await p.page.evaluate(() => { const r = document.querySelector('#results'); r.id = 'results-print'; document.body.appendChild(r); });
    const m = await p.page.evaluate(MEASURE);
    report[name] = m;
    const expect = LEVELS.length * +cfg.copies * 2;
    const count = { 3: 30, 4: 40, 5: 50, 6: 60 };
    check(m.length === expect, `${m.length} sheets (${expect} expected: 21 levels × ${cfg.copies} × sheet + key)`);
    check(m.every(s => s.w === 1056 && s.h === 816), `every sheet 1056 × 816 (${[...new Set(m.map(s => `${s.w}×${s.h}`))].join(', ')})`);
    check(m.every((s, i) => s.brk === (i < m.length - 1)), 'print-break on every sheet but the last');
    check(m.every(s => s.n === count[s.rows]), `every grid holds its rows' count (${m.filter(s => s.n !== count[s.rows]).length} off)`);
    const cut = m.filter(s => s.cut), out = m.filter(s => s.outCell), above = m.filter(s => s.aboveCell);
    check(cut.length === 0, `no problem's ink below the paper's inner bottom or the body (${cut.length} sheets; ${cut.slice(0, 3).map(s => `#${s.i} ${s.desc.slice(0, 40)}`).join(' / ')})`);
    check(out.length === 0, `every problem's ink inside its cell, side to side (${out.length} sheets)`);
    const worstGap = Math.min(...m.map(s => s.minGap));
    const tight = m.filter(s => s.minGap < 4);
    check(tight.length === 0, `≥ 4 px between a problem and the one below it (worst ${worstGap.toFixed(1)} px; ${tight.length} sheets under 4: ${[...new Set(tight.map(s => s.desc.slice(0, 45)))].slice(0, 4).join(' / ')})`);
    console.log(`       ink above its own cell's top on ${above.length} sheets (${[...new Set(above.map(s => s.desc.slice(0, 40)))].slice(0, 3).join(' / ')})`);
    const over = m.filter(s => s.descOver || s.setOver);
    check(over.length === 0, `the description and set label stay inside their box (${over.length}: ${[...new Set(over.map(s => s.desc))].slice(0, 3).join(' / ')})`);
    const paperLeft = Math.min(...m.map(s => s.innerBottom - s.lowestInk));
    check(paperLeft >= 8, `the lowest ink sits ≥ 8 px above the inner bottom (least ${paperLeft.toFixed(1)} px)`);
    const byRows = {};
    for (const s of m) { const k = `rows-${s.rows}${s.key ? ' key' : ''}`; byRows[k] = Math.min(byRows[k] ?? 1e9, s.innerBottom - s.lowestInk); }
    console.log(`       paper left under the lowest ink: ${Object.entries(byRows).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(', ')}`);
    console.log(`       header ${Math.min(...m.map(s => s.headerH))}–${Math.max(...m.map(s => s.headerH))} px; grid ${Math.min(...m.map(s => s.gridH))}–${Math.max(...m.map(s => s.gridH))} px; body bottom ${Math.min(...m.map(s => s.bodyBottom)).toFixed(0)}–${Math.max(...m.map(s => s.bodyBottom)).toFixed(0)}; descriptions on 2+ lines: ${m.filter(s => s.descLines > 1).length}`);
    if (cfg.line) check(m.every(s => s.lineText === cfg.line.trim() && !s.lineCut), `the 80-character header line prints whole on every sheet (${m.filter(s => s.lineCut).length} cut)`);
    console.log(`       names cut with an ellipsis: ${m.filter(s => s.nameCut).length} of ${m.length} sheets; fields per header ${[...new Set(m.map(s => s.fields))].join('/')}`);

    // Arm 2: Chromium's print-to-PDF of these sheets.
    const file = `${TMP}/s8-mm-${name}.pdf`;
    await p.page.pdf({ path: file, preferCSSPageSize: true, printBackground: true });
    const info = execSync(`pdfinfo ${file}`, { encoding: 'utf8' });
    const pages = +info.match(/Pages:\s+(\d+)/)[1], size = info.match(/Page size:\s+([\d.]+ x [\d.]+)/)[1];
    check(pages === m.length && size === '792 x 612', `print-to-PDF: ${pages} pages for ${m.length} sheets, ${size} pt (Letter landscape 792 × 612)`);
    if (a4) for (const [label, opts] of [['A4 landscape', { format: 'A4', landscape: true }], ['A4 portrait', { format: 'A4' }]]) {
      const f = `${TMP}/s8-mm-${name}-a4.pdf`;
      await p.page.pdf({ path: f, ...opts, printBackground: true });
      const inf = execSync(`pdfinfo ${f}`, { encoding: 'utf8' });
      console.log(`       ${label}: ${inf.match(/Pages:\s+(\d+)/)[1]} pages for ${m.length} sheets, ${inf.match(/Page size:\s+([^\n]+)/)[1]}`);
    }
    check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
    await p.close();
  }
} catch (e) { check(false, e.message.split('\n')[0]); }
finally { await browser.close(); await srv.close(); }
if (asJson) fs.writeFileSync(`${TMP}/s8-mm-print.json`, JSON.stringify(report));
console.log(fails.length ? `\nS8-minute-print: ${fails.length} failing` : '\nS8-minute-print: all green');
process.exit(fails.length ? 1 : 0);
