// Probe (loop S39, pass H on index.html; found S11): a Decimals key keeps its problems' places. S11 (approved, gate 6)
// gave the Decimals type the level's places on every number, sheet and key, but only in `makeDecimals`; a Standard
// form's Decimals row comes with every operation ticked and deals the per-operation makers, whose answers went through
// `parseFloat`: 53 of 300 sums, differences and products lost a zero or the point ("29.8 − 23.8 = 6", "2.10 × 8 =
// 16.8"). Per configuration (the Standard form at grades 5-8, every operation ticked; Advanced `decimals[...]` each
// operation alone and all together), with Math.random seeded: every + and − answer shows its numbers' places, every
// × answer the sum of its factors' places, each one right to the last place (integers, no floating point); a quotient
// as before; the worksheets byte-identical to the page before the change and the keys too once each answer is read
// as a number; under print at the paper's width every answer inside its cell; 0 page errors.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S39-decimal-key-places.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = () => { let a = 20261111; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const CASES = [
  { what: 'the Standard form, grades 5-8, every operation ticked', standard: ['5', '6', '7', '8'] },
  { what: 'Advanced, each operation alone', text: ['add', 'sub', 'mulw', 'muld', 'divw', 'divd'].map((o, i) => `Op ${o}, ${i + 1}, decimals[${o}], 30, ${5 + (i % 4)};`).join('\n') },
  { what: 'Advanced, every operation', text: 'All, 1, decimals[add|sub|mulw|muld|divw|divd], 30, 6;\nAll two, 2, decimals, 30, 5;' },
];
// before the change: the commit before the one that brought `answer:(a*b).toFixed(2)` into makeDecMulD, or HEAD while uncommitted
const fixAt = execSync('git log -1 --format=%h -S"answer:(a*b).toFixed(2),kind" -- index.html', { cwd: ROOT, encoding: 'utf8' }).trim();
const BEFORE = fixAt ? `${fixAt}~1` : 'HEAD';

async function run(browser, base, c, ref) {
  const p = await openPage(browser, base, 'index.html', { raw: true });
  const { page } = p;
  await page.addInitScript(SEED);
  // S46's approved dec ÷ dec dividend, one place ("15.6 ÷ 7.8"), is replayed into an older page (S42's rule): it prints
  // a number and draws nothing, so the identity arms still compare the change S39 made
  if (ref) { const body = execSync(`git show ${ref}:index.html`, { cwd: ROOT, encoding: 'utf8' })
      .replace('horizHtml(a.toFixed(2)+" ÷ "+b.toFixed(1)+" =")', 'horizHtml(a.toFixed(1)+" ÷ "+b.toFixed(1)+" =")');
    await page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body })); }
  await page.reload({ waitUntil: 'load' }); await page.waitForSelector('#mwgStudentsContainer .mwg-student-entry');
  if (c.standard) {
    while ((await page.$$('#mwgStudentsContainer .mwg-student-entry')).length < c.standard.length) await page.click('#mwgAddStudentBtn');
    const rows = await page.$$('#mwgStudentsContainer .mwg-student-entry');
    for (let i = 0; i < c.standard.length; i++) {
      await (await rows[i].$('[name="studentName"]')).fill('Grade ' + c.standard[i]);
      await (await rows[i].$('[name="grade"]')).selectOption(c.standard[i]);
      await (await rows[i].$('[name="problemType"]')).selectOption('decimals');
    }
  } else { await page.click('#mwgToggleModeBtn'); await page.fill('#mwgAdvancedBox', c.text); }
  await page.selectOption('#mwgWorksheetsPerStudent', '3');
  await page.check('#mwgAnswerKeyToggle');
  await page.click('#mwgGenerateBtn'); await page.waitForFunction(() => window.__prints > 0);
  const out = await page.evaluate(() => {
    const sheets = [...document.querySelectorAll('#mwgResults > .mwg-worksheet:not(.mwg-answer-key-sheet)')].map(s => s.outerHTML);
    const keys = [...document.querySelectorAll('#mwgResults > .mwg-answer-key-sheet')];
    const cells = [];
    for (const k of keys) for (const c of k.querySelectorAll('.mwg-horiz-cell')) {
      const expr = c.querySelector('.mwg-horiz-problem').textContent.replace(/\s+/g, ' ').trim();
      cells.push({ expr, ans: c.lastElementChild.textContent.trim() });
    }
    return { sheets, keys: keys.map(k => k.outerHTML), cells, ops: document.querySelectorAll('#mwgStudentsContainer .mwg-dec-op-cb:checked').length };
  });
  // under print at the paper's width: each answer inside its cell
  await page.setViewportSize({ width: 1056, height: 816 });
  await page.emulateMedia({ media: 'print' });
  out.outside = await page.evaluate(() => {
    const r = document.getElementById('mwgResults'); r.id = 'mwg-results-print'; document.body.appendChild(r);
    let n = 0, cells = 0;
    for (const c of document.querySelectorAll('.mwg-answer-key-sheet .mwg-horiz-cell')) { cells++;
      const a = c.lastElementChild.getBoundingClientRect(), b = c.getBoundingClientRect();
      if (a.right > b.right + 0.5 || a.left < b.left - 0.5 || a.width === 0) n++; }
    return { n, cells };
  });
  out.errors = p.errors.slice(); await p.close(); return out;
}

