// Probe (loop S36; found S15, pass L; approved S36): each page carries mathsheet.io's own site icon inline. GitHub
// Pages answers 404 for /favicon.ico, so a teacher who opened a copy directly had no tab icon (inside the mathsheet.io
// frames none ever shows). Per page: exactly one icon link in <head>, a PNG data URI (nothing fetched), the same
// bytes as the site's 32 px icon (SHA-256), decoding to a 32 x 32 image with ink at its centre; the head otherwise as
// S15 left it (S15-head) and no page error. Fails before the change (`--ref 807d737`).
//   node scripts/loop/probes/S36-favicon.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { serve, launch, openPage, PAGES, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SHA = '5b4fbc86837dd1028ccfbc3a605dd2cc45175908acccd799b5c13ef0791b3131';   // mathsheet.io's site icon, 32 px

const srv = await serve(); const browser = await launch();
const hrefs = [];
try {
  for (const file of Object.keys(PAGES)) {
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const p = await openPage(browser, srv.base, file, { raw: true });
    const asked = [];
    p.page.on('request', r => { if (/favicon/i.test(r.url())) asked.push(r.url()); });
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    }
    await p.page.reload({ waitUntil: 'load' });
    const got = await p.page.evaluate(async () => {
      const links = [...document.querySelectorAll('link[rel~="icon"]')];
      const inHead = links.every(l => l.parentElement === document.head);
      const href = links[0] ? links[0].getAttribute('href') : '';
      let img = null;
      if (href) {
        const im = new Image(); im.src = href;
        try { await im.decode(); } catch (e) {}
        const c = document.createElement('canvas'); c.width = 32; c.height = 32;
        const g = c.getContext('2d'); g.drawImage(im, 0, 0);
        const a = g.getImageData(12, 12, 8, 8).data; let ink = 0;
        for (let i = 3; i < a.length; i += 4) if (a[i] > 0) ink++;
        img = { w: im.naturalWidth, h: im.naturalHeight, ink };
      }
      return { n: links.length, inHead, href, img };
    });
    check(got.n === 1 && got.inHead, `one icon link, in <head> (${got.n})`);
    const m = got.href.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
    check(!!m, `a PNG data URI, nothing to fetch (${got.href.slice(0, 30)})`);
    const sha = m ? createHash('sha256').update(Buffer.from(m[1], 'base64')).digest('hex') : '';
    check(sha === SHA, `the bytes are mathsheet.io's 32 px site icon (${sha.slice(0, 12) || 'none'})`);
    check(got.img && got.img.w === 32 && got.img.h === 32 && got.img.ink > 0, `it decodes to 32 x 32 with ink at its centre (${JSON.stringify(got.img)})`);
    check(asked.length === 0, `no favicon request (${asked.join(', ')})`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
    hrefs.push(got.href);
    await p.close();
  }
  check(hrefs.length === 3 && hrefs.every(h => h && h === hrefs[0]), 'the same icon on all three pages');
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS36-favicon: ${fails.length} failing check(s)` : '\nS36-favicon: all green');
process.exit(fails.length ? 1 : 0);
