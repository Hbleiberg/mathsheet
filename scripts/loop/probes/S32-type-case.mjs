// Probe (loop S32, pass E on index.html; found S21): the Advanced type was read case-sensitively, so "Add1", "Mixed"
// (as the Type menu writes it) or "Fractions[Add]" was skipped as "invalid type", where math-facts reads its codes
// whatever their capitals (S21). The type and its brackets are now read in lower case. Math.random seeded; through the
// Advanced box:
//   arm 1, every type of every grade, and bracket forms (mixed[…], fractions[…], decimals[…], short and whole op names),
//     typed in lower case, UPPER CASE and Title Case: the three pastes print byte-identical sheets, every entry printed;
//   arm 2, what is still wrong is still skipped and reported: an unknown type in capitals, a bracket name the grade
//     lacks in capitals ("Mixed[Fractions]" at Grade 2), a type the grade lacks ("LongDivision" at Grade 3);
//   arm 3, a capitalised across type asking 60 prints 30 and its note quotes the entry as typed;
//   arm 4, the lower-case paste: the sheets and the errors box byte-identical to REF's, the same seed.
// Fails before the change (`--control`: REF served as the page under test).
//   node scripts/loop/probes/S32-type-case.mjs [--control] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT, replayLater } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref') || '4303fd8', CONTROL = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = `(() => { let s = 20261109; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
// S35's sheet changes replayed on REF first (harness `replayLater`, S23's rule)
const refBody = replayLater(execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }));

const srv = await serve(); const browser = await launch();
async function open(body) {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (body) await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  p.errs = []; p.page.on('pageerror', e => p.errs.push(String(e)));
  await p.page.click('#mwgToggleModeBtn');
  return p;
}
async function paste(p, text) {
  await p.page.fill('#mwgAdvancedBox', text);
  await p.page.click('#mwgGenerateBtn'); await p.page.waitForTimeout(400);
  return p.page.evaluate(() => ({
    sheets: [...document.querySelectorAll('#mwgResults .mwg-worksheet')].map(w => ({
      name: (w.querySelector('[dir="auto"]') || {}).textContent || '',
      cells: w.querySelectorAll('.mwg-problems-grid > *, .mwg-horiz-grid > *').length })),
    errors: document.querySelector('#mwgErrors').innerText.trim(),
    html: document.querySelector('#mwgResults').innerHTML,
  }));
}
// the page's own grade → types table, read from the served page
const p0 = await open(null);
const GRADE_TYPES = await p0.page.evaluate(() => {
  const src = [...document.scripts].map(s => s.textContent).join('\n');
  const m = src.match(/var GRADE_TYPES = (\{[\s\S]*?\n\});/); return Function(`return ${m[1]}`)();
});
await p0.close();
const ENTRIES = [];
for (const [g, types] of Object.entries(GRADE_TYPES)) for (const t of types) ENTRIES.push([t, 30, g]);
ENTRIES.push(['mixed[add1|sub2]', 40, 3], ['mixed[mul2|div2|rounding]', 30, 4], ['fractions[add|divf]', 30, 6],
  ['fractions[fractions-add|fractions-sub]', 30, 7], ['decimals[add|mulw]', 30, 6], ['decimals[decimals-divd]', 30, 8],
  ['mixed[fractions-add|decimals-sub|add3]', 30, 6]);
const title = s => s.replace(/(^|[\[|\-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
const SPELL = { lower: s => s, upper: s => s.toUpperCase(), title };
const lines = f => ENTRIES.map(([t, c, g], i) => `S${i + 1}, ${i + 1}, ${f(t)}, ${c}, ${g};`).join('\n');
console.log(`index.html${CONTROL ? ` (control: ${REF} served)` : ''}: ${ENTRIES.length} entries, e.g. ${JSON.stringify(title('mixed[fractions-add|decimals-sub|add3]'))}`);

// arm 1
const runs = {};
for (const [k, f] of Object.entries(SPELL)) {
  const p = await open(CONTROL ? refBody : null);
  runs[k] = await paste(p, lines(f)); runs[k].errs = p.errs.length;
  await p.close();
}
check(runs.lower.sheets.length === ENTRIES.length && runs.lower.errors === '', `lower case: ${runs.lower.sheets.length} of ${ENTRIES.length} entries print, nothing reported`);
for (const k of ['upper', 'title']) {
  const r = runs[k];
  check(r.sheets.length === ENTRIES.length && r.html === runs.lower.html && r.errors === '',
    `${k}: ${r.sheets.length} of ${ENTRIES.length} entries print, the sheets ${r.html === runs.lower.html ? 'byte-identical to' : 'NOT identical to'} lower case's${r.errors ? ', reported: ' + JSON.stringify(r.errors.split('\n').slice(2, 4).join(' / ')) : ''}`);
}
check(Object.values(runs).every(r => r.errs === 0), `0 page errors`);

// arm 2 and 3
{
  const p = await open(CONTROL ? refBody : null);
  const r = await paste(p, ['Ok One, 1, Add1, 30, 2;', 'Bad Type, 2, Zz, 30, 2;', 'Bad Bracket, 3, Mixed[Fractions], 30, 2;',
    'Bad Grade, 4, LongDivision, 30, 3;', 'Capped, 5, Rounding, 60, 4;'].join('\n'));
  const lines2 = r.errors.split('\n');
  check(r.sheets.map(s => s.name).join('|') === 'Ok One|Capped',
    `arm 2: the good and the capped entries print (${JSON.stringify(r.sheets.map(s => s.name))})`);
  check(['Entry 2 invalid type for grade 2: zz', 'Entry 3 invalid type for grade 2: fractions', 'Entry 4 invalid type for grade 3: longdivision'].every(m => lines2.includes(m)),
    `arm 2: the unknown type, the bracket name and the type the grade lacks are each reported (${JSON.stringify(lines2.filter(l => /^Entry [234] /.test(l)))})`);
  const capped = r.sheets.find(s => s.name === 'Capped');
  check(!!capped && capped.cells === 30 && lines2.includes('Entry 5: Rounding prints at most 30 problems (60 asked)'),
    `arm 3: "Rounding, 60" prints ${capped ? capped.cells : 0} and says ${JSON.stringify(lines2.find(l => /^Entry 5/.test(l)) || '')}`);
  await p.close();
}

// arm 4
if (!CONTROL) {
  const b = await open(refBody);
  const rb = await paste(b, lines(SPELL.lower)); await b.close();
  check(rb.html === runs.lower.html && rb.errors === runs.lower.errors && rb.html.length > 10000,
    `arm 4: the lower-case paste byte-identical to ${REF} (${runs.lower.html.length} chars of sheets, errors box ${rb.errors === runs.lower.errors ? 'the same' : 'DIFFERENT'})`);
}
await browser.close(); await srv.close();
console.log(`S32-type-case: ${fails.length ? fails.length + ' failing' : 'all green'}`);
process.exit(fails.length ? 1 : 0);
