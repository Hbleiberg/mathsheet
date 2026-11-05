// S9 probe: a long student name shrinks to fit its printed line (approved S2) instead of being cut with "…".
// Per page, seeded, under print (the page's own move-to-body trick) for sheets and keys, with and without the
// Number field, 2 copies (the set label): every name's text fits its line (or sits at the 11 px floor), its
// baseline is the 18 px name's (±0.5 px), the line box keeps its height; names that fit carry no style and
// those sheets are byte-identical to the reference; every sheet stays 1056×816.
// `--only <file>`; `--control` runs the reference pages (HEAD unless `--ref <commit>`), which must fail.
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';
const args = process.argv.slice(2), flag = f => args.includes(f), opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const REF = opt('--ref') || 'HEAD', CONTROL = flag('--control');
const SEED = `(() => { let s = 2024; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const NAMES = ['Noa', 'Avi Cohen', 'Cohen, Avi', 'Bat-Sheva Rivka Goldberg', 'Yehuda Aryeh Leib Rosenzweig',
  "Mary-Elizabeth Fitzgerald-O'Connor", 'Chaya Mushka Bat-Sheva Schneerson-Goldberg', 'בת-שבע רבקה גולדברג',
  'Alexandria Montgomery-Washington the Third of Westchester'];
const PAGE = {
  'index.html': { row: (n, i) => `${n}, ${i + 1}, add2, 30, 2;`, field: '.mwg-ws-header-main > .mwg-ws-field:first-child > .mwg-ws-field-value',
    sheet: '.mwg-worksheet, .mwg-answer-key-sheet', results: '#mwgResults', printId: 'mwg-results-print', toggle: '#mwgToggleModeBtn', box: '#mwgAdvancedBox',
    key: '#mwgAnswerKeyToggle', copies: '#mwgWorksheetsPerStudent', removeNumber: '#mwgRemoveNumberToggle', go: '#mwgGenerateBtn' },
  'math-minute.html': { row: (n, i) => `${n}, ${i + 1}, ${(i % 21) + 1};`, field: '.worksheet-header-main > .student-field:first-child > .student-field-value',
    sheet: '.worksheet', results: '#results', printId: 'results-print', toggle: '#toggleInputModeButton', box: '#advancedInputBox',
    key: '#answerKeyToggle', copies: '#worksheetsPerStudent', removeNumber: '#removeNumberToggle', go: '#generatePrintButton' },
  'math-facts.html': { row: (n, i) => `${n}, ${i + 1}, ${['+3', 'mix+60', 'x7', '/7', 'mixmd40'][i % 5]};`, field: '.worksheet-header-main > .student-field:first-child > .student-field-value',
    sheet: '.worksheet', results: '#results', printId: 'results-print', toggle: '#toggleInputModeButton', box: '#advancedInputBox',
    key: '#answerKeyToggle', copies: '#worksheetsPerStudent', removeNumber: '#removeNumberToggle', go: '#generatePrintButton' },
};
const files = opt('--only') ? [opt('--only')] : Object.keys(PAGE);
const srv = await serve(); const browser = await launch();
let failing = 0;
const check = (ok, msg) => { if (!ok) failing++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); };

async function run(file, body, removeNumber) {
  const s = PAGE[file];
  const p = await openPage(browser, srv.base, file, { raw: true });
  await p.context.addInitScript(SEED);
  if (body) await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' });
  await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  await p.page.click(s.toggle);
  await p.page.setChecked(s.key, true);
  await p.page.setChecked(s.removeNumber, removeNumber);
  await p.page.selectOption(s.copies, '2');
  await p.page.fill(s.box, NAMES.map(s.row).join('\n'));
  const n = await p.prints(); await p.page.click(s.go); await p.page.waitForFunction(n => window.__prints > n, n);
  await p.page.emulateMedia({ media: 'print' });
  const out = await p.page.evaluate(({ s }) => {   // plain fields only: `row` is a function (cannot be serialized)
    const r = document.querySelector(s.results); r.id = s.printId; document.body.appendChild(r);
    return [...document.querySelectorAll(s.sheet)].map(sheet => {
      const f = sheet.querySelector(s.field), cs = getComputedStyle(f), b = sheet.getBoundingClientRect(), fb = f.getBoundingClientRect();
      const room = fb.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const range = document.createRange(); range.selectNodeContents(f); const text = range.getBoundingClientRect().width;
      const mark = document.createElement('span'); mark.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      f.appendChild(mark); const base = mark.getBoundingClientRect().top - fb.top; mark.remove();
      return { name: f.textContent, w: Math.round(b.width), h: Math.round(b.height), room, text, size: parseFloat(cs.fontSize),
        styled: f.hasAttribute('style'), base, boxH: fb.height, html: sheet.outerHTML };
    });
  }, { s: { results: s.results, printId: s.printId, sheet: s.sheet, field: s.field } });
  await p.close(); return out;
}

for (const file of files) {
  const ref = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
  console.log(`${file}${CONTROL ? ` (control: ${REF})` : ''}`);
  for (const removeNumber of [false, true]) {
    const now = await run(file, CONTROL ? ref : null, removeNumber), before = await run(file, ref, removeNumber);
    const tag = removeNumber ? 'no Number' : 'with Number';
    check(now.length === NAMES.length * 4 && now.every(x => x.w === 1056 && x.h === 816), `${tag}: ${now.length} sheets and keys, all 1056×816`);
    const named = now.filter(x => x.name);
    const ref18 = named.find(x => x.size === 18);
    const over = named.filter(x => x.text > x.room + 0.5 && x.size > 11);
    check(!over.length, `${tag}: every name fits its line or sits at 11 px (${over.length} overflow${over.length ? ': ' + [...new Set(over.map(x => `${x.name} ${x.text.toFixed(1)}/${x.room.toFixed(1)} px`))].slice(0, 3).join('; ') : ''})`);
    const shrunk = named.filter(x => x.size < 18);
    const sizes = [...new Set(NAMES.map(n => { const x = named.find(y => y.name === n); return x ? `${n.length}:${x.size}` : null; }).filter(Boolean))];
    check(shrunk.length > 0, `${tag}: long names shrink (${shrunk.length} of ${named.length}; length:px ${sizes.join(' ')})`);
    const drift = shrunk.filter(x => Math.abs(x.base - ref18.base) > 0.5 || Math.abs(x.boxH - ref18.boxH) > 0.01);
    check(!drift.length, `${tag}: shrunk names keep the 18 px baseline and line box (worst ${Math.max(0, ...shrunk.map(x => Math.abs(x.base - ref18.base))).toFixed(2)} px; boxes ${[...new Set(named.map(x => x.boxH.toFixed(2)))].join('/')})`);
    const fits = now.map((x, i) => [x, before[i]]).filter(([x]) => x.size === 18);
    const diff = fits.filter(([x, y]) => x.html !== y.html);
    const at = d => { const [a, b] = [d[0].html, d[1].html]; let k = 0; while (a[k] === b[k]) k++; return `${d[0].name}: …${a.slice(Math.max(0, k - 60), k + 40)}… vs …${b.slice(Math.max(0, k - 60), k + 40)}…`; };
    check(fits.every(([x]) => !x.styled) && !diff.length, `${tag}: ${fits.length} sheets whose name fits are unstyled and byte-identical to ${REF} (${diff.length} differ${diff.length ? '; ' + at(diff[0]) : ''})`);
  }
}
console.log(`S9-name-fit: ${failing ? failing + ' failing' : 'all green'}`);
await browser.close(); await srv.close();
process.exit(failing ? 1 : 0);
