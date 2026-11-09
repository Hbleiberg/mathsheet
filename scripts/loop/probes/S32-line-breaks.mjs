// Probe (loop S32, pass E, all three pages): the Advanced box split its lines on "\n" alone, so lines joined by any
// other line break — U+2028 (Shift+Return in Pages, TextEdit or Notes on a Mac), U+2029, a vertical tab (Word's soft
// break), a form feed, NEL — with no ";" were read as one entry: the earlier lines became the last line's name ("Avi
// Cohen, 1, 5 Noa Levi, 2, 9 Dov K…"), one sheet printed at the last line's level, and nothing was reported (a name may
// hold commas). Every line break now ends an entry, as "\n" does. Math.random seeded; through the Advanced box:
//   arm 1, three lines with no ";" joined by each break (and by all of them in turn): three sheets, each under its own
//     name, number and level, nothing in the errors box;
//   arm 2, the same lines ending in ";": three sheets (they printed before, and still do);
//   arm 3, a bad middle line between two good ones joined by U+2028: reported as "Entry 2", the other two print;
//   arm 4, LF-joined and ";"-joined pastes: the sheets' markup byte-identical to REF's, the same seed.
// Fails before the change (`--control`: REF served as the page under test).
//   node scripts/loop/probes/S32-line-breaks.mjs [--control] [--ref <commit>] [--only <file>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref') || '469b56d', CONTROL = process.argv.includes('--control'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = `(() => { let s = 20261109; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const BREAKS = { 'LF': '\n', 'CRLF': '\r\n', 'U+2028': '\u2028', 'U+2029': '\u2029', 'VT': '\u000B', 'FF': '\u000C', 'NEL': '\u0085' };
const PAGESPEC = {
  'index.html': { ready: '#mwgStudentsContainer .mwg-student-entry', toggle: '#mwgToggleModeBtn', box: '#mwgAdvancedBox',
    gen: '#mwgGenerateBtn', errors: '#mwgErrors', results: '#mwgResults', sheet: '.mwg-worksheet', desc: '.mwg-ws-desc-text',
    lines: ['Avi Cohen, 1, add2, 30, 2', 'Noa Levi, 2, sub3, 40, 3', 'Dov Katz, 3, mul2, 50, 4'], bad: 'Bad Line, 9, zz, 30, 2' },
  'math-minute.html': { ready: '.student-entry', toggle: '#toggleInputModeButton', box: '#advancedInputBox',
    gen: '#generatePrintButton', errors: '#errors', results: '#results', sheet: '.worksheet', desc: '.description-text',
    lines: ['Avi Cohen, 1, 5', 'Noa Levi, 2, 9', 'Dov Katz, 3, 12'], bad: 'Bad Line, 9, 99' },
  'math-facts.html': { ready: '.student-entry', toggle: '#toggleInputModeButton', box: '#advancedInputBox',
    gen: '#generatePrintButton', errors: '#errors', results: '#results', sheet: '.worksheet', desc: '.description-text',
    lines: ['Avi Cohen, 1, +4', 'Noa Levi, 2, x3', 'Dov Katz, 3, -2'], bad: 'Bad Line, 9, zz' },
};

const srv = await serve(); const browser = await launch();
async function open(file, body) {
  const s = PAGESPEC[file];
  const p = await openPage(browser, srv.base, file, { raw: true });
  await p.context.addInitScript(SEED);
  if (body) await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(s.ready, { state: 'attached' });
  p.errs = []; p.page.on('pageerror', e => p.errs.push(String(e)));
  await p.page.click(s.toggle);
  return p;
}
async function paste(p, file, text) {
  const s = PAGESPEC[file];
  await p.page.fill(s.box, text);
  await p.page.click(s.gen); await p.page.waitForTimeout(300);
  return p.page.evaluate(({ sheet, desc, errors, results }) => ({
    sheets: [...document.querySelectorAll(sheet)].map(w => ({
      name: (w.querySelector('[dir="auto"]') || {}).textContent || '', desc: (w.querySelector(desc) || {}).textContent || '' })),
    errors: document.querySelector(errors).innerText.trim(),
    html: document.querySelector(results).innerHTML,
  }), { sheet: s.sheet, desc: s.desc, errors: s.errors, results: s.results });
}

