// Probe (loop S24; found S24, pass A on math-minute.html): every generate on all three pages ran 1.3–1.9× as long as
// it needed since S18 / S19 (L9 × 30 × 5 with keys 81 → 127 ms on math-minute; 63 → 96 on index.html), because each
// printed name sat in a <bdi>: Chromium's fast innerHTML parser takes no <bdi>, so every sheet's markup went through
// the full HTML parser (a <bdi dir="ltr"> as slow; a <span dir="auto"> as fast as a bare name). The name now sits in a
// <span dir="auto">, which renders as <bdi> does: S18's Hebrew punctuation at the name's own end, the name at the left.
// Arm 1, per page: every printed name is isolated (`unicode-bidi: isolate`) in its own direction (rtl for a Hebrew
// name, ltr for an English one, also a mixed "Noa (נועה) Levi"), an empty name prints an empty line.
// Arm 2, per page: a generate of 300 sheets (30 students × 5 with keys) costs at most 1.25× the same page with the bare
// name in place of the wrapper (median of 7 click handlers each, alternated; <bdi> read 1.3–1.7× here). A ratio, so a
// slow or busy machine slows both sides alike. Fails before the change (`--ref d31ff06`).
//   node scripts/loop/probes/S24-name-parse.mjs [--ref <commit>] [--only <file>] [--runs 7]
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only'), RUNS = +(arg('--runs') || 7);
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const NAMES = ['שרה כ.', 'Avi Cohen.', '', 'Noa (נועה) Levi', 'דוד 3', 'Bat-Sheva Rivka Goldenberg-Levi'];
const RTL = { 'שרה כ.': 1, 'דוד 3': 1 };
const LEVEL = { 'index.html': 'add2, 30, 3', 'math-minute.html': '9', 'math-facts.html': 'mix+60' };
const NAME_FIELD = { 'index.html': '.mwg-ws-header-main > .mwg-ws-field:first-child > .mwg-ws-field-value',
  'math-minute.html': '.worksheet-header-main > .student-field:first-child > .student-field-value' };
NAME_FIELD['math-facts.html'] = NAME_FIELD['math-minute.html'];
const source = file => REF ? execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' }) : fs.readFileSync(`${ROOT}/${file}`, 'utf8');
// the same page with the bare escaped name: the wrapper's cost is the difference
const bare = (file, html) => {
  const out = html.replace(/function nameHtml\(name\) \{[^\n]*\}/, `function nameHtml(name) { return name ? ${file === 'index.html' ? 'esc' : 'escapeHtml'}(name) : ""; }`);
  if (out === html) throw new Error(`${file}: nameHtml not found`);
  return out;
};

const srv = await serve(); const browser = await launch();
async function open(file, body) {
  const p = await openPage(browser, srv.base, file, { raw: true });
  await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  await p.page.click(p.spec.modeToggle); await p.page.selectOption(p.spec.perStudent, '5'); await p.page.setChecked(p.spec.key, true);
  await p.page.fill(p.spec.advanced, Array.from({ length: 30 }, (_, i) => `${NAMES[i % NAMES.length]}, ${i + 1}, ${LEVEL[file]};`).join('\n'));
  return p;
}
const handler = (pg, sel) => pg.evaluate(sel => { const t0 = performance.now(); document.querySelector(sel).click(); return performance.now() - t0; }, sel);
const med = a => [...a].sort((x, y) => x - y)[a.length >> 1];

for (const file of ['index.html', 'math-minute.html', 'math-facts.html']) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  const html = source(file), plain = bare(file, html);
  // Arm 1: the rendering
  {
    const p = await open(file, html), pg = p.page;
    await pg.click(p.spec.generate); await pg.waitForFunction(() => window.__prints > 0, null, { timeout: 30000 });
    const names = await pg.$$eval(`${p.spec.results} ${NAME_FIELD[file]}`, fs => fs.map(f => {
      const w = f.firstElementChild; const cs = w && getComputedStyle(w);
      return { text: f.textContent, wrapped: !!w && w.textContent === f.textContent, bidi: cs ? cs.unicodeBidi : '', dir: cs ? cs.direction : '', empty: !f.childNodes.length };
    }));
    const named = names.filter(n => n.text);
    check(names.length === 300 && named.length === 250, `300 name lines, 250 with a name (${names.length}, ${named.length})`);
    check(named.every(n => n.wrapped && n.bidi === 'isolate'), `every name isolated in its own element (${named.filter(n => !(n.wrapped && n.bidi === 'isolate')).length} not)`);
    const wrongDir = named.filter(n => n.dir !== (RTL[n.text] ? 'rtl' : 'ltr'));
    check(wrongDir.length === 0, `each name in its own direction: Hebrew rtl, English and "Noa (נועה) Levi" ltr (${wrongDir.length} wrong${wrongDir.length ? ': ' + wrongDir[0].text + ' ' + wrongDir[0].dir : ''})`);
    check(names.filter(n => !n.text).every(n => n.empty), 'an empty name prints an empty line, no wrapper');
    check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
    await p.close();
  }
  // Arm 2: the wrapper's cost against the bare name, alternated
  const t = { page: [], bare: [] };
  for (let r = 0; r < RUNS; r++) for (const [k, body] of [['page', html], ['bare', plain]]) {
    const p = await open(file, body);
    t[k].push(await handler(p.page, p.spec.generate));
    await p.close();
  }
  const ratio = med(t.page) / med(t.bare);
  check(ratio <= 1.25, `300 sheets generate in ${med(t.page).toFixed(0)} ms against ${med(t.bare).toFixed(0)} ms with the bare name: ${ratio.toFixed(2)}× (≤ 1.25×)`);
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS24-name-parse: ${fails.length} failing check(s)` : '\nS24-name-parse: all green');
process.exit(fails.length ? 1 : 0);
