// Probe (loop S41, found in pass H on math-minute.html): switching input mode clears the Advanced box's "Some entries
// were skipped" list with the rest of the last report. The toggle cleared the status line ("No valid students found")
// but kept the list, so a teacher who pasted a names column, went Back to Standard Input and built the class read
// 'Entry 1 is invalid: "Avi Cohen"' under the buttons while working in Standard, and again under the validation box's
// "Student 4: missing Level" when one row had no level. On each page: an Advanced paste with a skipped line generates
// its sheets and its list; Back to Standard Input empties the list and keeps the sheets; a Standard row without a level
// shows the validation box and no list; Advanced again keeps the paste, and Generate lists the skipped line again.
// 0 page errors. Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S41-mode-switch-errors.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const PAGES = {
  'index.html': { toggle: '#mwgToggleModeBtn', box: '#mwgAdvancedBox', errors: '#mwgErrors', vbox: '#mwgValidationBox', gen: '#mwgGenerateBtn',
    sheets: '#mwgResults > *', row: '#mwgStudentsContainer .mwg-student-entry', paste: 'Avi Cohen, 1, add2, 30, 3;\nShira Levi\nNoa Katz, 3, mul2, 40, 4;' },
  'math-minute.html': { toggle: '#toggleInputModeButton', box: '#advancedInputBox', errors: '#errors', vbox: '#mmValidationBox', gen: '#generatePrintButton',
    sheets: '#results .worksheet', row: '#studentsContainer .student-entry', paste: 'Avi Cohen, 1, 5;\nShira Levi\nNoa Katz, 3, 19;' },
  'math-facts.html': { toggle: '#toggleInputModeButton', box: '#advancedInputBox', errors: '#errors', vbox: '#mmValidationBox', gen: '#generatePrintButton',
    sheets: '#results .worksheet', row: '#studentsContainer .student-entry', paste: 'Avi Cohen, 1, +2;\nShira Levi\nNoa Katz, 3, x3;' },
};

const srv = await serve(); const browser = await launch();
try {
  for (const [file, P] of Object.entries(PAGES)) {
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const p = await openPage(browser, srv.base, file, { raw: true });
    const { page } = p;
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await page.reload({ waitUntil: 'load' }); await page.waitForSelector(P.row);
    }
    page.on('dialog', d => d.accept());
    const list = () => page.$eval(P.errors, e => (e.offsetParent ? e.innerText : '').trim());
    const gen = async () => { const n = await page.evaluate(() => window.__prints); await page.click(P.gen); await page.waitForTimeout(400); return (await page.evaluate(() => window.__prints)) > n; };
    // an Advanced paste with a skipped line
    await page.click(P.toggle); await page.fill(P.box, P.paste);
    const printed = await gen(), sheets = (await page.$$(P.sheets)).length, l1 = await list();
    check(printed && sheets === 2 && /Shira Levi/.test(l1), `${file}: Advanced, 2 sheets and the skipped list (${sheets} sheets; "${l1.replace(/\s+/g, ' ').slice(0, 70)}")`);
    // Back to Standard Input
    await page.click(P.toggle);
    const l2 = await list(), sheets2 = (await page.$$(P.sheets)).length;
    check(l2 === '', `${file}: Back to Standard Input empties the list ("${l2.replace(/\s+/g, ' ').slice(0, 70)}")`);
    check(sheets2 === sheets, `${file}: the sheets stay (${sheets2})`);
    // a Standard row with a name and no level: the validation box, no list
    await page.fill(`${P.row}:nth-child(1) [name="studentName"]`, 'Late Kid');
    const printed3 = await gen(), vb = await page.$eval(P.vbox, e => e.style.display !== 'none' && e.offsetHeight > 0), l3 = await list();
    check(!printed3 && vb && l3 === '', `${file}: a row without its level shows the validation box and no skipped list (box ${vb}; list "${l3.replace(/\s+/g, ' ').slice(0, 60)}")`);
    // Advanced again: the paste kept, its list back on Generate
    await page.click(P.toggle);
    const kept = await page.inputValue(P.box), l4 = await list();
    const printed5 = await gen(), l5 = await list();
    check(kept === P.paste && l4 === '' && printed5 && /Shira Levi/.test(l5), `${file}: Advanced again keeps the paste, and Generate lists the skipped line again`);
    check(p.errors.length === 0, `${file}: 0 page errors (${p.errors.length})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS41-mode-switch-errors: ${fails.length} failing check(s)` : '\nS41-mode-switch-errors: all green');
process.exit(fails.length ? 1 : 0);
