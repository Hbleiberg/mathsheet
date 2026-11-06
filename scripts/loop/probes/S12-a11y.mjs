// Probe (loop S12, pass D): the roster rows are named for a screen reader on all three pages.
// Every per-student control (Student Name, Student Number, Level — Grade Level, Problem Type, Problem Count on
// index.html) has an accessible name that says which row it is in and what it is ("Student 2 Level"), computed
// by Chromium's own accessibility tree (CDP); every id on the page is unique; the names hold after Add Student,
// Duplicate, Delete (the rows renumber), a grade change on index.html, and a saved-roster reload; clicking a
// label focuses its field. Fails on the pre-fix pages (`--ref` serves each page from a commit; 9eb4248 is the
// last commit before the fix): the fields read as a bare textbox / combobox there.
//   node scripts/loop/probes/S12-a11y.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const ROWS = {
  'index.html':       { entry: '.mwg-student-entry', fields: { studentName: 'Student Name', studentNumber: 'Student Number', grade: 'Grade Level', problemType: 'Problem Type', count: 'Problem Count' }, add: '#mwgAddStudentBtn', dup: '.mwg-duplicate-link', del: '.mwg-delete-link' },
  'math-minute.html': { entry: '.student-entry', fields: { studentName: 'Student Name', studentNumber: 'Student Number', level: 'Level' }, add: '#addStudentButton', dup: '.duplicate-student-link', del: '.delete-student-link' },
  'math-facts.html':  { entry: '.student-entry', fields: { studentName: 'Student Name', studentNumber: 'Student Number', level: 'Level' }, add: '#addStudentButton', dup: '.duplicate-student-link', del: '.delete-student-link' },
};

/** Accessible names of every per-row control, from the accessibility tree: [{ row, field, name, role }]. */
async function rowNames(page, R) {
  const tagged = await page.evaluate(({ entry, fields }) => {
    const out = []; let i = 0;
    document.querySelectorAll(`${entry}`).forEach((row, r) => {
      for (const f of Object.keys(fields)) {
        const el = row.querySelector(`[name="${f}"]`); if (!el || !el.offsetParent) continue;
        el.setAttribute('data-ax', String(i)); out.push({ i, row: r + 1, field: f }); i++;
      }
    });
    return out;
  }, R);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('Accessibility.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const names = [];
  for (const t of tagged) {
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-ax="${t.i}"]` });
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    const ax = nodes[0];
    names.push({ row: t.row, field: t.field, name: (ax.name && ax.name.value) || '', role: ax.role && ax.role.value });
  }
  await cdp.detach();
  await page.evaluate(() => document.querySelectorAll('[data-ax]').forEach(e => e.removeAttribute('data-ax')));
  return names;
}
const dupIds = page => page.evaluate(() => { const seen = new Map(); for (const el of document.querySelectorAll('[id]')) seen.set(el.id, (seen.get(el.id) || 0) + 1); return [...seen].filter(([, n]) => n > 1).map(([id]) => id); });

function judge(names, R, label, rows) {
  const bad = names.filter(n => n.name !== `Student ${n.row} ${R.fields[n.field]}`);
  const expected = rows * Object.keys(R.fields).length;
  check(names.length === expected && bad.length === 0, `${label}: ${names.length} of ${expected} row controls named "Student N <label>"${bad.length ? ` — ${bad.slice(0, 3).map(b => `row ${b.row} ${b.field} reads "${b.name}"`).join('; ')}${bad.length > 3 ? ` … ${bad.length} in all` : ''}` : ''}`);
}

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(ROWS).filter(f => !ONLY || f === ONLY)) {
    const R = ROWS[file];
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const p = await openPage(browser, srv.base, file, { raw: true });
    const page = p.page;
    page.on('dialog', d => d.accept());
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await page.reload({ waitUntil: 'load' });
      await page.waitForSelector(`${R.entry}`);
    }
    const count = () => page.locator(R.entry).count();
    judge(await rowNames(page, R), R, 'first paint (3 rows)', await count());
    check((await dupIds(page)).length === 0, `ids unique on first paint`);
    // the rows renumber: add one, duplicate the first, delete the second
    await page.click(R.add); await page.click(`${R.entry}:nth-child(1) ${R.dup}`); await page.click(`${R.entry}:nth-child(2) ${R.del}`);
    const n = await count();
    judge(await rowNames(page, R), R, `after Add, Duplicate, Delete (${n} rows)`, n);
    check((await dupIds(page)).length === 0, `ids unique after the roster changed (${(await dupIds(page)).join(', ') || 'none repeated'})`);
    if (file === 'index.html') {   // a grade change re-renders the type and count options
      await page.selectOption(`${R.entry}:nth-child(1) select[name="grade"]`, '4');
      judge(await rowNames(page, R), R, 'after a grade change', n);
    }
    // a label focuses its field
    const focused = await page.evaluate(({ entry }) => {
      const row = document.querySelectorAll(entry)[1]; const lab = row.querySelector('label'); lab.click();
      const el = document.activeElement; return el && el.closest(entry) === row && el.matches('input, select') ? el.getAttribute('name') : '(' + (el && el.tagName) + ')';
    }, R);
    check(/^student/.test(focused), `clicking row 2's first label focuses its field (${focused})`);
    // a saved roster reloads with named rows
    await page.click(p.spec.save);
    await page.reload({ waitUntil: 'load' }); await page.waitForSelector(`${R.entry}`);
    const m = await count();
    judge(await rowNames(page, R), R, `after a saved-roster reload (${m} rows)`, m);
    check(m === n, `the reload restored ${n} rows (${m})`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS12-a11y: ${fails.length} failing` : '\nS12-a11y: all green');
process.exit(fails.length ? 1 : 0);
