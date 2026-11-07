// Probe (loop S18, pass H on index.html): the Advanced Input help is a format a teacher can follow. The help was
// written for mwg.js's types ("addition", "subtraction", …), but index.html takes level codes (add1–add5 …), so
// the placeholder, both examples and the first four names of its type list were each skipped ("invalid type for
// grade 3: addition"), and the help's bracket names (fractions[add|sub]) failed too: the page took only the
// names Generate Advanced Code writes (fractions[fractions-add]). Approved S18 (gate 2): the help names the codes,
// and the page reads both bracket spellings.
// Arm 1 — the placeholder and every <strong> example in the help, pasted as written, generate with no entry skipped.
// Arm 2 — every type the help's "Problem types" line names (ranges expanded, each bracket with all its listed
//         names and with one) generates at Grade 8 with no entry skipped.
// Arm 3 — a short bracket deals only its operations (fractions[add] → every problem a "+"), the long spelling
//         still reads, a misspelt name is still reported as typed, and the Generate Advanced Code round trip holds.
// Fails on the page before the change (`--ref 1f80a43`).
//   node scripts/loop/probes/S18-advanced-help.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };

const srv = await serve(); const browser = await launch();
const p = await openPage(browser, srv.base, 'index.html', { raw: true });
const pg = p.page;
if (REF) {
  const body = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8' });
  await pg.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector('.mwg-student-entry');
  console.log(`index.html (served from ${REF})`);
}
await pg.click('#mwgToggleModeBtn');
const paste = async text => {
  await pg.fill('#mwgAdvancedBox', text);
  const before = await p.prints();
  await pg.click('#mwgGenerateBtn');
  await pg.waitForFunction(n => window.__prints > n, before, { timeout: 4000 }).catch(() => {});
  return pg.evaluate(() => ({
    sheets: document.querySelectorAll('#mwgResults .mwg-worksheet').length,
    skipped: document.getElementById('mwgErrors').innerText.trim(),
    notice: document.getElementById('mwgStatus').innerText.trim(),
    descs: [...document.querySelectorAll('#mwgResults .mwg-ws-desc-text')].map(e => e.textContent),
    problems: [...document.querySelectorAll('#mwgResults .mwg-worksheet .mwg-horiz-problem')].map(e => e.textContent),
  }));
};
const entries = text => text.split(/[;\n]/).map(s => s.trim()).filter(Boolean).length;

// Arm 1 — the examples as written
const help = await pg.evaluate(() => ({
  placeholder: document.getElementById('mwgAdvancedBox').placeholder,
  strongs: [...document.querySelectorAll('.mwg-advanced-help strong')].map(s => s.textContent),
  text: document.querySelector('.mwg-advanced-help').innerText,
}));
const examples = [help.placeholder, ...help.strongs.filter(s => /,.*,.*,.*,/.test(s) && !/^Name, Number/.test(s))];   // not the Format line
check(examples.length >= 3, `the help offers ${examples.length} pasteable examples (the placeholder and two in the text)`);
for (const ex of examples) {
  const r = await paste(ex);
  check(r.sheets === entries(ex) && !r.skipped, `example "${ex}" → ${r.sheets} sheet(s) of ${entries(ex)}${r.skipped ? ', ' + r.skipped.replace(/\s+/g, ' ') : ''}`);
}

// Arm 2 — every type the help names, at Grade 8
const line = (help.text.match(/Problem types:\s*([^\n]+)/) || [])[1] || '';
const named = [];
for (const raw of line.replace(/\([^)]*\)/g, '').split(/,\s*/).map(s => s.trim()).filter(Boolean)) {
  const range = raw.match(/^([a-z]+)(\d)\s*[–-]\s*\1(\d)$/);
  if (range) { for (let k = +range[2]; k <= +range[3]; k++) named.push(range[1] + k); continue; }
  const br = raw.match(/^(fractions|decimals)\[(.+)\]$/);
  if (br) { named.push(raw); named.push(`${br[1]}[${br[2].split('|')[0]}]`); continue; }
  if (/^mixed\[type1/.test(raw)) { named.push('mixed[add1|mul2]'); continue; }
  named.push(raw);
}
check(named.length >= 30, `the type line names ${named.length} pasteable types`);
const bad = [];
for (const t of named) {
  const r = await paste(`Avi, 1, ${t}, 30, 8;`);
  if (r.sheets !== 1 || r.skipped) bad.push(`${t} (${r.skipped.replace(/\s+/g, ' ').replace('Some entries were skipped: ', '') || r.notice})`);
}
check(bad.length === 0, `every named type generates at Grade 8 (${bad.length ? 'skipped: ' + bad.join('; ') : 'none skipped'})`);

// Arm 3 — the short brackets deal their operations; the long spelling, a misspelling, the round trip
let r = await paste('Avi, 1, fractions[add], 30, 5;');
check(r.problems.length === 30 && r.problems.every(t => t.includes('+') && !/[−×÷]/.test(t)), `fractions[add] deals only additions (${r.problems.length} problems, ${r.problems.filter(t => t.includes('+')).length} with "+")`);
r = await paste('Avi, 1, decimals[mulw], 30, 5;');
check(r.problems.length === 30 && r.problems.every(t => t.includes('×')), `decimals[mulw] deals only multiplications (${r.problems.filter(t => t.includes('×')).length} of ${r.problems.length})`);
r = await paste('Avi, 1, fractions[fractions-add|fractions-sub], 30, 5;');
check(r.sheets === 1 && !r.skipped, `the long spelling fractions[fractions-add|fractions-sub] still reads (${r.sheets} sheet)`);
r = await paste('Avi, 1, fractions[ad], 30, 5;');
check(r.sheets === 0 && /invalid type for grade 5: ad$/m.test(r.skipped), `a misspelt bracket name is reported as typed (${JSON.stringify(r.skipped.split('\n').pop())})`);
r = await paste('Avi, 1, addition, 30, 3;');
check(r.sheets === 0 && /invalid type for grade 3: addition/.test(r.skipped), `a plain word is still reported, not guessed ("addition" → ${JSON.stringify(r.skipped.split('\n').pop())})`);
await pg.click('#mwgToggleModeBtn');   // back to Standard: a Fractions row with two operations ticked
await pg.evaluate(() => {
  const e = document.querySelector('#mwgStudentsContainer .mwg-student-entry'), fire = s => s.dispatchEvent(new Event('change', { bubbles: true }));
  const g = e.querySelector('[name="grade"]'); g.value = '5'; fire(g);
  const t = e.querySelector('[name="problemType"]'); t.value = 'fractions'; fire(t);
  for (const cb of e.querySelectorAll('.mwg-ops-panel input[type="checkbox"]')) cb.checked = /add|divw/.test(cb.value);
});
await pg.click('#mwgGenCodeBtn');
const code = await pg.$eval('#mwgCodeOutput', e => e.value.split('\n')[0]);
await pg.click('#mwgUseCodeBtn');
r = await paste(code);
check(/fractions\[/.test(code) && r.sheets === 1 && !r.skipped, `Generate Advanced Code → Advanced Input round trip ("${code}" → ${r.sheets} sheet)`);

check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
await p.close(); await browser.close(); await srv.close();
console.log(fails.length ? `\nS18-advanced-help: ${fails.length} failing check(s)` : '\nS18-advanced-help: all green');
process.exit(fails.length ? 1 : 0);
