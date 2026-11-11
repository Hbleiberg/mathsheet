// Probe (loop S37; found S12, pass D): each row's Duplicate and Delete buttons name their student. They read
// "Duplicate student" / "Delete student" in every row, and they sit at the top of a row, after the previous row's
// fields in the Tab order: tabbing on from Student 2's last field reached Student 3's Delete with nothing to say so,
// and after a Delete, focus on the next row's Delete said no more. Per page, from Chromium's accessibility tree:
// each button is named by its own text and the row's heading ("Delete student Student 3": the visible text first,
// WCAG 2.5.3), every name unique; the names follow Duplicate's and Delete's renumbering, a restored roster and Clear
// Current Roster; a Delete by keyboard leaves focus on a Delete that names the row it now belongs to; the visible
// text and the rows' pixels are as before the change. Fails before the change (`--ref 13081dc`).
//   node scripts/loop/probes/S37-row-button-names.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, PAGES, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only'), BEFORE = '13081dc';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const B = {
  'index.html':       { dup: '.mwg-duplicate-link', del: '.mwg-delete-link', clear: '#mwgClearCurrentBtn',
    payload: { inputMode: 'standard', worksheetsPerStudent: '1', answerKey: false, students: [
      { name: 'Avi', number: '1', grade: '2', type: 'add1', count: '30', mixedTypes: null, fracOps: null, decOps: null },
      { name: 'Dana', number: '2', grade: '2', type: 'add1', count: '30', mixedTypes: null, fracOps: null, decOps: null }] } },
  'math-minute.html': { dup: '.duplicate-student-link', del: '.delete-student-link', clear: '#clearCurrentRosterButton',
    payload: { inputMode: 'standard', worksheetsPerStudent: '1', answerKey: false, standardStudents: [{ name: 'Avi', number: '1', level: '5' }, { name: 'Dana', number: '2', level: '5' }] } },
  'math-facts.html':  { dup: '.duplicate-student-link', del: '.delete-student-link', clear: '#clearCurrentRosterButton',
    payload: { inputMode: 'standard', worksheetsPerStudent: '1', answerKey: false, standardStudents: [{ name: 'Avi', number: '1', level: '+3' }, { name: 'Dana', number: '2', level: '+3' }] } },
};
async function names(page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree'); await cdp.detach();
  return nodes.filter(n => !n.ignored && n.role && n.role.value === 'button').map(n => (n.name && n.name.value) || '').filter(n => /^(Duplicate|Delete) student/.test(n));
}
const expected = n => Array.from({ length: n }, (_, i) => [`Duplicate student Student ${i + 1}`, `Delete student Student ${i + 1}`]).flat();
const focused = page => page.evaluate(() => { const e = document.activeElement; const row = e.closest('.mwg-student-entry, .student-entry');
  return { cls: e.className, row: row ? [...row.parentNode.children].indexOf(row) + 1 : 0, heading: row ? row.querySelector('h3').textContent : '' }; });

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(B)) {
    if (ONLY && ONLY !== file) continue;
    const b = B[file], spec = PAGES[file];
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const p = await openPage(browser, srv.base, file, { raw: true });
    const { page } = p; page.on('dialog', d => d.accept());
    const serveFrom = async ref => {
      await page.unrouteAll();
      if (ref) { const body = execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8' });
        await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body })); }
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'load' }); await page.waitForSelector(`${spec.students} ${spec.entry}`);
    };
    await serveFrom(REF);
    const rows = () => page.$$eval(`${spec.students} ${spec.entry}`, a => a.length);
    let got = await names(page);
    check(await rows() === 3 && JSON.stringify(got) === JSON.stringify(expected(3)), `fresh: ${got.length} buttons named per row (${got.slice(0, 2).join(' / ')})`);
    check(new Set(got).size === got.length, 'fresh: every name unique');
    check(JSON.stringify(await page.$$eval(`${b.dup}, ${b.del}`, a => [...new Set(a.map(e => e.textContent))])) === '["Duplicate student","Delete student"]', 'the visible text as before');
    // Duplicate row 1: four rows, renumbered
    await page.click(`${spec.entry}:nth-child(1) ${b.dup}`);
    got = await names(page);
    check(await rows() === 4 && JSON.stringify(got) === JSON.stringify(expected(4)), `after Duplicate: 4 rows named 1–4 (${got.filter((_, i) => i % 2).join(', ')})`);
    // Delete row 2 by keyboard: focus on the next row's Delete, named for its new number
    await page.focus(`${spec.entry}:nth-child(2) ${b.del}`); await page.keyboard.press('Enter');
    const f = await focused(page);
    got = await names(page);
    const fname = got[(f.row - 1) * 2 + 1];
    check(await rows() === 3 && f.row === 2 && /delete/.test(f.cls) && fname === 'Delete student Student 2', `Delete by keyboard: focus on row ${f.row}'s Delete, named "${fname}"`);
    check(JSON.stringify(got) === JSON.stringify(expected(3)), 'after Delete: 3 rows named 1–3');
    // Delete the last row: focus on the new last row's Delete
    await page.focus(`${spec.entry}:nth-child(3) ${b.del}`); await page.keyboard.press('Enter');
    const g = await focused(page); got = await names(page);
    check(g.row === 2 && got[3] === 'Delete student Student 2', `Delete the last row: focus on "${got[(g.row - 1) * 2 + 1]}"`);
    // a restored roster, then Clear Current Roster
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [spec.storageKey, JSON.stringify(b.payload)]);
    await page.reload({ waitUntil: 'load' }); await page.waitForSelector(`${spec.students} ${spec.entry}`);
    got = await names(page);
    check(JSON.stringify(got) === JSON.stringify(expected(2)), `a restored 2-student roster named 1–2 (${got.length})`);
    await page.click(b.clear);
    got = await names(page);
    check(JSON.stringify(got) === JSON.stringify(expected(3)), `after Clear Current Roster: 3 rows named 1–3 (${got.length})`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
    // pixels: the rows look as before the change
    if (!REF) {
      const shot = async () => (await page.$(spec.students)).screenshot();
      await serveFrom(BEFORE); const a = await shot();
      await serveFrom(null); const c = await shot();
      check(a.equals(c), `the roster pixel-identical to ${BEFORE}'s`);
    }
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS37-row-button-names: ${fails.length} failing check(s)` : '\nS37-row-button-names: all green');
process.exit(fails.length ? 1 : 0);
