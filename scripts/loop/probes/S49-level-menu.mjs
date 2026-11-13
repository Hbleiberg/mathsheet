// Probe (loop S49, pass C; found S20, approved S49 at gate 2): math-minute.html's Level menu writes each level as its
// Level Reference does, "5 – 40 Addition", without the leading zero ("05 - 40 Addition"), so typing a level's number
// picks it. By real keys on a closed Level select:
//   - the 21 options read "<n> – <name>", n = 1..21, each equal to its Level Reference item, in order; values 1..21;
//   - type-ahead: "5" picks Level 5, "1" Level 1, "12" Level 12, "21" Level 21, "9" Level 9 (the old menu: "5" and
//     "9" picked nothing, "1" picked Level 10);
//   - a saved roster on Levels 5, 12 and 21 restores on them, its menus showing "5 – 40 Addition" …;
//   - nothing else moves: a seeded generate of the 21 levels with keys and the Generate Advanced Code text are
//     byte-identical to the page before the change;
//   - 0 page errors.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S49-level-menu.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const FILE = 'math-minute.html', KEY = 'mathMinuteRosterData_v2';
const SEED = `(() => { let s = 4949; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const SEL = '#studentsContainer .student-entry:first-child select[name="level"]';
const SAVED = { [KEY]: JSON.stringify({ inputMode: 'standard', worksheetsPerStudent: '1', answerKey: false, removeNumber: false, nameBlank: false,
  headerLine: '', advancedInput: '', standardStudents: [{ name: 'Avi', number: '1', level: '5' }, { name: 'Noa', number: '2', level: '12' }, { name: '', number: '3', level: '21' }] }) };

async function open(browser, base, ref, opts = {}) {
  const p = await openPage(browser, base, FILE, { raw: true, ...opts });
  await p.context.addInitScript(SEED);
  if (ref) {
    const body = execSync(`git show ${ref}:${FILE}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    await p.page.route(new RegExp(`/${FILE.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(SEL, { state: 'attached' });
  return p;
}
async function typed(pg, keys) {
  await pg.selectOption(SEL, '');
  await pg.focus(SEL);
  await pg.keyboard.type(keys, { delay: 30 });
  await pg.waitForTimeout(1100);   // the type-ahead buffer lapses before the next run
  return pg.$eval(SEL, s => s.value);
}
async function run(browser, base, ref) {
  const out = {};
  const p = await open(browser, base, ref); const pg = p.page;
  out.options = await pg.$$eval(`${SEL} option`, l => l.map(o => [o.value, o.textContent]));
  out.reference = await pg.$$eval('.level-reference-item', l => l.map(e => e.textContent));
  out.typed = {};
  for (const k of ['5', '1', '12', '21', '9']) out.typed[k] = await typed(pg, k);
  // a seeded generate of every level with keys, through the Advanced box
  await pg.click('#toggleInputModeButton'); await pg.check('#answerKeyToggle');
  await pg.fill('#advancedInputBox', Array.from({ length: 21 }, (_, i) => `S${i + 1}, ${i + 1}, ${i + 1};`).join('\n'));
  await pg.click('#generatePrintButton'); await pg.waitForFunction(() => window.__prints > 0);
  out.sheets = await pg.$eval('#results', r => r.innerHTML); out.nSheets = await pg.$$eval('.worksheet', l => l.length);
  out.errors = p.errors.slice(); await p.close();
  const q = await open(browser, base, ref, { storage: SAVED }); const qg = q.page;
  out.restored = await qg.$$eval('#studentsContainer select[name="level"]', l => l.map(s => s.value + ':' + s.options[s.selectedIndex].textContent));
  await qg.click('#generateAdvancedCodeButton');
  out.code = await qg.$eval('#advancedCodeOutput', t => t.value).catch(() => null);
  out.errors.push(...q.errors); await q.close();
  return out;
}

const BEFORE = REF ? null : (execSync(`git log -1 --format=%h -S'"Easy Addition",' -- ${FILE}`, { cwd: ROOT, encoding: 'utf8' }).trim() || null);
const OLD = BEFORE ? `${BEFORE}~1` : 'HEAD';
const srv = await serve(); const browser = await launch();
try {
  console.log(`${FILE}${REF ? ` (served from ${REF})` : ''}; before the change: ${OLD}`);
  const now = await run(browser, srv.base, REF);
  const levels = now.options.slice(1);
  check(levels.length === 21 && now.reference.length === 21, `21 options and 21 Level Reference items (${levels.length}, ${now.reference.length})`);
  const bad = levels.filter(([v, t], i) => v !== String(i + 1) || !t.startsWith(`${i + 1} – `) || t !== now.reference[i]);
  check(bad.length === 0, `each option reads "<n> – <name>" as its reference item does, values 1..21 (${bad.length} differ${bad.length ? ': ' + bad.slice(0, 3).map(b => b[1]).join(', ') : ''}; e.g. "${levels[4] && levels[4][1]}")`);
  const want = { 5: '5', 1: '1', 12: '12', 21: '21', 9: '9' };
  const off = Object.keys(want).filter(k => now.typed[k] !== want[k]);
  check(off.length === 0, `type-ahead picks the level typed (${Object.entries(now.typed).map(([k, v]) => `"${k}" → ${v || 'nothing'}`).join(', ')})`);
  check(now.restored.join('|') === '5:5 – 40 Addition|12:12 – Hard X|21:21 – Mixed', `a saved roster restores on its levels (${now.restored.join(', ')})`);
  check(now.nSheets === 42 && now.code && /Avi, 1, 5;/.test(now.code), `the handles resolve: ${now.nSheets} sheets with keys, the code panel read (${JSON.stringify((now.code || '').split('\n')[0])})`);
  check(now.errors.length === 0, `0 page errors (${now.errors.join('; ')})`);
  if (!REF) {
    const old = await run(browser, srv.base, OLD);
    check(old.sheets === now.sheets, `the 42 seeded sheets and keys byte-identical to ${OLD}'s (${old.sheets.length} / ${now.sheets.length} chars)`);
    check(old.code === now.code, `Generate Advanced Code's text identical to ${OLD}'s`);
    check(old.reference.join('|') === now.reference.join('|'), `the Level Reference identical to ${OLD}'s`);
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS49-level-menu: ${fails.length} failing check(s)` : '\nS49-level-menu: all green');
process.exit(fails.length ? 1 : 0);
