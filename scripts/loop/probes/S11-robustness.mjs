// Probe (loop S11, pass E — errors & robustness, a suite pass over all three pages). Six arms per page, by real
// clicks, every foreign origin aborted, `window.print` stubbed:
//   1. every selector generates through the Standard form (the twins: each level option; index: each grade ×
//      type × count the dropdowns offer, Mixed with its default pool): one sheet + a key, the cells the count
//      asked, the description's count the cells', 0 page errors;
//   2. a malformed Advanced paste (wrong field count, unknown selector, empty name, stray ";", blank lines,
//      Windows line ends, tabs, no trailing ";") is reported entry by entry and skipped, never fatal: the good
//      entries print; what the lenient parses accept ("7.5", "1O", a 4-field line) is reported, not asserted;
//   3. a 500-entry paste with Windows line ends prints 500 sheets;
//   4. localStorage denied (the accessor throws) or full (setItem throws): defaults, the notices, no throw;
//   5. a saved payload of every bad shape (null, a string, [], {}, a non-array roster, a null student, an unknown
//      level / grade / type, out-of-range settings, the legacy v1 shape, a v1 key beside an empty v2) loads to a
//      usable roster and Generate still runs (or says why), 0 page errors;
//   6. every control fires once with dialogs accepted (Add, Duplicate, Delete to empty, Fill Down, Generate with
//      blanks → the validation box → Fix / Generate Anyway, Advanced Code open / copy / use / close, Save, Clear
//      current, Clear saved, every toggle, Mixed's select / deselect all and the ops panels on index): 0 page errors.
// `--only <file>`; `--skip-selectors` (arm 1 is the slow one); `--control` serves each page with three planted
// defects (one level's generator throws, the parser throws on a bad entry, the storage read is unguarded) and
// must fail on every page.
//   node scripts/loop/probes/S11-robustness.mjs [--only math-minute.html] [--skip-selectors] [--control]
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openPage, PAGES, ROOT } from '../harness.mjs';

const args = process.argv.slice(2), flag = f => args.includes(f), opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const ONLY = opt('--only'), SKIP_SEL = flag('--skip-selectors'), CONTROL = flag('--control');
const FILES = Object.keys(PAGES).filter(f => !ONLY || f === ONLY);
let failing = 0;
const check = (ok, msg) => { if (!ok) failing++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); };
const note = msg => console.log(`  note ${msg}`);

// ── the planted defects (--control): each replacement must match once, or the control is silent ──
const PLANTS = {
  'index.html': [
    ['function generateProblems(', 'function generateProblems(type) { if (type === "sub2") throw new Error("planted"); return generateProblems0.apply(null, arguments); }\nfunction generateProblems0('],
    ['if (parts.length !== 5) { errors.push("Entry " + (i+1) + " needs 5 fields: " + entry); continue; }', 'if (parts.length !== 5) { throw new Error("planted: " + entry); }'],
    ['try { raw = localStorage.getItem(STORAGE_KEY); } catch(e) { buildDefaultStudents(); return; }', 'raw = localStorage.getItem(STORAGE_KEY);'],
  ],
  'math-minute.html': [
    ['function generateProblemsForLevel(level) {', 'function generateProblemsForLevel(level) {\n  if (level === 7) throw new Error("planted");'],
    ["if (parts.length !== 3) { parseErrors.push('Entry ' + (i+1) + ' is invalid: \"' + entry + '\"'); continue; }", "if (parts.length !== 3) { throw new Error('planted: ' + entry); }"],
    ['try { savedRaw = localStorage.getItem(STORAGE_KEY); } catch (error) { buildDefaultStudents(); return; }', 'savedRaw = localStorage.getItem(STORAGE_KEY);'],
  ],
  'math-facts.html': [
    ['function generateProblemsForLevel(level) {', 'function generateProblemsForLevel(level) {\n  if (level === "x7") throw new Error("planted");'],
    ["if (parts.length !== 3) { parseErrors.push('Entry ' + (i+1) + ' is invalid: \"' + entry + '\"'); continue; }", "if (parts.length !== 3) { throw new Error('planted: ' + entry); }"],
    ['try { savedRaw = localStorage.getItem(STORAGE_KEY); } catch (error) { buildDefaultStudents(); return; }', 'savedRaw = localStorage.getItem(STORAGE_KEY);'],
  ],
};
function controlBody(file) {
  let body = fs.readFileSync(path.join(ROOT, file), 'utf8');
  for (const [from, to] of PLANTS[file]) {
    const n = body.split(from).length - 1;
    if (n !== 1) throw new Error(`control anchor matched ${n}× in ${file}: ${from.slice(0, 60)}`);
    body = body.replace(from, to);
  }
  return body;
}

