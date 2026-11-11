// Probe (loop S37; found S16, pass D, raised S37): index.html's option panels are named groups. A grade 5–8 Mixed panel
// held 35–39 checkboxes in no group, two of them "Addition" and two "Subtraction" (one under Fractions, one under
// Decimals), and a Fractions or Decimals row's operations panel said nothing of its student: a screen reader heard
// "Addition, checkbox, checked" with no way to tell which. Per grade 1–8, from Chromium's accessibility tree: every
// control of the Mixed panel sits in the group "Student 1 Include in Mixed:", every checkbox also in its visible
// title's group (Addition … Fractions, Decimals), and no two checkboxes share both names; the operations panels are
// "Student 2 Fraction Operations" / "Student 3 Decimal Operations" around their button and checkboxes; after a
// Delete the names follow the row's new heading; a saved roster restores with its groups; the panels look the same
// pixel for pixel as before the change. Fails before the change (`--ref c430733`).
//   node scripts/loop/probes/S37-panel-groups.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), BEFORE = 'c430733';   // the page before the change: the pixels must not move
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const FILE = 'index.html';

async function ax(page) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree'); await cdp.detach();
  const byId = new Map(nodes.map(n => [n.nodeId, n]));
  const name = n => (n.name && n.name.value) || '';
  const groups = n => { const g = []; for (let q = byId.get(n.parentId); q; q = byId.get(q.parentId)) if (q.role && q.role.value === 'group' && !q.ignored) g.push(name(q)); return g; };
  return nodes.filter(n => !n.ignored && n.role && /^(checkbox|button)$/.test(n.role.value)).map(n => ({ role: n.role.value, name: name(n), groups: groups(n) }));
}
const setRow = (page, i, grade, type) => page.evaluate(([i, grade, type]) => {
  const fire = s => s.dispatchEvent(new Event('change', { bubbles: true }));
  const row = document.querySelectorAll('#mwgStudentsContainer .mwg-student-entry')[i];
  const g = row.querySelector('select[name="grade"]'); g.value = grade; fire(g);
  const t = row.querySelector('select[name="problemType"]'); t.value = type; fire(t);
  const c = row.querySelector('select[name="count"]'); c.value = [...c.options].find(o => o.value).value; fire(c);
  return t.value === type;
}, [i, grade, type]);
// what the panels of row i hold, as the DOM has them (the handle: a panel with nothing in it proves nothing)
const domCount = (page, i, sel) => page.evaluate(([i, sel]) => document.querySelectorAll('#mwgStudentsContainer .mwg-student-entry')[i].querySelectorAll(sel).length, [i, sel]);

async function shots(page) {
  await setRow(page, 0, '8', 'mixed'); await setRow(page, 1, '5', 'fractions'); await setRow(page, 2, '6', 'decimals');
  const out = [];
  for (const sel of ['.mwg-mixed-types', '.mwg-ops-panel']) for (const h of await page.$$(`#mwgStudentsContainer ${sel}.visible`)) out.push(await h.screenshot());
  return out;
}

