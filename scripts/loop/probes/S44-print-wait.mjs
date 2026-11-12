// Probe (loop S44; found S1, measured again S44 in pass A on math-minute.html): Generate & Print no longer waits a
// fixed 200 ms before `window.print()`. The wait settled nothing (frames tick through it; the print layout is made at the
// call) and was 71-94 % of the time from the click to the print dialog. Now the page waits for one frame (a rAF, then a
// 0 ms timeout), so the sheets are painted behind the dialog. Per page, a class of three, 1 copy, then 5 with keys:
// the print call comes within 60 ms of the click's handler ending (200+ before), after at least one frame; at the call
// the results stand under the print id as the body's last child with every sheet; after it they are back in their
// place under their own id; one print a click; and the click → print time, against the base commit alternately
// (`--base`, default 1044687; three runs each, medians), is at most 0.5 of its time (reported as a ratio).
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S44-print-wait.mjs [--ref <commit>] [--base <commit>] [--runs 3]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), BASE = arg('--base') || '1044687', RUNS = +(arg('--runs') || 3);
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

async function run(browser, base, file, ref, per, key) {
  const p = await openPage(browser, base, file);
  const { page, spec } = p;
  if (ref) {
    const body = execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await page.reload({ waitUntil: 'load' }); await page.waitForSelector(`${spec.students} ${spec.entry}`);
    await spec.prepare(page);
  }
  await page.selectOption(spec.perStudent, per);
  if (key) await page.check(spec.key);
  return page.evaluate(async ([gen, resSel, printId]) => {
    const res = document.querySelector(resSel), home = res.parentNode, next = res.nextElementSibling, homeId = res.id;
    const calls = []; let frames = 0, counting = false;
    const tick = () => { if (counting) frames++; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    window.print = function () {
      const r = document.getElementById(printId);
      calls.push({ at: performance.now(), frames, last: !!r && r === document.body.lastElementChild,
        sheets: r ? r.querySelectorAll('.worksheet, .mwg-worksheet, .mwg-answer-key-sheet').length : 0 });
    };
    const t0 = performance.now(); counting = true; document.querySelector(gen).click(); const t1 = performance.now();
    await new Promise(r => { const w = () => calls.length ? setTimeout(r, 400) : setTimeout(w, 1); w(); });
    const sheets = res.querySelectorAll('.worksheet, .mwg-worksheet, .mwg-answer-key-sheet').length;
    return { handler: t1 - t0, toPrint: calls[0].at - t0, afterHandler: calls[0].at - t1, frames: calls[0].frames, calls: calls.length,
      atCall: calls[0], sheets, back: res.parentNode === home && res.nextElementSibling === next && res.id === homeId };
  }, [spec.generate, spec.results, spec.printId]).then(async r => { r.errors = p.errors.slice(); await p.close(); return r; });
}

const srv = await serve(); const browser = await launch();
try {
  for (const file of ['index.html', 'math-minute.html', 'math-facts.html']) {
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    for (const [per, key] of [['1', false], ['5', true]]) {
      const now = [], base = [];
      for (let k = 0; k < RUNS; k++) for (const w of (k % 2 ? ['base', 'now'] : ['now', 'base'])) (w === 'now' ? now : base).push(await run(browser, srv.base, file, w === 'now' ? REF : BASE, per, key));
      const a = now[0], label = `3 × ${per}${key ? ' with keys' : ''}`;
      check(now.every(r => r.sheets > 0 && r.calls === 1), `${label}: one print a click, ${a.sheets} sheets made`);
      const gap = med(now.map(r => r.afterHandler));
      check(gap < 60, `${label}: the print call comes ${gap.toFixed(0)} ms after the click's handler ends (under 60; ${BASE}: ${med(base.map(r => r.afterHandler)).toFixed(0)})`);
      check(now.every(r => r.frames >= 1), `${label}: at least one frame between the click and the print call, so the sheets are painted behind the dialog (${now.map(r => r.frames).join(', ')})`);
      check(now.every(r => r.atCall.last && r.atCall.sheets === r.sheets), `${label}: at the call every sheet stands under the print id as the body's last child (${a.atCall.sheets} of ${a.sheets})`);
      check(now.every(r => r.back), `${label}: after the call the results are back in their place under their own id`);
      const ratio = med(now.map(r => r.toPrint)) / med(base.map(r => r.toPrint));
      check(ratio <= 0.5, `${label}: click → print ×${ratio.toFixed(2)} of ${BASE}'s time (medians of ${RUNS}, alternated; at most ×0.5)`);
      check(now.every(r => r.errors.length === 0), `${label}: 0 page errors`);
    }
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS44-print-wait: ${fails.length} failing check(s)` : '\nS44-print-wait: all green');
process.exit(fails.length ? 1 : 0);
