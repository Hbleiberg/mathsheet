// Probe (loop S7, P2 from pass C in S5, all three pages): the "Some entries were skipped" box is seen.
// It sat below every generated sheet (y 9,735 px after 20 sheets) while the page scrolled to the sheets'
// top, so a student missing from the class set went unexplained. For each page, 20 good entries and one bad
// one in Advanced Input, Generate & Print (print stubbed), then once the smooth scroll settles:
//   - the box is in the viewport (desktop 1280×900 and a 390×844 phone) and above the first sheet;
//   - with nothing skipped the page still lands on the first sheet, as before;
//   - after the print flow's move to the body and back, the box still stands before the results.
// `--control` serves each page as it was at HEAD~ (`--ref <commit>`, default the commit before the fix) and must fail.
//   node scripts/loop/probes/S7-skipped-list.mjs [--control] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, PAGES, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const control = process.argv.includes('--control'), REF = arg('--ref') || 'b89b37d';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const BAD = { 'index.html': 'Bad, 99, nosuchtype, 30, 2;', 'math-minute.html': 'Bad, 99, 77;', 'math-facts.html': 'Bad, 99, +77;' };
const GOOD = { 'index.html': i => `S${i}, ${i}, add1, 30, 2;`, 'math-minute.html': i => `S${i}, ${i}, 1;`, 'math-facts.html': i => `S${i}, ${i}, +2;` };
const ERR = { 'index.html': '#mwgErrors', 'math-minute.html': '#errors', 'math-facts.html': '#errors' };

async function settle(page) {        // wait for the smooth scroll to stop
  let last = -1;
  for (let i = 0; i < 40; i++) { const y = await page.evaluate(() => scrollY); if (y === last) return y; last = y; await page.waitForTimeout(150); }
  return last;
}
async function run(p, roster, save) {
  await p.page.fill(p.spec.advanced, roster);
  // a saved roster: since S18 an unsaved one shows its reminder after Generate and the page lands on it, above the sheets
  if (save) await p.page.click(p.spec.save);
  const n = await p.prints();
  await p.page.click(p.spec.generate);
  await p.page.waitForFunction(n => window.__prints > n, n, { timeout: 20000 });
  await settle(p.page);
  return p.page.evaluate(({ err, sheet, results }) => {
    const box = document.querySelector(err), first = document.querySelector(`${results} ${sheet}`), r = document.querySelector(results);
    const b = box.getBoundingClientRect(), f = first.getBoundingClientRect();
    return { text: box.innerText.trim().slice(0, 40), top: b.top, bottom: b.bottom, h: b.height, vh: innerHeight, firstTop: f.top,
      before: !!(box.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING), parentSame: box.parentNode === r.parentNode };
  }, { err: ERR[p.file], sheet: p.spec.sheet, results: p.spec.results });
}

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(PAGES)) {
    for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      console.log(`${file} @ ${vp.width}`);
      const p = await openPage(browser, srv.base, file, { raw: true, viewport: vp });
      if (control) {
        const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
        await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
        await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
      }
      await p.page.click(p.spec.modeToggle);
      const good = Array.from({ length: 20 }, (_, i) => GOOD[file](i));
      const m = await run(p, [...good.slice(0, 10), BAD[file], ...good.slice(10)].join('\n'));
      check(/skipped/i.test(m.text), `the box says entries were skipped ("${m.text.replace(/\s+/g, ' ')}")`);
      check(m.top >= -1 && m.top < m.vh && m.bottom > 0, `the box is in view after Generate (top ${m.top.toFixed(0)}, viewport ${m.vh})`);
      check(m.bottom <= m.firstTop + 0.5, `the box stands above the first sheet (box bottom ${m.bottom.toFixed(0)}, first sheet ${m.firstTop.toFixed(0)})`);
      check(m.before && m.parentSame, 'after the print flow the box still stands before the results, beside them');
      const c = await run(p, good.join('\n'), true);
      check(Math.abs(c.firstTop) <= 2 && c.h === 0, `nothing skipped: the page lands on the first sheet (top ${c.firstTop.toFixed(0)}), the box empty (${c.h} px)`);
      check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
      await p.close();
    }
  }
} catch (e) { check(false, e.message.split('\n')[0]); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS7-skipped-list: ${fails.length} failing` : '\nS7-skipped-list: all green');
process.exit(fails.length ? 1 : 0);