const srv = await serve(); const browser = await launch();
try {
  const p = await openPage(browser, srv.base, FILE, { raw: true });
  const { page } = p;
  page.on('dialog', d => d.accept());
  const serveFrom = async ref => {
    await page.unrouteAll();
    if (ref) { const body = execSync(`git show ${ref}:${FILE}`, { cwd: ROOT, encoding: 'utf8' });
      await page.route(new RegExp(`/${FILE.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body })); }
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' }); await page.waitForSelector('#mwgStudentsContainer .mwg-student-entry');
  };
  console.log(`${FILE}${REF ? ` (served from ${REF})` : ''}`);
  await serveFrom(REF);

  // the Mixed panel, grade by grade
  for (let g = 1; g <= 8; g++) {
    check(await setRow(page, 0, String(g), 'mixed'), `grade ${g}: row 1 on Mixed`);
    const n = await domCount(page, 0, '.mwg-mixed-types input[type=checkbox]'), nb = await domCount(page, 0, '.mwg-mixed-types button');
    const list = (await ax(page)).filter(c => c.groups.includes('Student 1 Include in Mixed:'));
    const boxes = list.filter(c => c.role === 'checkbox'), buttons = list.filter(c => c.role === 'button');
    check(n > 0 && boxes.length === n && buttons.length === nb, `grade ${g}: all ${n} checkboxes and ${nb} buttons in "Student 1 Include in Mixed:" (${boxes.length}, ${buttons.length})`);
    const titles = await page.evaluate(() => [...document.querySelector('#mwgStudentsContainer .mwg-student-entry .mwg-mixed-types').querySelectorAll('strong, .mwg-mixed-frac-dec-group > div > label')].map(e => e.textContent.trim()));
    const inner = boxes.map(c => c.groups[0]);
    check(boxes.length && boxes.every(c => c.groups.length >= 2 && titles.includes(c.groups[0])), `grade ${g}: each checkbox in its title's group (${[...new Set(inner)].join(', ')})`);
    // every checkbox but the three settings ones is row 1's (rows 2 and 3 show no panel yet), grouped or not
    const all = (await ax(page)).filter(c => c.role === 'checkbox' && !/^(Print Answer Key|Remove 'Student Number' Field|Name blank)$/.test(c.name));
    check(all.length === n, `grade ${g}: the panel's ${n} checkboxes found in the tree (${all.length})`);
    const pairs = all.map(c => (c.groups[0] || '(no group)') + ' > ' + c.name);
    check(new Set(pairs).size === pairs.length, `grade ${g}: no two checkboxes share both names${g >= 5 ? ` (${pairs.filter(x => /> (Addition|Subtraction)$/.test(x)).join('; ')})` : ''}`);
  }
  // the operations panels
  check(await setRow(page, 1, '5', 'fractions') && await setRow(page, 2, '6', 'decimals'), 'rows 2 and 3 on Fractions and Decimals');
  for (const [i, title, n] of [[1, 'Student 2 Fraction Operations', 5], [2, 'Student 3 Decimal Operations', 6]]) {
    const got = (await ax(page)).filter(c => c.groups[0] === title);
    const dom = await domCount(page, i, '.mwg-ops-panel input[type=checkbox]');
    check(dom === n && got.filter(c => c.role === 'checkbox').length === n && got.some(c => c.role === 'button' && c.name === 'Select All Operations'), `"${title}" holds Select All Operations and its ${n} checkboxes (${got.length} controls)`);
  }
  // a Delete renumbers: the groups follow the heading
  await page.click('#mwgStudentsContainer .mwg-student-entry:nth-child(1) .mwg-delete-link');
  const after = await ax(page);
  check(after.some(c => c.groups[0] === 'Student 1 Fraction Operations') && after.some(c => c.groups[0] === 'Student 2 Decimal Operations') && !after.some(c => c.groups.some(x => /Student 3/.test(x))),
    `after deleting Student 1: "Student 1 Fraction Operations", "Student 2 Decimal Operations"`);
  // a saved roster restores with its groups (a Mixed subset, a Fractions subset)
  await page.evaluate(() => localStorage.setItem('mwgRosterData_v2', JSON.stringify({ inputMode: 'standard', worksheetsPerStudent: '1', answerKey: false,
    students: [{ name: 'Avi', number: '1', grade: '6', type: 'mixed', count: '30', mixedTypes: ['add1', 'fractions-add', 'decimals-sub'], fracOps: null, decOps: null },
      { name: 'Dana', number: '2', grade: '5', type: 'fractions', count: '30', mixedTypes: null, fracOps: ['fractions-mul'], decOps: null }] })));
  await page.reload({ waitUntil: 'load' }); await page.waitForSelector('#mwgStudentsContainer .mwg-student-entry');
  const r = await ax(page);
  const checked = await page.evaluate(() => [...document.querySelectorAll('#mwgStudentsContainer input[type=checkbox]:checked')].map(c => c.value).join(','));
  check(checked === 'add1,fractions,fractions-add,decimals,decimals-sub,fractions-mul', `restored picks as saved (${checked})`);
  check(r.some(c => c.name === 'Addition' && c.groups[0] === 'Fractions' && c.groups[1] === 'Student 1 Include in Mixed:') && r.some(c => c.name === 'Subtraction' && c.groups[0] === 'Decimals')
    && r.filter(c => c.groups[0] === 'Student 2 Fraction Operations').length === 6, 'the restored roster: Mixed groups and "Student 2 Fraction Operations"');
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);

  // pixels: the panels look as they did before the change
  if (!REF) {
    await serveFrom(BEFORE); const a = await shots(page);
    await serveFrom(null); const b = await shots(page);
    check(a.length === 3 && b.length === 3 && a.every((x, i) => x.equals(b[i])), `the three panels pixel-identical to ${BEFORE}'s (${a.length} / ${b.length} shots, ${a.map((x, i) => x.equals(b[i]) ? 'same' : 'DIFFERENT').join(', ')})`);
  }
  await p.close();
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS37-panel-groups: ${fails.length} failing check(s)` : '\nS37-panel-groups: all green');
process.exit(fails.length ? 1 : 0);
