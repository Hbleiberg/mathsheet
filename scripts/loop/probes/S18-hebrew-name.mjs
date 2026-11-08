// Probe (loop S18, pass H on index.html; approved S18, gate 6): a Hebrew name prints with its punctuation at its
// own end. "שרה כ." (a last initial) printed its period at the name's right, which is where a Hebrew reader
// starts: the name's base direction was the page's. Each printed name is now isolated in a <bdi>, so the period
// sits left of the letters, the name stays at the left of its line, an English name ("Avi Cohen.") prints as
// before, an empty or "Name blank" line stays empty, and a long name still shrinks to fit. Sheets and keys.
// On math-minute.html and math-facts.html (36f71e4), and index.html since S19 (its half, queued while S18's two
// touches there were spent). Fails on the pages before the change (`--ref fde4b66`; index alone: `--ref 84025f7`).
//   node scripts/loop/probes/S18-hebrew-name.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const NAMES = ['שרה כ.', 'Avi Cohen.', '', 'אלישבע רחל בת-שבע פרידמן-גולדשטיין.'];
const SEL = {
  'index.html': { field: '#mwgResults .mwg-ws-header-main > .mwg-ws-field:first-child > .mwg-ws-field-value', add: '#mwgAddStudentBtn',
    row: '#mwgStudentsContainer .mwg-student-entry', key: '#mwgAnswerKeyToggle', blank: '#mwgNameBlankToggle' },
  'math-minute.html': { field: '.worksheet .worksheet-header-main > .student-field:first-child > .student-field-value', add: '#addStudentButton',
    row: '.student-entry', key: '#answerKeyToggle', blank: '#nameBlankToggle' },
};
SEL['math-facts.html'] = SEL['math-minute.html'];

// Per name line: where the final character's glyph sits against the rest, and where the ink starts.
const measure = sel => [...document.querySelectorAll(sel)].map(f => {
  const text = f.textContent, node = (function walk(n) { if (n.nodeType === 3 && n.data) return n; for (const c of n.childNodes) { const t = walk(c); if (t) return t; } return null; })(f);
  if (!node) return { text, html: f.innerHTML };
  const rect = (a, b) => { const r = document.createRange(); r.setStart(node, a); r.setEnd(node, b); return r.getBoundingClientRect(); };
  const last = rect(node.data.length - 1, node.data.length), rest = rect(0, node.data.length - 1), all = rect(0, node.data.length);
  const fr = f.getBoundingClientRect();
  return { text, size: getComputedStyle(f).fontSize, lastLeftOfRest: last.right <= rest.left + 0.5, lastRightOfRest: last.left >= rest.right - 0.5,
    indent: Math.round(all.left - fr.left), clipped: f.scrollWidth > f.clientWidth + 1 };
});

const srv = await serve(); const browser = await launch();
for (const file of ['index.html', 'math-minute.html', 'math-facts.html']) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  const p = await openPage(browser, srv.base, file);
  const pg = p.page, q = SEL[file];
  if (REF) {
    const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(q.row);
  }
  await pg.click(q.add); await p.spec.prepare(pg);
  for (let i = 0; i < NAMES.length; i++) await pg.fill(`${q.row}:nth-child(${i + 1}) input[name="studentName"]`, NAMES[i]);
  await pg.check(q.key);
  await pg.click(p.spec.generate); await pg.waitForFunction(() => window.__prints > 0);
  const lines = await pg.evaluate(measure, q.field);
  check(lines.length === 8, `${lines.length} name lines measured (4 sheets, 4 keys)`);
  for (const [i, l] of lines.entries()) {
    const where = i < 4 ? `sheet ${i + 1}` : `key ${i - 3}`;
    if (!l.text) { check(l.html === '', `${where}: an empty name leaves an empty line (${JSON.stringify(l.html)})`); continue; }
    if (/^[A-Za-z]/.test(l.text)) check(l.lastRightOfRest && l.indent <= 4, `${where}: "${l.text}" ends at its right, from the line's left (indent ${l.indent} px)`);
    else check(l.lastLeftOfRest && l.indent <= 4, `${where}: "${l.text}" — the period left of the letters, the name from the line's left (indent ${l.indent} px)`);
    if (l.text.length > 30) check(parseFloat(l.size) < 18 && !l.clipped, `${where}: the long name shrinks to ${l.size} and fits`);
  }
  // Name blank: every sheet's line empty, the keys keep the names
  await pg.check(q.blank);
  const before = await p.prints();
  await pg.click(p.spec.generate); await pg.waitForFunction(n => window.__prints > n, before);
  const blank = await pg.$$eval(q.field, v => v.map(e => e.innerHTML));
  check(blank.slice(0, 4).every(h => h === '') && blank.slice(4).filter(Boolean).length === 3, `Name blank: the sheets' lines empty, the keys' named (${JSON.stringify(blank)})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS18-hebrew-name: ${fails.length} failing check(s)` : '\nS18-hebrew-name: all green');
process.exit(fails.length ? 1 : 0);
