// Probe (loop S31; found S11, pass E on index.html; approved S11 at gate 2, "print 30 and say so"): an Advanced entry
// asking more than 30 of a type written across ("rounding, 60", a Mixed whose pool holds one) printed 30 under an honest
// header with no word why (the form offers such a type only 30). It now prints and says so, in the skipped-entries box:
// "Entry 14: rounding prints at most 30 problems (60 asked)". Math.random seeded; through the Advanced box:
//   arm 1, every across type at 40 / 50 / 60, Mixed with and without one, a stacked type at 60, a 30, a bad entry: a note
//     for an entry exactly when its sheet prints fewer problems than asked, worded as approved, numbered as the skipped
//     entries are; every sheet's count as before (30 for a capped entry, its header too);
//   arm 2, the box: skipped entries and notes (the heading, the list, a blank line, the notes), notes alone (no heading),
//     skipped alone byte-identical to REF's box; the page lands on the box; a Standard generate shows none;
//   arm 3, the sheets' markup byte-identical to REF's, the same seed.
// Fails before the change (`--control`: REF served as the page under test).
//   node scripts/loop/probes/S31-cap-note.mjs [--control] [--ref <commit>]
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { serve, launch, openPage, ROOT, PAGES } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref') || '04c9483', CONTROL = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = `(() => { let s = 20261109; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
// Later sheet changes replayed on REF, so its byte-for-byte arm measures this probe's own change only (S23's rule):
// S35's minus sign on Integers, index's `signed()` and `makeIntegers` as the working tree has them.
const replayLater = body => {
  const now = readFileSync(`${ROOT}/index.html`, 'utf8').match(/\/\/ A negative number takes[\s\S]*?\nfunction makeIntegers[\s\S]*?\n\}\n/);
  const old = /function makeIntegers\(grade\) \{[\s\S]*?\n\}\n/;
  return !now || /function signed\(/.test(body) || !old.test(body) ? body : body.replace(old, () => now[0]);
};
const refBody = replayLater(execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }));

const ACROSS = [['fractions', 5], ['fractions[add|sub]', 6], ['decimals', 6], ['decimals[add]', 6], ['rounding', 3], ['longdivision', 6],
  ['orderofoperations', 6], ['integers', 7], ['exponents', 8], ['scientificnotation', 8]];
const ENTRIES = [
  ...ACROSS.flatMap(([t, g], i) => [40, 50, 60].map(c => [t, c, g])).filter((e, i) => i % 2 === 0 || e[1] === 60),
  ['mixed', 60, 5], ['mixed', 50, 8], ['mixed[add1|rounding]', 50, 4], ['mixed[add1|sub2]', 60, 5], ['mixed', 60, 4], ['mixed', 60, 2],
  ['add1', 60, 2], ['rounding', 30, 4], ['zz', 40, 3], ['div3', 60, 4],
];
const LINES = ENTRIES.map(([t, c, g], i) => `S${i + 1}, ${i + 1}, ${t}, ${c}, ${g};`);

const srv = await serve(); const browser = await launch();
async function open(served) {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (served) await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: served }));
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  return p;
}
async function advanced(p, lines) {
  const pg = p.page;
  if (await pg.isVisible('#mwgStandardSection')) await pg.click('#mwgToggleModeBtn');
  await pg.setChecked('#mwgAnswerKeyToggle', false); await pg.fill('#mwgAdvancedBox', lines.join('\n'));
  const n = await p.prints(); await pg.click('#mwgGenerateBtn'); await pg.waitForFunction(n => window.__prints > n, n, { timeout: 60000 });
  await pg.waitForTimeout(1200);   // the smooth scroll to the box
  return pg.evaluate(() => {
    const box = document.querySelector('#mwgErrors .mwg-error-box'), b = box && box.getBoundingClientRect();
    return { box: box ? box.textContent : null, boxHtml: document.querySelector('#mwgErrors').innerHTML, boxTop: b ? Math.round(b.top) : null,
      sheets: [...document.querySelectorAll('#mwgResults .mwg-worksheet')].map(s => ({ n: s.querySelectorAll('.mwg-problems-grid > *, .mwg-horiz-grid > *').length,
        desc: s.querySelector('.mwg-ws-desc-text').textContent, num: s.querySelectorAll('.mwg-ws-field-value')[1].textContent })),
      results: document.querySelector('#mwgResults').innerHTML };
  });
}