for (const file of Object.keys(PAGESPEC).filter(f => !ONLY || f === ONLY)) {
  const s = PAGESPEC[file];
  const refBody = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  console.log(`${file}${CONTROL ? ` (control: ${REF} served)` : ''}`);
  const p = await open(file, CONTROL ? refBody : null);
  const names = s.lines.map(l => l.split(',')[0]), numbers = s.lines.map(l => l.split(',')[1].trim());
  const want = await paste(p, file, s.lines.join('\n'));   // the LF paste: the levels' own descriptions
  check(want.sheets.length === 3 && want.sheets.every((w, i) => w.name === names[i]), `LF baseline: 3 sheets under ${names.join(' / ')}`);
  // arm 1 and 2
  const variants = Object.entries(BREAKS).map(([k, b]) => [k, s.lines.join(b)]);
  variants.push(['every break in turn', s.lines[0] + '\u2028' + s.lines[1] + '\u000B' + s.lines[2]]);
  for (const semi of [false, true]) {
    let bad = [];
    for (const [k, text] of variants) {
      const pasted = semi ? s.lines.map(l => l + ';').join(BREAKS[k] || '\u2028') : text;
      const r = await paste(p, file, pasted);
      const ok = r.sheets.length === 3 && r.sheets.every((w, i) => w.name === names[i] && w.desc === want.sheets[i].desc) && r.errors === '';
      if (!ok) bad.push(`${k}: ${r.sheets.length} sheet(s) ${JSON.stringify(r.sheets.map(w => w.name))}${r.errors ? ' errors ' + JSON.stringify(r.errors.slice(0, 80)) : ''}`);
    }
    check(bad.length === 0, `${semi ? 'arm 2, lines ending in ";"' : 'arm 1, no ";"'}: three sheets under their own names and levels, nothing reported, for ${variants.length} pastes${bad.length ? ' — ' + bad.join('; ') : ''}`);
  }
  // arm 3
  const r3 = await paste(p, file, [s.lines[0], s.bad, s.lines[2]].join('\u2028'));
  check(r3.sheets.length === 2 && r3.sheets[0].name === names[0] && r3.sheets[1].name === names[2] && /Entry 2\b/.test(r3.errors) && !/Entry [13]\b/.test(r3.errors),
    `arm 3, a bad middle line joined by U+2028: ${r3.sheets.length} sheets ${JSON.stringify(r3.sheets.map(w => w.name))}, reported ${JSON.stringify(r3.errors.split('\n').filter(Boolean).slice(-1)[0] || '')}`);
  check(p.errs.length === 0, `0 page errors (${p.errs.length})`);
  await p.close();
  // arm 4: identical markup to REF for the pastes that worked before
  if (!CONTROL) {
    for (const [k, text] of [['LF', s.lines.join('\n')], ['";" with CRLF', s.lines.map(l => l + ';').join('\r\n')], ['";" on one line', s.lines.map(l => l + ';').join(' ')]]) {
      const a = await open(file, null), b = await open(file, refBody);
      const ra = await paste(a, file, text), rb = await paste(b, file, text);
      check(ra.html === rb.html && ra.html.length > 1000 && ra.errors === rb.errors, `arm 4, ${k}: the sheets' markup byte-identical to ${REF} (${ra.html.length} chars)`);
      await a.close(); await b.close();
    }
  }
}
await browser.close(); await srv.close();
console.log(`S32-line-breaks: ${fails.length ? fails.length + ' failing' : 'all green'}`);
process.exit(fails.length ? 1 : 0);
