// Probe (loop S38; found S4, pass B): index.html marks every printed sheet but the last with `print-break`, as the
// standard says, keys included. `buildAnswerKeySheet(allAnswers, !doKey)` was always called with false (it runs only
// with keys on), so the class set's very last sheet, a key, carried `print-break` too; its `:last-child` rule kept
// the page count right. Per configuration (keys on and off, one to three students, one to three copies, Standard
// and Advanced): the sheets in order, `print-break` on all but the last; the print path (Chromium's own, Letter)
// makes one page per sheet; 0 page errors. Fails before the change (`--ref c4fda92`).
//   node scripts/loop/probes/S38-index-last-key.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, printBoxes, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const CASES = [
  { key: true, copies: '1', text: 'Avi, 1, add1, 30, 2;' },
  { key: true, copies: '3', text: 'Avi, 1, add1, 30, 2;\nDana, 2, fractions, 30, 5;\nNoa, 3, mixed, 40, 4;' },
  { key: false, copies: '2', text: 'Avi, 1, add1, 30, 2;\nDana, 2, div2, 30, 4;' },
  { key: true, copies: '2', text: null },   // the Standard form's three rows, filled by the harness
];

const srv = await serve(); const browser = await launch();
try {
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}`);
  for (const c of CASES) {
    const p = await openPage(browser, srv.base, 'index.html', { raw: !!c.text });
    const { page } = p;
    if (REF) { const body = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8' });
      await page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await page.reload({ waitUntil: 'load' }); await page.waitForSelector('#mwgStudentsContainer .mwg-student-entry');
      if (!c.text) await p.spec.prepare(page); }
    if (c.text) { await page.click('#mwgToggleModeBtn'); await page.fill('#mwgAdvancedBox', c.text); }
    await page.selectOption('#mwgWorksheetsPerStudent', c.copies);
    if (c.key) await page.check('#mwgAnswerKeyToggle');
    await page.click('#mwgGenerateBtn'); await page.waitForFunction(() => window.__prints > 0);
    const marks = await page.$$eval('#mwgResults > *', a => a.map(s => ({ key: s.classList.contains('mwg-answer-key-sheet'), brk: s.classList.contains('print-break') })));
    const what = `${c.text ? c.text.split('\n').length : 3} student(s) × ${c.copies}${c.key ? ' with keys' : ''}${c.text ? '' : ', Standard'}`;
    const keys = marks.filter(m => m.key).length;
    check(marks.length > 0 && (c.key ? keys === marks.length / 2 && marks[marks.length - 1].key : keys === 0), `${what}: ${marks.length} sheets, ${keys} of them keys, the last one ${marks.length && marks[marks.length - 1].key ? 'a key' : 'a worksheet'}`);
    check(marks.every((m, i) => m.brk === (i < marks.length - 1)), `${what}: print-break on every sheet but the last (${marks.map(m => (m.key ? 'k' : 's') + (m.brk ? '|' : '')).join('')})`);
    await printBoxes(p);   // the page's own move to body (under print the results sit inside the hidden app until it runs)
    await page.emulateMedia({ media: 'print' });   // page.pdf() renders screen CSS after emulateMedia('screen')
    const pdf = await page.pdf({ preferCSSPageSize: true });
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    check(pages === marks.length, `${what}: the print path makes ${pages} Letter pages for ${marks.length} sheets`);
    check(p.errors.length === 0, `${what}: 0 page errors (${p.errors.join('; ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS38-index-last-key: ${fails.length} failing check(s)` : '\nS38-index-last-key: all green');
process.exit(fails.length ? 1 : 0);
