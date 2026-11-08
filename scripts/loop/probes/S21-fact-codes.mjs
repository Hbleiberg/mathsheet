// Probe (loop S21, pass H on math-facts.html): the Advanced box read a fact code only as the Level Reference spells it,
// so a code written as the level menu shows it ("+0 +1", "Doubles"), with a capital ("Mix+30"), a space ("x 3",
// "mix +30") or a typed dash ("–3", Word's and the Mac's; "−3", the minus sign) was skipped as "invalid fact code".
// Each code below is pasted on its own line and must print its level's description; the codes that name no level
// ("3", "+1", "fr10", "x13", "+11", "mix+35") are still skipped and listed; the Standard roster built by "Use in
// Advanced Input" round-trips through Generate Advanced Code with the canonical code. Fails before the change
// (`--ref f5a60c2`).
//   node scripts/loop/probes/S21-fact-codes.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const FILE = 'math-facts.html';
// code as written → the code it means
const READ = [
  ['+0 +1', '+0+1'], ['+0  +1', '+0+1'], ['Doubles', 'doubles'], ['DOUBLES', 'doubles'], ['Doubles +1', 'doubles+1'], ['doubles + 1', 'doubles+1'],
  ['Mix+30', 'mix+30'], ['mix +30', 'mix+30'], ['mix+ 30', 'mix+30'], ['MIXPM40', 'mixpm40'], ['Mix-50', 'mix-50'], ['x 3', 'x3'], ['× 3', 'x3'],
  ['X12', 'x12'], ['÷ 4', '/4'], ['–3', '-3'], ['−3', '-3'], ['mix–30', 'mix-30'], ['−Self', '-self'], ['-FR10', '-fr10'], ['+ 10', '+10'],
  // the spellings that already worked stay as they were
  ['+3', '+3'], ['-3', '-3'], ['x7', 'x7'], ['*7', 'x7'], ['×7', 'x7'], ['/7', '/7'], ['÷7', '/7'], ['mix/40', 'mix/40'], ['mixmd60', 'mixmd60'],
];
const SKIP = ['3', '+1', 'fr10', 'x13', '+11', 'mix+35', 'plus 3'];

const srv = await serve(); const browser = await launch();
const p = await openPage(browser, srv.base, FILE, { raw: true });
const pg = p.page;
console.log(`${FILE}${REF ? ` (served from ${REF})` : ''}`);
if (REF) {
  const body = execSync(`git show ${REF}:${FILE}`, { cwd: ROOT, encoding: 'utf8' });
  await pg.route(new RegExp(`/${FILE.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
}
// the description each canonical code prints, from the Standard menu (the page's own table)
const DESC = await pg.evaluate(() => {
  const out = {};
  document.querySelectorAll('#studentsContainer select[name="level"] option').forEach(o => { if (o.value) out[o.value] = null; });
  return out;
});
check(Object.keys(DESC).length === 71, `the level menu lists 71 codes (${Object.keys(DESC).length})`);
await pg.click('#toggleInputModeButton');
// one paste with every canonical code first, to learn each description, then the variants
await pg.fill('#advancedInputBox', Object.keys(DESC).map((c, i) => `C${i}, ${i}, ${c};`).join('\n'));
await pg.click('#generatePrintButton'); await pg.waitForFunction(() => window.__prints > 0);
const canon = await pg.$$eval('#results .worksheet', w => w.map(x => x.querySelector('.description-text').textContent));
check(canon.length === 71, `every canonical code prints (${canon.length} sheets)`);
Object.keys(DESC).forEach((c, i) => { DESC[c] = canon[i]; });

const lines = READ.map(([written], i) => `Student ${i + 1}, ${i + 1}, ${written}`).concat(SKIP.map((w, i) => `Skip ${i + 1}, ${100 + i}, ${w}`));
await pg.fill('#advancedInputBox', lines.join('\n'));
const before = await pg.evaluate(() => window.__prints);
await pg.click('#generatePrintButton'); await pg.waitForFunction(b => window.__prints > b, before);
const got = await pg.$$eval('#results .worksheet', w => w.map(x => ({ name: x.querySelector('.student-field-value').textContent, desc: x.querySelector('.description-text').textContent })));
const errs = await pg.$eval('#errors', e => e.innerText);
READ.forEach(([written, code], i) => {
  const sheet = got.find(g => g.name === `Student ${i + 1}`);
  check(sheet && sheet.desc === DESC[code], `"${written}" reads as ${code} (${sheet ? sheet.desc : 'skipped'})`);
});
SKIP.forEach((w, i) => {
  check(!got.some(g => g.name === `Skip ${i + 1}`) && errs.includes(`Skip ${i + 1}, ${100 + i}, ${w}`), `"${w}" names no level: skipped and listed`);
});
check(got.length === READ.length, `${READ.length} sheets, one per readable line (${got.length})`);
// a class as a teacher writes it, a Hebrew name among them, in one paste; the box keeps what was written
await pg.fill('#advancedInputBox', 'Avi Cohen, 1, Doubles +1;\nיעל לוי, 2, Mix +30;\nSam Green, 3, –3;');
await pg.click('#generatePrintButton'); await pg.waitForFunction(b => window.__prints > b, before + 1, { timeout: 5000 }).catch(() => {});
await pg.waitForTimeout(300);
const three = await pg.$$eval('#results .worksheet .description-text', d => d.map(x => x.textContent));
check(JSON.stringify(three) === JSON.stringify([DESC['doubles+1'], DESC['mix+30'], DESC['-3']]), `a class with a Hebrew name prints its levels (${three.join(' | ')})`);
check((await pg.$eval('#advancedInputBox', t => t.value)).includes('Doubles +1'), 'the Advanced box keeps what the teacher wrote');
check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
await p.close(); await browser.close(); await srv.close();
console.log(fails.length ? `\nS21-fact-codes: ${fails.length} failing check(s)` : '\nS21-fact-codes: all green');
process.exit(fails.length ? 1 : 0);