const srv = await serve(); const browser = await launch();

// Open a page raw (no prepare), with extra init scripts and seeded storage; dialogs accepted; console errors kept.
async function open(file, { init = [], storage = {} } = {}) {
  const p = await openPage(browser, srv.base, file, { raw: true, storage });
  p.consoleErrors = [];
  p.page.on('console', m => { if (m.type() === 'error') p.consoleErrors.push(m.text()); });
  p.page.on('dialog', d => d.accept());
  if (CONTROL) { const body = controlBody(file); await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body })); }
  for (const s of init) await p.context.addInitScript(s);
  if (CONTROL || init.length) { await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached', timeout: 10000 }).catch(() => {}); }
  p.sel = {
    isIndex: file === 'index.html',
    level: 'select[name="level"]', grade: 'select[name="grade"]', type: 'select[name="problemType"]', count: 'select[name="count"]',
    anyway: file === 'index.html' ? '#mwgValidationGenerate' : '#mmValidationGenerate',
    fix: file === 'index.html' ? '#mwgValidationFix' : '#mmValidationFix',
    box: file === 'index.html' ? '#mwgValidationBox' : '#mmValidationBox',
    errorsOnly: file === 'index.html' ? '#mwgErrors' : '#errors',
    status: file === 'index.html' ? '#mwgStatus' : '#statusMessages',
    add: file === 'index.html' ? '#mwgAddStudentBtn' : '#addStudentButton',
    fillDown: file === 'index.html' ? '#mwgFillDownBtn' : '#fillDownButton',
    genCode: file === 'index.html' ? '#mwgGenCodeBtn' : '#generateAdvancedCodeButton',
    clearCurrent: file === 'index.html' ? '#mwgClearCurrentBtn' : '#clearCurrentRosterButton',
    clearSaved: file === 'index.html' ? '#mwgClearSavedBtn' : '#clearSavedRosterButton',
    removeNumber: file === 'index.html' ? '#mwgRemoveNumberToggle' : '#removeNumberToggle',
    nameBlank: file === 'index.html' ? '#mwgNameBlankToggle' : '#nameBlankToggle',
    headerLine: file === 'index.html' ? null : '#headerLineInput',
    dup: file === 'index.html' ? '.mwg-duplicate-link' : '.duplicate-student-link',
    del: file === 'index.html' ? '.mwg-delete-link' : '.delete-student-link',
    cells: file === 'index.html' ? '.mwg-problem-cell, .mwg-horiz-cell' : '.problem-cell',
    desc: file === 'index.html' ? '.mwg-ws-desc-text' : '.description-text',
  };
  return p;
}
const text = (p, sel) => p.page.$$eval(sel, els => els.map(e => e.innerText.trim()).filter(Boolean).join(' | '));
const entries = p => p.page.locator(`${p.spec.students} ${p.spec.entry}`).count();
const setSelect = (p, sel, value) => p.page.evaluate(([sel, value]) => {
  const s = document.querySelector(sel); if (!s) return false;
  s.value = value; s.dispatchEvent(new Event('change', { bubbles: true })); return s.value === value;
}, [sel, value]);
// Click Generate; pass the validation box when it shows; wait for a print, a notice or an error list.
async function fire(p, ms = 20000) {
  const n = await p.prints();
  await p.page.click(p.spec.generate);
  const box = p.page.locator(p.sel.box);
  if (await box.count() && await box.isVisible()) await p.page.click(p.sel.anyway);
  await p.page.waitForFunction(([n, sel]) => window.__prints > n || [...document.querySelectorAll(sel)].some(e => e.innerText.trim()), [n, p.spec.errors], { timeout: ms }).catch(() => {});
  // the skipped-entries list shows at once; the print follows the page's 200 ms settle
  if ((await p.prints()) === n) await p.page.waitForFunction(n => window.__prints > n, n, { timeout: 2000 }).catch(() => {});
  return { printed: (await p.prints()) > n, said: await text(p, p.spec.errors) };
}
async function sheets(p) {
  return p.page.evaluate(({ sheet, keySheet, cells, desc }) => {
    const all = [...document.querySelectorAll(`${sheet}, ${keySheet}`)];
    const isKey = s => s.matches(keySheet) && !s.matches(sheet) ? true : /Answer Key|\(Key/i.test(s.textContent);
    // top-level cells only: index's long-division cell wraps a second cell element
    const count = s => [...s.querySelectorAll(cells)].filter(c => !c.parentElement.closest(cells)).length;
    const rows = s => { const g = s.querySelector('[class*="rows-"]'); const m = g && g.className.match(/rows-(\d+)/); return m ? +m[1] * 10 : null; };
    return all.map(s => ({ key: isKey(s), cells: count(s), rows: rows(s), desc: (s.querySelector(desc) || {}).textContent || s.textContent.slice(0, 120) }));
  }, { sheet: p.spec.sheet, keySheet: p.spec.keySheet, cells: p.sel.cells, desc: p.sel.desc });
}
const COUNT_WORDS = { thirty: 30, forty: 40, fifty: 50, sixty: 60 };
const descCount = d => { const m = d.match(/^\s*(\d+)\b/) || d.match(/\b(Thirty|Forty|Fifty|Sixty)\b/i); return m ? (COUNT_WORDS[m[1].toLowerCase()] || +m[1]) : null; };

// ── 1. every selector generates through the Standard form ──
async function armSelectors(file) {
  const p = await open(file);
  // one entry: delete the other two
  while (await entries(p) > 1) await p.page.locator(`${p.spec.students} ${p.spec.entry}`).nth(1).locator(p.sel.del).click();
  await p.page.setChecked(p.spec.key, true);
  const first = `${p.spec.students} ${p.spec.entry}`;
  const combos = [];
  if (!p.sel.isIndex) {
    const levels = await p.page.$$eval(`${first} ${p.sel.level} option`, os => os.map(o => o.value).filter(Boolean));
    for (const level of levels) combos.push({ label: `level ${level}`, set: async () => setSelect(p, `${first} ${p.sel.level}`, level), count: null });
  } else {
    const grades = await p.page.$$eval(`${first} ${p.sel.grade} option`, os => os.map(o => o.value).filter(Boolean));
    for (const grade of grades) {
      await setSelect(p, `${first} ${p.sel.grade}`, grade);
      const types = await p.page.$$eval(`${first} ${p.sel.type} option`, os => os.map(o => o.value).filter(Boolean));
      for (const type of types) {
        await setSelect(p, `${first} ${p.sel.type}`, type);
        const counts = await p.page.$$eval(`${first} ${p.sel.count} option`, os => os.map(o => o.value).filter(Boolean));
        for (const count of counts) combos.push({ label: `grade ${grade} ${type} ×${count}`, count: +count, set: async () => {
          await setSelect(p, `${first} ${p.sel.grade}`, grade); await setSelect(p, `${first} ${p.sel.type}`, type); return setSelect(p, `${first} ${p.sel.count}`, count);
        } });
      }
    }
  }
  const bad = [], mismatched = [], t0 = Date.now();
  for (const c of combos) {
    const set = await c.set();
    if (!set) { bad.push(`${c.label}: the option could not be selected`); continue; }
    const errBefore = p.errors.length;
    const r = await fire(p, 3000);   // a generate is synchronous and its print follows the 200 ms settle: a combination that throws waits 3 s, not 20
    const sh = await sheets(p);
    const ws = sh.filter(s => !s.key), ks = sh.filter(s => s.key);
    const want = c.count ?? descCount(ws[0]?.desc || '') ?? ws[0]?.rows;
    if (!r.printed || p.errors.length > errBefore) bad.push(`${c.label}: ${r.printed ? '' : 'no print; '}${p.errors.slice(errBefore).join(' / ') || r.said || ''}`);
    else if (ws.length !== 1 || ks.length < 1) bad.push(`${c.label}: ${ws.length} sheets, ${ks.length} keys`);
    else if (ws[0].cells !== want || ks.some(k => k.cells !== ws[0].cells) || (descCount(ws[0].desc) ?? ws[0].rows) !== ws[0].cells) mismatched.push(`${c.label}: ${ws[0].cells} cells (asked ${want}, description "${ws[0].desc.trim().slice(0, 40)}", key ${ks.map(k => k.cells).join('/')})`);
  }
  check(combos.length >= (p.sel.isIndex ? 500 : 20), `${combos.length} selector combinations offered by the form (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  check(!bad.length, `every combination generates a sheet and a key with 0 page errors (${bad.length} failed${bad.length ? ': ' + bad.slice(0, 3).join('; ') : ''})`);
  check(!mismatched.length, `every sheet holds the count asked, its description's count, and its key the same (${mismatched.length} off${mismatched.length ? ': ' + mismatched.slice(0, 3).join('; ') : ''})`);
  check(!p.consoleErrors.length, `0 console errors over the run (${p.consoleErrors.length}${p.consoleErrors.length ? ': ' + p.consoleErrors[0].slice(0, 80) : ''})`);
  await p.close();
}

// ── 2. a malformed Advanced paste ──
const PASTES = {
  'math-minute.html': { good: 6, lenient: 3, bad: 4, nums: [4, 5, 6, 7], text: [
    'Avi Cohen, 1, 5;', 'Cohen, Dana, 2, 7;', ', 3, 19;', 'Noa, 4;', 'Lior, 5, 22;', 'Tal, 6, abc;', 'Gal, 7, ;', ';;', '', '',
    '   Maya   ,   8   ,   9   ;', 'Eli\t, 9, 10;', 'Rina, 10, 7.5;', 'Shai, 11, 1O;', 'Dov, 12, 3, 4;', 'Ben, 13, 11'].join('\r\n') },
  'math-facts.html': { good: 8, lenient: 1, bad: 5, nums: [5, 6, 7, 8, 9], text: [
    'Avi Cohen, 1, +2;', 'Cohen, Dana, 2, x3;', ', 3, X3;', 'Uri, 4, ×3;', 'Noa, 5;', 'Lior, 6, +99;', 'Tal, 7, abc;', 'Gal, 8, ;', 'Ron, 9, x;', ';;', '', '',
    '   Maya   ,   10   ,   /4   ;', 'Eli\t, 11, ÷4;', 'Yael, 12, *5;', 'Dov, 13, 3, +2;', 'Ben, 14, doubles'].join('\r\n') },
  'index.html': { good: 5, lenient: 3, bad: 6, nums: [4, 5, 6, 7, 8, 12], text: [
    'Avi Cohen, 1, add1, 30, 2;', 'Cohen, Dana, 2, sub2, 40, 3;', ', 3, mul1, 30, 1;', 'Noa, 4, add1, 30;', 'Lior, 5, add1, 30, 9;', 'Tal, 6, add1, 35, 2;',
    'Gal, 7, fractions, 30, 1;', 'Ron, 8, mixed[add1|foo], 30, 2;', ';;', '', '',
    '   Maya   ,   9   ,   div1   ,   30   ,   4   ;', 'Eli\t, 10, mixed, 40, 5;', 'Rina, 11, add1, 30, 2.5;', 'Shai, 12, add1, 3O, 2;', 'Dov, 13, 14, add2, 30, 2;', 'Ben, 15, rounding, 60, 5'].join('\r\n') },
};
async function armPaste(file) {
  const p = await open(file);
  const spec = PASTES[file];
  await p.page.click(p.spec.modeToggle);
  await p.page.fill(p.spec.advanced, spec.text);
  const r = await fire(p);
  const sh = await sheets(p);
  const errLines = (await text(p, p.sel.errorsOnly)).split('\n').map(s => s.trim()).filter(s => /Entry \d+/.test(s));
  const names = await p.page.$$eval(p.spec.sheet, (ss, isIndex) => ss.map(s => { const n = s.querySelector('.student-name-value, .mwg-student-name, [class*="name"]'); return (n || s).textContent.trim().slice(0, 60); }), p.sel.isIndex);
  check(r.printed && !p.errors.length, `the paste prints with 0 page errors (${p.errors.join(' / ') || 'none'})`);
  check(sh.length === spec.good + spec.lenient, `${sh.length} sheets for ${spec.good} well-formed + ${spec.lenient} leniently read entries`);
  check(errLines.length === spec.bad, `${errLines.length} entries reported (${spec.bad} malformed): ${errLines.map(l => l.replace(/^Entry (\d+).*?["“:]\s*/, '#$1 ').slice(0, 28)).join(' · ')}`);
  check(errLines.every(l => /Entry \d+/.test(l)) && errLines.length > 0, `every report names its entry and quotes it`);
  const lenient = await p.page.$$eval(p.spec.sheet, (ss, sel) => ss.map(s => ({ name: (s.querySelector(sel.name) || {}).textContent || '', desc: (s.querySelector(sel.desc) || {}).textContent || '' })).filter(x => /Rina|Shai|Dov|Yael|Ben/.test(x.name)).map(x => `"${x.name.trim()}" → ${x.desc.replace(/MathSheet\.io/, '').trim().slice(0, 48)}`), { name: p.sel.isIndex ? '.mwg-ws-field-value' : '.student-field-value', desc: p.sel.desc });
  note(`lenient reads: ${lenient.join('; ')}`);
  // numbered as a teacher counts the lines, not by raw ";" chunk (a newline after ";" made an empty one: "Entry 10" for the 6th line, S2; fixed S11)
  const nums = errLines.map(l => +(l.match(/Entry (\d+)/) || [])[1]);
  check(nums.join() === spec.nums.join(), `the reports are numbered as a teacher counts the entries (${nums.join(', ')}; want ${spec.nums.join(', ')})`);
  await p.close();
}

// ── 3. a 500-entry paste, Windows line ends ──
async function armBigPaste(file) {
  const p = await open(file);
  const sel = file === 'math-minute.html' ? i => 1 + (i % 21) : file === 'math-facts.html' ? i => ['+2', 'x3', '/4', '-5', 'doubles', 'mix+30', '+10'][i % 7] : i => ['add1, 30, 2', 'sub2, 40, 3', 'mul3, 50, 4', 'div2, 60, 5', 'fractions, 30, 6', 'mixed, 30, 7', 'rounding, 30, 5'][i % 7];
  const paste = Array.from({ length: 500 }, (_, i) => `${i % 3 ? 'Student' : 'תלמיד'} ${i + 1}, ${i + 1}, ${sel(i)};`).join('\r\n');
  await p.page.click(p.spec.modeToggle);
  await p.page.fill(p.spec.advanced, paste);
  const t0 = Date.now(); const r = await fire(p); const ms = Date.now() - t0;
  const sh = await sheets(p);
  const reported = await text(p, p.sel.errorsOnly);
  check(r.printed && !p.errors.length && !reported, `500 entries with Windows line ends print with 0 page errors and nothing skipped (${ms} ms)`);
  check(sh.length === 500 && sh.every(s => s.cells >= 30), `500 sheets, each with its problems (${sh.length}; cells ${Math.min(...sh.map(s => s.cells))}–${Math.max(...sh.map(s => s.cells))})`);
  await p.close();
}

// ── 4. storage denied / full ──
const DENY = `Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Access is denied for this document.', 'SecurityError'); } });`;
const FULL = `Storage.prototype.setItem = function () { throw new DOMException('The quota has been exceeded.', 'QuotaExceededError'); };`;
async function armStorage(file) {
  for (const [name, init] of [['denied (the accessor throws)', DENY], ['full (setItem throws)', FULL]]) {
    const p = await open(file, { init: [init] });
    const n = await entries(p);
    check(n === 3 && !p.errors.length, `localStorage ${name}: the page loads its 3 default entries with 0 page errors (${n}; ${p.errors.join(' / ') || 'none'})`);
    if (!n) { await p.close(); continue; }
    await p.page.click(p.spec.save);
    const said = await text(p, p.sel.status);
    check(/Unable to save/.test(said) && !p.errors.length, `Save Roster says so ("${said.slice(0, 50)}") without throwing`);
    await p.page.click(p.sel.clearSaved);
    const said2 = await text(p, p.sel.status);
    check((name.startsWith('denied') ? /Unable to clear/.test(said2) : /cleared/.test(said2)) && !p.errors.length, `Clear Saved Roster says "${said2.slice(0, 50)}" without throwing`);
    await p.spec.prepare(p.page);
    const r = await fire(p);
    check(r.printed && !p.errors.length, `Generate still prints (${(await sheets(p)).length} sheets)`);
    await p.close();
  }
}

// ── 5. saved payloads of every bad shape ──
function payloads(file) {
  const key = PAGES[file].storageKey, isIndex = file === 'index.html';
  const roster = isIndex ? 'students' : 'standardStudents';
  const v1key = key.replace(/_v\d+$/, '_v1');
  const legacy = isIndex
    ? { inputMode: 'standard', worksheetsPerStudent: '2', answerKey: true, advancedInput: '', students: [{ name: 'Old', number: '1', grade: '3', type: 'add2', count: '40' }] }
    : { inputMode: 'standard', worksheetsPerStudent: '2', answerKey: true, advancedInput: '', students: [{ name: 'Old', number: '1', level: isIndex ? '' : (file === 'math-facts.html' ? 'x3' : '5') }] };
  const good = isIndex ? { name: 'Fine', number: '1', grade: '2', type: 'add1', count: '30' } : { name: 'Fine', number: '1', level: file === 'math-facts.html' ? '+2' : '5' };
  const list = [
    ['null', { [key]: 'null' }, 3],
    ['a bare string', { [key]: '"hello"' }, 3],
    ['not JSON', { [key]: '{oops' }, 3],
    ['an empty array', { [key]: '[]' }, 3],
    ['an empty object', { [key]: '{}' }, 3],
    ['a roster that is a string', { [key]: JSON.stringify({ [roster]: 'Avi, 1, 5;' }) }, null],
    ['a roster with a null student', { [key]: JSON.stringify({ [roster]: [null, good] }) }, null],
    ['an unknown level / type for the grade', { [key]: JSON.stringify({ [roster]: [isIndex ? { name: 'Odd', number: '1', grade: '1', type: 'fractions', count: '30' } : { name: 'Odd', number: '1', level: isIndex ? '' : '99' }, good] }) }, 2],
    ['an out-of-range grade and count', { [key]: JSON.stringify({ [roster]: [isIndex ? { name: 'Odd', number: '1', grade: '9', type: 'add1', count: '35' } : { name: 'Odd', number: '1', level: 'abc' }, good] }) }, 2],
    ['settings out of range', { [key]: JSON.stringify({ inputMode: 'bogus', worksheetsPerStudent: '99', answerKey: 'yes', removeNumber: 1, nameBlank: null, headerLine: 12345, advancedInput: 42, [roster]: [good] }) }, 1],
    ['the legacy v1 shape under the current key', { [key]: JSON.stringify(legacy) }, isIndex ? 1 : 3],
    ['a v1 key beside no current one', { [v1key]: JSON.stringify(legacy) }, 3],
    ['the current key holding 1 MB of text', { [key]: JSON.stringify({ [roster]: [good], advancedInput: 'x'.repeat(1 << 20) }) }, 1],
  ];
  return list;
}
async function armPayloads(file) {
  const bad = [];
  for (const [label, storage, wantEntries] of payloads(file)) {
    const p = await open(file, { storage });
    const n = await entries(p);
    const okN = n >= 1 && (wantEntries === null || n === wantEntries);
    const r = await fire(p);
    const sh = await sheets(p);
    const outcome = r.printed ? `${sh.length} sheets` : r.said ? `said "${r.said.slice(0, 40)}"` : 'nothing';
    const ok = okN && !p.errors.length && (r.printed || /No valid students|unfilled required/i.test(r.said));
    if (!ok) bad.push(`${label}: ${n} entries${wantEntries !== null ? ` (want ${wantEntries})` : ''}, ${outcome}, errors: ${p.errors.join(' / ') || 'none'}`);
    else note(`${label}: ${n} entries, Generate → ${outcome}`);
    await p.close();
  }
  check(!bad.length, `every bad saved payload loads to a usable roster and Generate runs or says why (${bad.length} failed${bad.length ? ': ' + bad.join('; ') : ''})`);
}

// ── 6. every control, once ──
async function armControls(file) {
  const p = await open(file);
  const s = p.sel, first = `${p.spec.students} ${p.spec.entry}`;
  const step = async (label, fn) => { const e0 = p.errors.length; try { await fn(); } catch (err) { p.errors.push(`probe step "${label}": ${err.message.split('\n')[0]}`); } if (p.errors.length > e0) bad.push(`${label}: ${p.errors.slice(e0).join(' / ')}`); };
  const bad = [];
  await step('Generate with three blank entries', async () => { const r = await fire(p); if (!/No valid students/.test(r.said)) throw new Error(`said "${r.said.slice(0, 60)}"`); });
  await step('a name without a level: the validation box, Fix, then Generate Anyway', async () => {
    await p.page.fill(`${first} ${p.spec.name}`, 'Avi');
    await p.page.click(p.spec.generate); if (!await p.page.locator(s.box).isVisible()) throw new Error('no validation box');
    await p.page.click(s.fix); if (await p.page.locator(s.box).isVisible()) throw new Error('Fix left the box open');
    const r = await fire(p); if (!/No valid students/.test(r.said)) throw new Error(`Generate Anyway said "${r.said.slice(0, 60)}"`);
  });
  await step('Add Student, Duplicate, Delete every entry (defaults return)', async () => {
    await p.page.click(s.add); await p.page.locator(first).first().locator(s.dup).click();
    if (await entries(p) !== 5) throw new Error(`${await entries(p)} entries after add + duplicate`);
    for (let i = 0; i < 5; i++) await p.page.locator(first).first().locator(s.del).click();
    if (await entries(p) !== 3) throw new Error(`${await entries(p)} entries after deleting all`);
  });
  await step('Fill Down from a filled first entry', async () => {
    await p.spec.prepare(p.page);
    await p.page.click(s.fillDown); const said = await text(p, s.status); if (!/filled down/i.test(said)) throw new Error(`said "${said}"`);
  });
  await step('Generate Advanced Code: open, copy, use, close', async () => {
    await p.page.click(s.genCode);
    const panel = p.page.locator(s.isIndex ? '#mwgCodePanel, #mwgCodeModal' : '#advancedCodePanel, #advancedCodeModal');
    if (!await panel.first().isVisible()) throw new Error('the code panel did not open');
    await p.page.click(s.isIndex ? '#mwgCopyCodeBtn' : '#copyAdvancedCodeButton');
    await p.page.waitForFunction(sel => [...document.querySelectorAll(sel)].some(e => /copied|Unable/i.test(e.innerText)), s.status, { timeout: 5000 });
    await p.page.click(s.isIndex ? '#mwgUseCodeBtn' : '#useAdvancedCodeButton');
    const code = await p.page.inputValue(p.spec.advanced); if (!/;/.test(code)) throw new Error(`Advanced box holds "${code.slice(0, 40)}"`);
    await p.page.click(p.spec.modeToggle);
    await p.page.click(s.genCode); await p.page.click(s.isIndex ? '#mwgCloseModal, #mwgCloseCodeBtn' : '#closeAdvancedCodeModal');
    if (await panel.first().isVisible()) throw new Error('Close left the panel open');
  });
  await step('Save, Clear current, Clear saved (dialogs accepted)', async () => {
    await p.page.click(p.spec.save); if (!/saved/i.test(await text(p, s.status))) throw new Error(`Save said "${await text(p, s.status)}"`);
    await p.page.click(s.clearCurrent); if (await entries(p) !== 3 || !/cleared/i.test(await text(p, s.status))) throw new Error(`Clear current: ${await entries(p)} entries, "${await text(p, s.status)}"`);
    await p.page.click(s.clearSaved); if (!/cleared/i.test(await text(p, s.status))) throw new Error(`Clear saved said "${await text(p, s.status)}"`);
  });
  await step('every toggle on, header line filled, Generate', async () => {
    await p.spec.prepare(p.page);
    for (const t of [p.spec.key, s.removeNumber, s.nameBlank]) await p.page.setChecked(t, true);
    if (s.headerLine) await p.page.fill(s.headerLine, 'Parashat Noach — פרשת נח');
    const r = await fire(p); if (!r.printed) throw new Error(`no print: "${r.said.slice(0, 60)}"`);
    for (const t of [p.spec.key, s.removeNumber, s.nameBlank]) await p.page.setChecked(t, false);
  });
  if (s.isIndex) await step('Mixed: Select all, Deselect all, the fraction and decimal "all ops", a single op; the ops panel', async () => {
    await setSelect(p, `${first} ${s.grade}`, '6'); await setSelect(p, `${first} ${s.type}`, 'mixed');
    for (const b of ['.mwg-mixed-select-all', '.mwg-mixed-deselect-all', '.mwg-mixed-select-all']) { await p.page.locator(first).first().locator(b).first().click(); const r = await fire(p); if (!r.printed) throw new Error(`${b}: no print, "${r.said.slice(0, 60)}"`); }
    for (const b of ['.mwg-frac-all', '.mwg-dec-all']) { const l = p.page.locator(first).first().locator(b); if (await l.count()) { await l.first().click(); const r = await fire(p); if (!r.printed) throw new Error(`${b}: no print`); } }
    await p.page.locator(first).first().locator('.mwg-mixed-deselect-all').click();
    await p.page.locator(first).first().locator('.mwg-mixed-cb').first().check(); const r1 = await fire(p); if (!r1.printed) throw new Error('one Mixed box: no print');
    for (const type of ['fractions', 'decimals']) {
      await setSelect(p, `${first} ${s.type}`, type);
      const ops = p.page.locator(first).first().locator('.mwg-ops-panel input[type="checkbox"]'); const n = await ops.count(); if (!n) throw new Error(`${type}: no ops panel`);
      for (let i = 0; i < n; i++) await ops.nth(i).setChecked(i === 0);
      const r = await fire(p); if (!r.printed) throw new Error(`${type} one op: no print`);
      const all = p.page.locator(first).first().locator('.mwg-ops-select-all'); if (await all.count()) { await all.first().click(); const r2 = await fire(p); if (!r2.printed) throw new Error(`${type} select all: no print`); }
      for (let i = 0; i < n; i++) await ops.nth(i).setChecked(false);
      const r3 = await fire(p); if (!r3.printed && !/No valid|select/i.test(r3.said)) throw new Error(`${type} no ops: no print and said "${r3.said.slice(0, 60)}"`);
      note(`${type} with every operation unchecked → ${r3.printed ? (await sheets(p)).filter(x => !x.key).map(x => x.cells + ' cells').join(', ') : 'said "' + r3.said.slice(0, 50) + '"'}`);
    }
  });
  check(!bad.length, `every control fired once with 0 page errors (${bad.length} step${bad.length === 1 ? '' : 's'} failed${bad.length ? ': ' + bad.join('; ') : ''})`);
  check(!p.consoleErrors.length, `0 console errors (${p.consoleErrors.length}${p.consoleErrors.length ? ': ' + p.consoleErrors[0].slice(0, 80) : ''})`);
  await p.close();
}

for (const file of FILES) {
  console.log(`${file}${CONTROL ? ' (control: three planted defects)' : ''}`);
  if (!SKIP_SEL) await armSelectors(file);
  await armPaste(file);
  await armBigPaste(file);
  await armStorage(file);
  await armPayloads(file);
  await armControls(file);
}
console.log(`S11-robustness: ${failing ? failing + ' failing' : 'all green'}`);
await browser.close(); await srv.close();
process.exit(failing ? 1 : 0);
