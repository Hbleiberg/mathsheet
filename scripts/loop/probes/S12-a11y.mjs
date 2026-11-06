// Probe (loop S12, pass D): the roster rows are named for a screen reader on all three pages.
// Every per-student control (Student Name, Student Number, Level — Grade Level, Problem Type, Problem Count on
// index.html) has an accessible name that says which row it is in and what it is ("Student 2 Level"), computed
// by Chromium's own accessibility tree (CDP); every id on the page is unique; the names hold after Add Student,
// Duplicate, Delete (the rows renumber), a grade change on index.html, and a saved-roster reload; clicking a
// label focuses its field. Second arm — the notices are live regions: the status, error and student-counter
// boxes are `aria-live="polite"` in the accessibility tree, the validation box is an alert when shown, and during a
// real Save PDF (the two cdnjs libraries load) the status box is `aria-busy` through every "Making your PDF: page k
// of N..." update and the flag clears BEFORE "PDF saved!" is written, so a screen reader hears the result and not
// 150 counts. Fails on the pre-fix pages (`--ref` serves each page from a commit): 9eb4248 fails both arms (the
// commit before the names fix), 4b10d20 the live arm only.
//   node scripts/loop/probes/S12-a11y.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const LIVE = {
  'index.html':       { status: '#mwgStatus', errors: '#mwgErrors', counter: '#mwgStudentCounter', val: '#mwgValidationBox', fix: '#mwgValidationFix', gen: '#mwgGenerateBtn', level: 'select[name="grade"]' },
  'math-minute.html': { status: '#statusMessages', errors: '#errors', counter: '#studentCounter', val: '#mmValidationBox', fix: '#mmValidationFix', gen: '#generatePrintButton', level: 'select[name="level"]' },
  'math-facts.html':  { status: '#statusMessages', errors: '#errors', counter: '#studentCounter', val: '#mmValidationBox', fix: '#mmValidationFix', gen: '#generatePrintButton', level: 'select[name="level"]' },
};
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
/** One element's accessibility node: role and its live-region properties. */
async function axNode(page, selector) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('Accessibility.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  await cdp.detach();
  const ax = nodes[0], prop = n => { const q = (ax.properties || []).find(x => x.name === n); return q ? q.value.value : null; };
  return { role: ax.role && ax.role.value, ignored: !!ax.ignored, live: prop('live'), atomic: prop('atomic'), busy: prop('busy') };
}
/** Serve `file` from a commit instead of the working tree (the control). */
async function serveFrom(page, file, ref, entry) {
  const body = execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8' });
  await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector(entry);
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
    if (REF) await serveFrom(page, file, REF, R.entry);
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

    // ---- live regions: the notice boxes in the accessibility tree
    const L = LIVE[file];
    const regions = {}; for (const k of ['status', 'errors', 'counter']) regions[k] = await axNode(page, L[k]);
    const liveness = Object.entries(regions).map(([k, v]) => `${k}: ${v.live || 'off'}`).join(', ');
    check(Object.values(regions).every(v => v.live === 'polite'), `status, error and counter boxes are polite live regions (${liveness})`);
    await page.$eval(`${R.entry}:nth-child(1) ${L.level}`, s => { s.value = ''; s.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.click(L.gen); await page.waitForSelector(L.val, { state: 'visible', timeout: 5000 });
    const val = await axNode(page, L.val);
    check(val.role === 'alert', `the validation box is an alert when shown (role ${val.role})`);
    await page.click(L.fix);
    check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
    await p.close();

    // ---- a real Save PDF: busy through the page counts, clear before "PDF saved!"
    const q = await openPage(browser, srv.base, file, { cdn: true });
    if (REF) { await serveFrom(q.page, file, REF, R.entry); if (q.spec.prepare) await q.spec.prepare(q.page); }
    await q.page.evaluate(sel => {
      const st = document.querySelector(sel); window.__live = []; let batch = 0;
      new MutationObserver(ms => { batch++; for (const mu of ms) window.__live.push({ batch, type: mu.type, attr: mu.attributeName || null, text: st.textContent.trim().slice(0, 40), busy: st.getAttribute('aria-busy') }); })
        .observe(st, { childList: true, subtree: true, characterData: true, attributes: true });
    }, L.status);
    const dl = q.page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
    await q.page.click(q.spec.pdf);
    await q.page.waitForFunction(sel => /PDF saved!|PDF library|PDF generation failed/.test(document.querySelector(sel).textContent), L.status, { timeout: 90000 });
    const rec = await q.page.evaluate(() => window.__live);
    const progress = rec.filter(r => /Making your PDF/.test(r.text) && r.type === 'childList');
    const savedBatch = (rec.find(r => /PDF saved!/.test(r.text)) || {}).batch;
    const last = rec.filter(r => r.batch === savedBatch);
    const attrAt = last.findIndex(r => r.type === 'attributes' && r.attr === 'aria-busy'), childAt = last.findIndex(r => r.type === 'childList');
    check(progress.length > 0 && progress.every(r => r.busy === 'true'), `the status box is aria-busy through ${progress.length} page-count update(s) (${progress.filter(r => r.busy !== 'true').length} without the flag)`);
    check(savedBatch !== undefined && attrAt >= 0 && childAt > attrAt, `"PDF saved!" is written after the busy flag clears (${savedBatch === undefined ? 'status: ' + ((rec[rec.length - 1] || {}).text || '(nothing)') : attrAt < 0 ? 'no aria-busy change in its batch' : `attribute at ${attrAt}, text at ${childAt}`})`);
    check(await q.page.$eval(L.status, e => e.getAttribute('aria-busy')) === null, 'no aria-busy left after the export');
    await dl; check(q.errors.length === 0, `0 page errors in the PDF run (${q.errors.join(' | ')})`);
    await q.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS12-a11y: ${fails.length} failing` : '\nS12-a11y: all green');
process.exit(fails.length ? 1 : 0);
