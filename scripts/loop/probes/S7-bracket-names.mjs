// Probe (loop S7, P2 from pass G in S6, index.html): Advanced Input checks the names inside brackets.
// `fractions[fractions-ad]` printed a "Fractions" sheet of whole-number sums, `mixed[foo]` Addition Level 1
// labelled Mixed, `mixed[scientificnotation]` ran at grade 1, and nothing was reported. Now:
//   - an entry naming an unknown operation, or a type its grade does not have, is skipped and listed with the
//     name ("invalid type for grade G: <name>", the message an unknown plain type already gets);
//   - every valid bracket (a subset of operations, Mixed with fraction / decimal operations, a bare
//     "fractions" in Mixed) prints exactly what it printed before (seeded, byte-identical to the old page);
//   - a stray "|" (an empty name, `mixed[add1|]`) is ignored, not reported.
// `--control` serves index.html from `--ref` (default cfa5cd6, before the fix) and must fail.
//   node scripts/loop/probes/S7-bracket-names.mjs [--control] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const control = process.argv.includes('--control'), REF = arg('--ref') || 'cfa5cd6';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const OLD = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8' });
const SEED = `(() => { let s = 20261105; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;

const BAD = [
  ['Bad1', 'fractions[fractions-ad]', 6, 'fractions-ad'],
  ['Bad2', 'mixed[foo]', 2, 'foo'],
  ['Bad3', 'mixed[scientificnotation]', 1, 'scientificnotation'],
  ['Bad4', 'decimals[decimals-mul]', 6, 'decimals-mul'],
  ['Bad5', 'mixed[fractions-add]', 4, 'fractions-add'],             // grade 4 has no fractions
  ['Bad6', 'mixed[add1|bogus]', 2, 'bogus'],
];
const GOOD = [
  ['Good1', 'fractions[fractions-add|fractions-sub]', 6],
  ['Good2', 'decimals[decimals-mulw]', 6],
  ['Good3', 'mixed[add1|sub1]', 2],
  ['Good4', 'mixed[fractions-add|decimals-divd|rounding]', 6],
  ['Good5', 'mixed[fractions]', 5],
  ['Good6', 'mixed[decimals-add|mul2]', 7],
  ['Good7', 'add2', 3],
];
const line = ([name, type, grade], i) => `${name}, ${i + 1}, ${type}, 30, ${grade};`;

async function open(browser, base, body) {
  const p = await openPage(browser, base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (body) await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' });
  await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
  await p.page.click(p.spec.modeToggle);
  await p.page.setChecked(p.spec.key, true);
  return p;
}
async function run(p, roster) {
  await p.page.fill(p.spec.advanced, roster);
  const n = await p.prints();
  await p.page.click(p.spec.generate);
  await p.page.waitForFunction(n => window.__prints > n, n, { timeout: 20000 }).catch(() => {});
  return p.page.evaluate(() => ({
    html: document.querySelector('#mwgResults').innerHTML,
    names: [...document.querySelectorAll('#mwgResults .mwg-worksheet .mwg-ws-field-value')].map(e => e.textContent.trim()).filter(t => /^(Good|Bad)\d/.test(t)),
    errors: document.querySelector('#mwgErrors').innerText.trim(),
  }));
}

const srv = await serve(); const browser = await launch();
try {
  // 1. The valid brackets print what they printed before (seeded, valid entries only).
  const ref = await open(browser, srv.base, OLD);
  const before = await run(ref, GOOD.map(line).join('\n'));
  await ref.close();
  const p = await open(browser, srv.base, control ? OLD : null);
  const after = await run(p, GOOD.map(line).join('\n'));
  check(before.names.length === GOOD.length, `the old page prints the ${GOOD.length} valid entries (${before.names.length})`);
  check(after.html === before.html && after.errors === '', `every valid bracket prints byte-identically to the old page, nothing reported (${after.html === before.html ? 'identical' : 'differs'}; "${after.errors}")`);

  // 2. The unknown names are skipped and named; the valid entries around them still print.
  const mixedRoster = [...GOOD.slice(0, 3), ...BAD, ...GOOD.slice(3)].map(line).join('\n');
  const m = await run(p, mixedRoster);
  const printedBad = m.names.filter(n => n.startsWith('Bad'));
  check(printedBad.length === 0, `no sheet for an entry with an unknown bracket name (${printedBad.length ? [...new Set(printedBad)].join(', ') : 'none'} printed)`);
  check(GOOD.every(([n]) => m.names.includes(n)), `every valid entry around them still prints (${GOOD.filter(([n]) => m.names.includes(n)).length} of ${GOOD.length})`);
  const listed = BAD.filter(([, , g, bad]) => m.errors.includes(`invalid type for grade ${g}: ${bad}`));
  check(listed.length === BAD.length, `each is listed with its name and grade (${listed.length} of ${BAD.length}: ${BAD.filter(b => !listed.includes(b)).map(b => b[3]).join(', ') || 'all'})`);

  // 3. A stray "|" is ignored: mixed[add1|] prints Addition Level 1 and reports nothing.
  const s = await run(p, 'Good8, 1, mixed[add1|], 30, 2;');
  const sheet = await p.page.evaluate(() => [...document.querySelectorAll('#mwgResults .mwg-worksheet:not(.mwg-answer-key-sheet) .mwg-problem-stack')].map(st => st.innerText.replace(/\s+/g, ' ').trim()));
  check(s.errors === '' && s.names.includes('Good8') && sheet.length === 30 && sheet.every(t => /^\d \+ \d$/.test(t)),
    `mixed[add1|] prints 30 one-digit additions and reports nothing (${sheet.length}; "${s.errors}"; e.g. ${sheet.slice(0, 3).join(' / ')})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
  await p.close();
} catch (e) { check(false, e.message.split('\n')[0]); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS7-bracket-names: ${fails.length} failing` : '\nS7-bracket-names: all green');
process.exit(fails.length ? 1 : 0);
