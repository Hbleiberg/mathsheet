// Probe (loop S15, pass L): the <head> contract of all three pages. Each page is served by GitHub Pages from
// `main` and embedded in a mathsheet.io WordPress page inside an iframe; the public titles, descriptions and
// search metadata live in WordPress, so the repo pages declare `noindex` (approved S15, gate 2) and keep
// `lang="en"`, a UTF-8 charset, the viewport tag and a non-empty <title>. Read from the live document (not the
// source), so a tag that the parser drops or a script rewrites would show. Fails on the pages before the robots
// tag (`--ref 658ede3`).
//   node scripts/loop/probes/S15-head.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };

const srv = await serve(); const browser = await launch();
for (const file of ['index.html', 'math-minute.html', 'math-facts.html']) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  const p = await openPage(browser, srv.base, file, { raw: true });
  if (REF) {
    const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
  }
  const head = await p.page.evaluate(() => ({
    lang: document.documentElement.lang, charset: document.characterSet, title: document.title,
    viewport: (document.querySelector('meta[name="viewport"]') || {}).content || '',
    robots: [...document.querySelectorAll('meta[name="robots"]')].map(m => m.content),
    headMetas: document.head.querySelectorAll('meta').length,
  }));
  check(head.lang === 'en', `lang="en" (${JSON.stringify(head.lang)})`);
  check(head.charset === 'UTF-8', `charset UTF-8 (${head.charset})`);
  check(head.title.length > 0, `a <title>: ${JSON.stringify(head.title)}`);
  check(/width=device-width/.test(head.viewport), `the viewport tag (${JSON.stringify(head.viewport)})`);
  check(head.robots.length === 1 && head.robots[0] === 'noindex', `exactly one robots tag, "noindex" (${JSON.stringify(head.robots)})`);
  check(head.headMetas === 3, `three meta tags in <head>: charset, viewport, robots (${head.headMetas})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS15-head: ${fails.length} failing check(s)` : '\nS15-head: all green');
process.exit(fails.length ? 1 : 0);