const now = await open(CONTROL ? refBody : null), was = await open(refBody);
console.log(`index.html${CONTROL ? ` (control: ${REF} served)` : ''}: ${ENTRIES.length} entries`);
// Arm 1
{
  const a = await advanced(now, LINES);
  const notes = (a.box || '').split('\n').filter(l => /prints at most 30/.test(l));
  // entry k (1-based, as a teacher counts the lines) -> its sheet, by the Number field (the entry's own number)
  let right = 0, wrongCount = 0; const bad = [];
  ENTRIES.forEach(([t, c, g], i) => {
    const sheet = a.sheets.find(s => s.num === String(i + 1));
    if (t === 'zz') { if (sheet) bad.push(`entry ${i + 1} printed`); return; }
    if (!sheet) { bad.push(`entry ${i + 1} has no sheet`); return; }
    const capped = sheet.n < c, want = `Entry ${i + 1}: ${t} prints at most 30 problems (${c} asked)`, has = notes.includes(want);
    if (capped && (sheet.n !== 30 || !sheet.desc.startsWith('30 '))) wrongCount++;
    if (capped === has) right++; else bad.push(`entry ${i + 1} ${t} ${c}@${g}: printed ${sheet.n}, note ${has ? 'shown' : 'missing'}`);
  });
  const capped = a.sheets.filter((s, i) => s.n === 30).length;
  check(a.sheets.length === ENTRIES.length - 1, `every good entry printed, the bad one skipped (${a.sheets.length} sheets)`);
  check(!bad.length && right === ENTRIES.length - 1, `a note exactly for the entries that print fewer than asked (${notes.length} notes; ${bad.slice(0, 3).join('; ') || 'none wrong'})`);
  check(notes.length >= 20, `the note worded as approved, e.g. "${notes[0] || '—'}"`);
  check(!wrongCount, `every capped sheet prints 30 and its header says 30 (${wrongCount} not)`);
  // Arm 3: the sheets as before
  const b = await advanced(was, LINES);
  check(a.results === b.results, `the sheets' markup byte-identical to ${REF}'s (${a.sheets.length} sheets)`);
}
// Arm 2: the box
{
  const both = await advanced(now, ['A, 1, rounding, 60, 4;', 'B, 2, zz, 30, 2;', 'C, 3, add1, 40, 2;', 'D, 4, integers, 50, 7;']);
  check(both.box === 'Some entries were skipped:\n\nEntry 2 invalid type for grade 2: zz\n\nEntry 1: rounding prints at most 30 problems (60 asked)\nEntry 4: integers prints at most 30 problems (50 asked)',
    `skipped entries, then the notes after a blank line: ${JSON.stringify(both.box)}`);
  const alone = await advanced(now, ['A, 1, scientificnotation, 40, 8;', 'B, 2, add2, 30, 2;']);
  check(alone.box === 'Entry 1: scientificnotation prints at most 30 problems (40 asked)', `a note alone, no heading: ${JSON.stringify(alone.box)}`);
  check(alone.boxTop !== null && alone.boxTop >= -1 && alone.boxTop < 120, `the page lands on the box (its top at ${alone.boxTop} px)`);
  const skipNow = await advanced(now, ['A, 1, zz, 30, 2;', 'B, 2, add2, 30, 2;']), skipWas = await advanced(was, ['A, 1, zz, 30, 2;', 'B, 2, add2, 30, 2;']);
  check(skipNow.boxHtml === skipWas.boxHtml && /^<div class="mwg-error-box">Some entries were skipped:/.test(skipNow.boxHtml), `skipped alone, the box byte-identical to ${REF}'s`);
  const none = await advanced(now, ['A, 1, rounding, 30, 4;', 'B, 2, add1, 60, 2;']);
  check(none.box === null, 'nothing capped, nothing skipped: no box');
  // a Standard generate (the form offers 30 only): no box
  await now.page.click('#mwgToggleModeBtn'); await PAGES['index.html'].prepare(now.page);
  const n0 = await now.prints(); await now.page.click('#mwgGenerateBtn'); await now.page.waitForFunction(n => window.__prints > n, n0);
  check(await now.page.$('#mwgErrors .mwg-error-box') === null, 'a Standard generate shows no box');
  check(!now.errors.length && !was.errors.length, `0 page errors (${now.errors.concat(was.errors).join(' | ')})`);
}
await now.close(); await was.close(); await browser.close(); await srv.close();
console.log(fails.length ? `\nS31-cap-note: ${fails.length} failing` : '\nS31-cap-note: all green');
process.exit(fails.length ? 1 : 0);
