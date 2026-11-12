// Probe (loop S43; found S1, measured again S43 in pass A on index.html): Save PDF no longer waits 50 ms before each
// page's capture. The wait was "to let the DOM paint", but html2canvas draws the clone from its styles, never from the
// screen, so it bought nothing and cost ~18 % of an export (283 ms a page on index, 50 of them the wait). Per page, with
// the real cdnjs libraries and `Math.random` seeded, a class of three with 3 copies and keys: the gap from one page's
// image to the next page's capture is under 25 ms (median; 50+ before); each "Making your PDF: page k of N" line is on
// screen in at least one frame (a frame-by-frame record of the status line), so the progress still shows; every page
// image is byte-identical to the base commit's (`--base`, default cb49c62); and the export, timed against the base
// alternately, three runs each, takes at most 0.95 of its time (medians; reported as a ratio, never in ms).
// Fails before the change (`--ref <commit>`). Needs cdnjs; skips loudly without it.
//   node scripts/loop/probes/S43-pdf-page-wait.mjs [--ref <commit>] [--base <commit>] [--runs 3]
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), BASE = arg('--base') || 'cb49c62', RUNS = +(arg('--runs') || 3);
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const SEED = `(() => { let s = 20261112; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
// each page image (jpeg toDataURL) and when it was made; each capture's start; the status line at every frame
const HOOK = `(() => {
  window.__imgs = []; window.__done = []; window.__starts = []; window.__frames = [];
  const to = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function () { const d = to.apply(this, arguments);
    if (/jpeg/.test(arguments[0] || '')) { window.__imgs.push(d); window.__done.push(performance.now()); } return d; };
  let real;
  Object.defineProperty(window, 'html2canvas', { configurable: true, set: v => { real = v; },
    get: () => real && function (el, o) { window.__starts.push(performance.now()); return real(el, o); } });
  const tick = () => { const s = document.querySelector('#statusMessages, #mwgStatus');
    const t = s ? s.textContent : ''; if (window.__frames[window.__frames.length - 1] !== t) window.__frames.push(t);
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
})();`;

async function run(browser, base, file, ref) {
  const p = await openPage(browser, base, file, { raw: true, cdn: true });
  const { page, spec } = p;
  await p.context.addInitScript(SEED); await p.context.addInitScript(HOOK);
  if (ref) {
    const body = execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await page.reload({ waitUntil: 'load' }); await page.waitForSelector(`${spec.students} ${spec.entry}`);
  await spec.prepare(page);
  await page.check(spec.key);
  await page.selectOption(spec.perStudent, '3');
  // the two libraries fetched once first, so the timed export starts with them in the cache
  await page.evaluate(() => Promise.all(['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'].map(u => fetch(u).then(r => r.text()))));
  const dl = page.waitForEvent('download', { timeout: 180000 });
  const t0 = await page.evaluate(() => performance.now());
  await page.click(spec.pdf);
  await dl;
  const r = await page.evaluate(t0 => {
    const gaps = window.__starts.slice(1).map((s, i) => s - window.__done[i]);
    return { ms: window.__done[window.__done.length - 1] - t0, gaps, frames: window.__frames, n: window.__imgs.length, imgs: window.__imgs };
  }, t0);
  r.hashes = r.imgs.map(d => crypto.createHash('sha1').update(d).digest('hex').slice(0, 10)); delete r.imgs;
  r.errors = p.errors.slice();
  await p.close();
  return r;
}

const srv = await serve(); const browser = await launch();
try {
  const probe = await openPage(browser, srv.base, 'math-facts.html', { raw: true, cdn: true });
  const reach = await probe.page.evaluate(() => fetch('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', { method: 'HEAD' }).then(r => r.ok, () => false));
  await probe.close();
  if (!reach) { console.log('SKIP: cdnjs unreachable — this probe needs the real libraries'); process.exit(2); }
  for (const file of ['index.html', 'math-minute.html', 'math-facts.html']) {
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const now = [], base = [];
    for (let k = 0; k < RUNS; k++) for (const w of (k % 2 ? ['base', 'now'] : ['now', 'base'])) (w === 'now' ? now : base).push(await run(browser, srv.base, file, w === 'now' ? REF : BASE));
    const a = now[0], n = a.n;
    const gap = med(now.flatMap(r => r.gaps)), baseGap = med(base.flatMap(r => r.gaps));
    check(n > 0 && now.every(r => r.n === n), `${n} page images in each run`);
    check(gap < 25, `the gap from a page's image to the next capture: median ${gap.toFixed(1)} ms (under 25; ${BASE}: ${baseGap.toFixed(1)})`);
    const missing = [];
    for (let k = 1; k <= n; k++) if (!now.every(r => r.frames.some(t => t.includes(`page ${k} of ${n}`)))) missing.push(k);
    check(missing.length === 0, `every "page k of ${n}" line is on screen in a frame, in every run${missing.length ? ` (missing: ${missing.join(', ')})` : ''}`);
    check(now.every(r => JSON.stringify(r.hashes) === JSON.stringify(base[0].hashes)), `every page image is byte-identical to ${BASE}'s (${base[0].hashes.slice(0, 3).join(' ')}…)`);
    const ratio = med(now.map(r => r.ms)) / med(base.map(r => r.ms));
    check(ratio <= 0.95, `the export takes ×${ratio.toFixed(2)} of ${BASE}'s time (medians of ${RUNS}, alternated; at most ×0.95)`);
    check(now.every(r => r.errors.length === 0), `0 page errors`);
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS43-pdf-page-wait: ${fails.length} failing check(s)` : '\nS43-pdf-page-wait: all green');
process.exit(fails.length ? 1 : 0);
