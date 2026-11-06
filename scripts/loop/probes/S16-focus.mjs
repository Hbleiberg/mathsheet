// Probe (loop S16, pass D on index.html; the S12 P3 on all three pages): keyboard focus never drops to the page.
// Delete student moves focus to the next row's Delete (the previous row's for the last row; Add Student when the
// roster is rebuilt); Generate Advanced Code moves focus into the code textarea; Close and Escape return it to the
// opener; Use in Advanced Input lands in the Advanced box (the opener is hidden in that mode); Fix on the validation
// box focuses the first highlighted field. Second arm (S16, the S0 P4): the code textarea is named "Advanced Input
// Code" by the panel's title. Fails on the pages before the change (`--ref 196dd4a`: focus on body everywhere,
// no name).
//   node scripts/loop/probes/S16-focus.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, PAGES, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const UI = {
  'index.html':       { del: '.mwg-delete-link', add: '#mwgAddStudentBtn', gen: '#mwgGenCodeBtn', out: '#mwgCodeOutput', panel: '#mwgCodePanel', close: '#mwgCloseModal', use: '#mwgUseCodeBtn', fix: '#mwgValidationFix', val: '#mwgValidationBox', required: 'select[name="grade"]' },
  'math-minute.html': { del: '.delete-student-link', add: '#addStudentButton', gen: '#generateAdvancedCodeButton', out: '#advancedCodeOutput', panel: '#advancedCodePanel', close: '#closeAdvancedCodeModal', use: '#useAdvancedCodeButton', fix: '#mmValidationFix', val: '#mmValidationBox', required: 'select[name="level"]' },
  'math-facts.html':  { del: '.delete-student-link', add: '#addStudentButton', gen: '#generateAdvancedCodeButton', out: '#advancedCodeOutput', panel: '#advancedCodePanel', close: '#closeAdvancedCodeModal', use: '#useAdvancedCodeButton', fix: '#mmValidationFix', val: '#mmValidationBox', required: 'select[name="level"]' },
};
/** Where focus is: "<tag>#<id>" or "<tag>.<class> in Student N" or "body". */
const focusAt = page => page.evaluate(() => {
  const el = document.activeElement; if (!el || el === document.body) return 'body';
  const row = el.closest('.student-entry, .mwg-student-entry'); const h = row && row.querySelector('h3');
  return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : el.className ? '.' + String(el.className).split(' ')[0] : ''}${h ? ' in ' + h.textContent : ''}`;
});
async function axName(page, selector) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('Accessibility.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  await cdp.detach();
  return (nodes[0].name && nodes[0].name.value) || '';
}

const srv = await serve(); const browser = await launch();
for (const file of Object.keys(UI)) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  const ui = UI[file], spec = PAGES[file];
  const p = await openPage(browser, srv.base, file);
  if (REF) {
    const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${spec.students} ${spec.entry}`);
    if (spec.prepare) await spec.prepare(p.page);
  }
  const page = p.page;
  const rowDel = n => `${spec.students} ${spec.entry} >> nth=${n} >> ${ui.del}`;
  // Delete the middle row by keyboard: focus lands on the row that took its place
  await page.focus(rowDel(1)); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  check((await focusAt(page)) === `button${ui.del} in Student 2`, `Delete (row 2 of 3) by Enter: focus on the new row 2's Delete (${await focusAt(page)})`);
  // Delete the last row: the previous row's Delete
  await page.focus(rowDel(1)); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  check((await focusAt(page)) === `button${ui.del} in Student 1`, `Delete (the last row) by Enter: focus on the previous row's Delete (${await focusAt(page)})`);
  // Delete the only row: the roster is rebuilt, Add Student takes focus
  await page.focus(rowDel(0)); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
  check((await focusAt(page)) === `button${ui.add}` && (await page.$$eval(`${spec.students} ${spec.entry}`, e => e.length)) === 3, `Delete (the only row): 3 defaults rebuilt, focus on Add Student (${await focusAt(page)})`);
  // The code panel: open by keyboard → the textarea; Escape → the opener; Close → the opener; Use → the Advanced box
  if (spec.prepare) await spec.prepare(page);
  await page.focus(ui.gen); await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  check((await page.isVisible(ui.panel)) && (await focusAt(page)) === `textarea${ui.out}`, `Generate Advanced Code by Enter: the panel opens with focus in the code (${await focusAt(page)})`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  check(!(await page.isVisible(ui.panel)) && (await focusAt(page)) === `button${ui.gen}`, `Escape: the panel closes, focus back on the opener (${await focusAt(page)})`);
  await page.click(ui.gen); await page.waitForTimeout(200); await page.click(ui.close); await page.waitForTimeout(100);
  check(!(await page.isVisible(ui.panel)) && (await focusAt(page)) === `button${ui.gen}`, `Close: focus back on the opener (${await focusAt(page)})`);
  await page.click(ui.gen); await page.waitForTimeout(200); await page.click(ui.use); await page.waitForTimeout(100);
  check(!(await page.isVisible(ui.panel)) && (await focusAt(page)) === `textarea${spec.advanced}`, `Use in Advanced Input: Advanced mode, focus in the Advanced box (${await focusAt(page)})`);
  // Fix on the validation box focuses the first highlighted field
  await page.click(spec.modeToggle);
  await page.$eval(`${spec.students} ${spec.entry} >> nth=0 >> ${ui.required}`, el => { el.value = ''; el.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.click(spec.generate); await page.waitForTimeout(150);
  const shown = await page.isVisible(ui.val);
  await page.click(ui.fix); await page.waitForTimeout(150);
  const at = await focusAt(page);
  const highlighted = await page.evaluate(() => { const el = document.activeElement; return !!el && /rgb\(204, 0, 0\)/.test(el.style.border); });
  check(shown && highlighted && /in Student 1$/.test(at), `Fix: the box showed (${shown}), focus on the first highlighted field (${at}, red border ${highlighted})`);
  // Second arm: the code textarea's accessible name (read with the panel open: a display:none node has no name)
  await page.click(ui.gen); await page.waitForTimeout(200);
  const name = await axName(page, ui.out);
  check(name === 'Advanced Input Code', `the code textarea is named by the panel's title (${JSON.stringify(name)})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS16-focus: ${fails.length} failing check(s)` : '\nS16-focus: all green');
process.exit(fails.length ? 1 : 0);
