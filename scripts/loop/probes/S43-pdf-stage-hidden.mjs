// Probe (loop S43; found S1, seen again S43 after pass A on index.html): Save PDF's stage — the 1056 × 816 box each
// sheet is cloned into for html2canvas — is not painted on screen. It sat at the document's top-left behind the page
// (`z-index:-1000`), so where the form has no background its sheet showed through: at the status line the export
// scrolls to, the bottom 129-145 px of each page's clone (its last row of problems) flickered behind the button row for
// the whole export. Per page, with the real cdnjs libraries and `Math.random` seeded: at the first capture (html2canvas
// held, the window scrolled to the top so the whole stage is in it) the window over the stage is the same with the
// stage taken out (under 100 pixels differ: anti-aliasing; 21,000-25,000 before); and every page image the PDF
// gets is byte-identical to the base commit's (`--base`, default 801fa84), so the PDF is unchanged.
// Fails before the change (`--ref <commit>`). Needs cdnjs; skips loudly without it.
//   node scripts/loop/probes/S43-pdf-stage-hidden.mjs [--ref <commit>] [--base <commit>]
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), BASE = arg('--base') || '801fa84';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = `(() => { let s = 20261112; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
// every page image's hash, and html2canvas held at the first capture until the probe lets it go
const HOOK = `(() => {
  window.__imgs = [];
  const to = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function () { const d = to.apply(this, arguments); if (/jpeg/.test(arguments[0] || '')) window.__imgs.push(d); return d; };
  let real;
  Object.defineProperty(window, 'html2canvas', { configurable: true, set: v => { real = v; }, get: () => real && function (el, o) {
    if (window.__held) return real(el, o);
    window.__held = true;
    window.__stageEl = el.parentNode; const b = el.parentNode.getBoundingClientRect();
    window.__stage = { top: b.top, bottom: b.bottom, vh: innerHeight };
    return new Promise(res => { window.__go = () => res(real(el, o)); });
  } });
})();`;

// pixels that differ between two PNG screenshots, counted in the page (a composited layer's going can move a few
// pixels of anti-aliasing at a rounded box's edge: 6-11 here, against 21,000-25,000 where the clone shows through)
const diffPixels = (page, a, b) => page.evaluate(async ([a, b]) => {
  const load = async s => { const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob());
    const c = new OffscreenCanvas(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, im.width, im.height).data; };
  const [p, q] = [await load(a), await load(b)];
  let n = 0; for (let i = 0; i < p.length; i += 4) if (p[i] !== q[i] || p[i + 1] !== q[i + 1] || p[i + 2] !== q[i + 2]) n++;
  return n;
}, [a.toString('base64'), b.toString('base64')]);

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
  const dl = page.waitForEvent('download', { timeout: 90000 });
  await page.click(spec.pdf);
  await page.waitForFunction(() => window.__go, null, { timeout: 30000 });
  // the click scrolls the status line into view (smoothly): wait until the window is still, then show the stage's
  // whole box — the export leaves a strip of it in the window, which may hold only the clone's blank margin
  await page.waitForFunction(() => new Promise(r => { const y = scrollY; setTimeout(() => r(scrollY === y), 300); }), null, { timeout: 10000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const st = await page.evaluate(() => { const b = window.__stageEl.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, vh: innerHeight }; });
  const y0 = Math.max(0, Math.floor(st.top)), y1 = Math.min(st.vh, Math.ceil(st.bottom));
  let same = null, stable = null;
  if (y1 - y0 > 0) {
    const clip = { x: 0, y: y0, width: 1056, height: y1 - y0 };
    const withStage = await page.screenshot({ clip });
    stable = await diffPixels(page, withStage, await page.screenshot({ clip }));
    await page.evaluate(() => { window.__stageEl.style.display = 'none'; });
    const without = await page.screenshot({ clip });
    await page.evaluate(() => { window.__stageEl.style.display = ''; });
    same = await diffPixels(page, withStage, without);
  }
  await page.evaluate(() => window.__go());
  await dl;
  const imgs = await page.evaluate(() => window.__imgs);
  const errors = p.errors.slice();
  await p.close();
  return { overlap: y1 - y0, same, stable, hashes: imgs.map(d => crypto.createHash('sha1').update(d).digest('hex').slice(0, 10)), errors };
}

const srv = await serve(); const browser = await launch();
try {
  const probe = await openPage(browser, srv.base, 'math-facts.html', { raw: true, cdn: true });
  const reach = await probe.page.evaluate(() => fetch('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', { method: 'HEAD' }).then(r => r.ok, () => false));
  await probe.close();
  if (!reach) { console.log('SKIP: cdnjs unreachable — this probe needs the real libraries'); process.exit(2); }
  for (const file of ['index.html', 'math-minute.html', 'math-facts.html']) {
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const now = await run(browser, srv.base, file, REF);
    const base = await run(browser, srv.base, file, BASE);
    check(now.overlap > 0, `the stage lies across the window at the first capture (${now.overlap} px, the window at the top), so the next check means something`);
    check(now.stable !== null && now.stable < 100, `two screenshots of the window with the stage in place agree (${now.stable} pixels differ; the window is still)`);
    check(now.same !== null && now.same < 100, `the window over the stage is the same with the stage taken out: ${now.same} pixels differ (under 100; nothing of the clone shows)`);
    check(now.hashes.length > 0 && JSON.stringify(now.hashes) === JSON.stringify(base.hashes),
      `the PDF's ${now.hashes.length} page images are byte-identical to ${BASE}'s (${base.hashes.length}: ${base.hashes.slice(0, 3).join(' ')}…)`);
    check(now.errors.length === 0, `0 page errors (${now.errors.join('; ')})`);
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS43-pdf-stage-hidden: ${fails.length} failing check(s)` : '\nS43-pdf-stage-hidden: all green');
process.exit(fails.length ? 1 : 0);