// exact decimal arithmetic on the printed strings
const places = s => (s.split('.')[1] || '').length;
const scaled = (s, pl) => BigInt(s.replace('.', '') + '0'.repeat(pl - places(s)));
function audit(cells) {
  const r = { n: 0, short: [], wrong: [], div: 0 };
  for (const { expr, ans } of cells) {
    const m = expr.match(/^([\d.]+) ([+−×÷]) ([\d.]+) =$/); if (!m) { r.wrong.push(expr + ' ' + ans); continue; }
    const [, a, op, b] = m; r.n++;
    if (op === '÷') { r.div++; const pl = Math.max(places(a), places(b), places(ans)) + 2;
      if (scaled(ans, pl) * scaled(b, pl) !== scaled(a, pl) * 10n ** BigInt(pl)) r.wrong.push(`${expr} ${ans}`); continue; }
    const want = op === '×' ? places(a) + places(b) : Math.max(places(a), places(b));
    if (places(ans) !== want) r.short.push(`${expr} ${ans}`);
    const pl = Math.max(want, places(ans));
    const val = op === '+' ? scaled(a, pl) + scaled(b, pl) : op === '−' ? scaled(a, pl) - scaled(b, pl)
      : scaled(a, places(a)) * scaled(b, places(b)) * 10n ** BigInt(pl - places(a) - places(b));
    if (val !== scaled(ans, pl)) r.wrong.push(`${expr} ${ans}`);
  }
  return r;
}
const asNumbers = html => html.replace(/(>)([\d.]+)(<\/span><\/div>)/g, (m, x, n, y) => x + String(parseFloat(n)) + y);

const srv = await serve(); const browser = await launch();
try {
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}; before the change: ${BEFORE}`);
  for (const c of CASES) {
    const now = await run(browser, srv.base, c, REF);
    const r = audit(now.cells);
    check(now.cells.length >= 180 && (!c.standard || now.ops === 6 * c.standard.length), `${c.what}: ${now.cells.length} key answers read (${r.div} quotients)${c.standard ? `, ${now.ops} operation boxes ticked` : ''}`);
    check(r.short.length === 0, `${c.what}: every sum, difference and product shows its problem's places (${r.short.length} short: ${r.short.slice(0, 3).join(' | ')})`);
    check(r.wrong.length === 0, `${c.what}: every answer right to its last place (${r.wrong.length} wrong: ${r.wrong.slice(0, 3).join(' | ')})`);
    check(now.outside.cells === now.cells.length && now.outside.n === 0, `${c.what}: under print at 11 in, every answer inside its cell (${now.outside.n} of ${now.outside.cells} outside)`);
    check(now.errors.length === 0, `${c.what}: 0 page errors (${now.errors.join('; ')})`);
    if (!REF) {
      const old = await run(browser, srv.base, c, BEFORE);
      const same = old.sheets.length === now.sheets.length && old.sheets.every((s, i) => s === now.sheets[i]);
      check(same, `${c.what}: the ${now.sheets.length} worksheets byte-identical to ${BEFORE}'s`);
      const keysSame = old.keys.length === now.keys.length && old.keys.every((k, i) => asNumbers(k) === asNumbers(now.keys[i]));
      const changed = now.cells.filter((x, i) => x.ans !== old.cells[i].ans).length;
      check(keysSame && changed === audit(old.cells).short.length, `${c.what}: the keys identical but for ${changed} answers written with their places (as numbers the same)`);
    }
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS39-decimal-key-places: ${fails.length} failing check(s)` : '\nS39-decimal-key-places: all green');
process.exit(fails.length ? 1 : 0);
