// Probe (loop S8, index.html; approved S5, gate 6 "match the sheet"): an answer key's division problem is the
// worksheet's own problem with the quotient in red over the bar, as on the twins since S5 (probes/S5-key-division).
// The key drew its own bar under the answer: the bracket's stroke ran up through the answer and the divisor sat
// beside it. For every division level at 30 and 60 problems, and stacked Mixed sets holding divisions (grades 3-4,
// and a grade-5 subset with remainders), under emulated print with the page's move trick, each key cell against the
// same cell of its sheet:
//   - the bracket and the divisor sit in the cell where the sheet puts them (within 0.5 px);
//   - the quotient is right ("21 r3" with a remainder), sits above the bar, its digits end over the dividend's last
//     digit (a remainder after them), and it stays inside its own cell, clear of the problem above it;
//   - Mixed keys of 0.6-0.72in rows (rows-10 / rows-12) and written-across Mixed keys (grades 5-8) have no room
//     above the bar (the quotient overprinted the problem above by 3-11 px): they keep the old drawing,
//     byte-identical to `--ref`;
//   - seeded, the worksheets are byte-identical to `--ref` (default HEAD): only the keys change.
// `--control` serves index.html from `--ref` and must fail.
//   node scripts/loop/probes/S8-index-key-division.mjs [--control] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const control = process.argv.includes('--control'), REF = arg('--ref') || 'HEAD';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const OLD = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8' });
const SEED = `(() => { let s = 4242; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const SETS = [
  ...['div1', 'div2', 'div3', 'div4', 'div5'].flatMap(t => [[t, 30, 5], [t, 60, 5]]),
  ['div1', 40, 3], ['div3', 50, 4],
  ['mixed', 30, 3], ['mixed', 60, 3], ['mixed', 40, 4], ['mixed', 50, 4], ['mixed', 40, 2], ['mixed', 30, 4],
  ['mixed[div4|div5|add3]', 30, 5], ['mixed[div4|div5|add3]', 60, 5], ['mixed', 30, 6], ['mixed', 30, 7],
];
const ROSTER = SETS.map(([t, n, g], i) => `K${i}, ${i}, ${t}, ${n}, ${g};`).join('\n');

async function open(browser, base, body) {
  const p = await openPage(browser, base, 'index.html', { raw: true });
  await p.context.addInitScript(SEED);
  if (body) await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' });
  await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
  await p.page.click(p.spec.modeToggle);
  await p.page.setChecked(p.spec.key, true);
  await p.page.fill(p.spec.advanced, ROSTER);
  const n = await p.prints();
  await p.page.click(p.spec.generate);
  await p.page.waitForFunction(n => window.__prints > n, n, { timeout: 30000 });
  return p;
}
const sheetsHtml = p => p.page.$$eval('#mwgResults .mwg-worksheet', ss => ss.map(s => s.outerHTML));
const shortKeys = p => p.page.$$eval('#mwgResults .mwg-answer-key-sheet', ks => ks.map(k => { const g = k.querySelector('.mwg-problems-grid');
  return !g || /mwg-rows-1[02]/.test(g.className) ? k.outerHTML : null; }));

const srv = await serve(); const browser = await launch();
try {
  const ref = await open(browser, srv.base, OLD);
  const before = await sheetsHtml(ref), shortBefore = await shortKeys(ref);
  await ref.close();
  const p = await open(browser, srv.base, control ? OLD : null);
  const after = await sheetsHtml(p), shortAfter = await shortKeys(p);
  const shortN = shortAfter.filter(Boolean).length;
  check(shortN > 0 && shortAfter.every((h, i) => h === shortBefore[i]), `the ${shortN} Mixed keys of 10 / 12 rows or written across keep the old drawing, byte-identical to ${REF} (${shortAfter.filter((h, i) => h !== shortBefore[i]).length} differ)`);
  check(before.length === SETS.length && after.length === before.length && after.every((h, i) => h === before[i]),
    `seeded, the ${after.length} worksheets are byte-identical to ${REF} (${after.filter((h, i) => h !== before[i]).length} differ)`);
  await p.page.emulateMedia({ media: 'print' });
  const r = await p.page.evaluate(() => {
    const res = document.querySelector('#mwgResults'); res.id = 'mwg-results-print'; document.body.appendChild(res);
    const sheets = [...document.querySelectorAll('.mwg-worksheet')], keys = [...document.querySelectorAll('.mwg-answer-key-sheet')];
    const rel = (el, o) => { const b = el.getBoundingClientRect(), c = o.getBoundingClientRect();
      return { l: b.left - c.left, t: b.top - c.top, r: b.right - c.left, b: b.bottom - c.top, w: b.width, h: b.height }; };
    const out = { by: {}, pairs: Math.min(sheets.length, keys.length), cells: 0, rem: 0, moved: 0, worst: 0, wrong: [], below: 0, offRight: 0, outside: 0, crowded: 0, minGap: Infinity };
    for (let i = 0; i < out.pairs; i++) {
      const sc = sheets[i].querySelectorAll('.mwg-problem-cell'), kc = keys[i].querySelectorAll('.mwg-problem-cell');
      const kg = keys[i].querySelector('.mwg-problems-grid'); if (!kg || /mwg-rows-1[02]/.test(kg.className)) continue;
      const cols = getComputedStyle(kg).gridTemplateColumns.split(' ').length;
      const tag = (out.by[i] = { grid: keys[i].querySelector('.mwg-problems-grid').className.replace('mwg-problems-grid ', ''), out: 0, crowded: 0, side: 0, top: 0 });
      sc.forEach((cell, j) => {
        const sDiv = cell.querySelector('.mwg-division-problem'); if (!sDiv) return;
        out.cells++;
        const kCell = kc[j], kDiv = kCell && kCell.querySelector('.mwg-division-problem');
        const kBr = kDiv && kDiv.querySelector('.mwg-division-bracket'), kDd = kDiv && kDiv.querySelector('.mwg-division-dividend');
        const q = kDd && kDd.querySelector('span');
        if (!kBr || !q) { out.moved++; return; }
        for (const sel of ['.mwg-division-bracket', '.mwg-division-divisor']) {
          const a = rel(cell.querySelector(sel), cell), b = rel(kDiv.querySelector(sel), kCell);
          const d = Math.max(Math.abs(a.l - b.l), Math.abs(a.t - b.t), Math.abs(a.w - b.w), Math.abs(a.h - b.h));
          out.worst = Math.max(out.worst, d); if (d > 0.5) out.moved++;
        }
        const divisor = +cell.querySelector('.mwg-division-divisor').textContent, dividend = +cell.querySelector('.mwg-division-dividend').textContent;
        const qq = Math.floor(dividend / divisor), rr = dividend % divisor, want = rr ? `${qq} r${rr}` : `${qq}`;
        const got = q.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
        if (got !== want) out.wrong.push(`${dividend}÷${divisor}: "${got}"`);
        if (rr) out.rem++;
        const qr = rel(q, keys[i]), br = rel(kBr, keys[i]), dd = rel(kDd, keys[i]), cr = rel(kCell, keys[i]);
        let ink = { ...qr }; for (const s of q.querySelectorAll('span')) { const x = rel(s, keys[i]); ink.l = Math.min(ink.l, x.l); ink.r = Math.max(ink.r, x.r); ink.t = Math.min(ink.t, x.t); }
        if (qr.b > br.t - 1) out.below++;                       // the bar is the bracket's top border
        if (Math.abs(qr.r - dd.r) > 0.5) out.offRight++;
        if (ink.t < cr.t - 0.5 || ink.l < cr.l - 0.5 || ink.r > cr.r + 0.5) { out.outside++; tag.out++; if (ink.t < cr.t - 0.5) tag.top++; else tag.side++; }
        const above = kc[j - cols];
        if (above) { let b = -Infinity; for (const e of above.querySelectorAll('*')) { const x = rel(e, keys[i]); if (x.w || x.h) b = Math.max(b, x.b); }
          const gap = ink.t - b; out.minGap = Math.min(out.minGap, gap); if (gap < 2) { out.crowded++; tag.crowded++; } }
      });
    }
    return out;
  });
  check(r.pairs === SETS.length && r.cells > 500 && r.rem > 0 && Object.keys(r.by).length === SETS.length - shortN, `${r.pairs} sheet / key pairs, ${Object.keys(r.by).length} keys with room above the bar (${[...new Set(Object.values(r.by).map(t => t.grid.replace(/mwg-/g, '')))].join(', ')}), ${r.cells} division cells compared (${r.rem} with a remainder)`);
  check(r.moved === 0, `key bracket and divisor where the sheet puts them (${r.moved} off, worst ${r.worst.toFixed(2)} px)`);
  check(r.wrong.length === 0, `every quotient right (${r.wrong.slice(0, 3).join(', ') || 'none wrong'})`);
  check(r.below === 0 && r.offRight === 0, `quotient over the bar, its digits ending over the dividend (${r.below} not above, ${r.offRight} off its right edge)`);
  const bad = Object.entries(r.by).filter(([, t]) => t.out || t.crowded).map(([i, t]) => `${SETS[i].join('/')} ${t.grid}: ${t.top} over the top, ${t.side} past a side, ${t.crowded} crowded`);
  if (bad.length) console.log('       ' + bad.join('\n       '));
  check(r.outside === 0, `quotient inside its own cell (${r.outside} outside)`);
  check(r.crowded === 0, `quotient clear of the problem above it, ≥ 2 px (${r.crowded} closer; least ${r.minGap.toFixed(1)} px)`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
  await p.close();
} catch (e) { check(false, e.message.split('\n')[0]); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS8-index-key-division: ${fails.length} failing` : '\nS8-index-key-division: all green');
process.exit(fails.length ? 1 : 0);
