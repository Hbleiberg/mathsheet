// Probe (loop S41; S19's P4, found by pass M, approved S40 at gate 2 and held for index's cap): the Problem Count of a
// type capped at 30 reads "30 problems (max)". "30 problems (max for this type)" was 178 px of text, cut at every
// width: "30 problems (max for this typ" at 1280 px, "(ma" on an iPad. At 1280, 1024 and 901 px, an iPad Mini upright,
// an iPhone 13 either way and mathsheet.io's 350 px frame on a phone: every capped type each grade offers shows the one
// option, 30, chosen, its whole text in the select. The other types' counts are the page's before the change; Generate
// Advanced Code and a seeded class set (capped and other rows, keys) are byte-identical to it. 0 page errors.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S41-count-text.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, devices, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = () => { let a = 20261112; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const SHAPES = [['1280 px', { viewport: { width: 1280, height: 900 } }], ['1024 px', { viewport: { width: 1024, height: 900 } }],
  ['901 px', { viewport: { width: 901, height: 900 } }], ['iPad Mini', devices['iPad Mini']], ['iPhone 13', devices['iPhone 13']],
  ['iPhone 13 landscape', devices['iPhone 13 landscape']], ['frame 350', { viewport: { width: 350, height: 1400 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]];
const fixAt = execSync('git log -1 --format=%h -S"30 problems (max)</option>" -- index.html', { cwd: ROOT, encoding: 'utf8' }).trim();
const BEFORE = fixAt ? `${fixAt}~1` : 'HEAD';
const S1 = '#mwgStudentsContainer .mwg-student-entry:nth-child(1)';
const CLASS = 'Avi Cohen, 1, fractions, 30, 6;\nNoa Levi, 2, mul2, 40, 4;\nשרה כהן, 3, decimals[add|muld], 30, 7;\nEli, 4, rounding, 30, 3;\nDana, 5, mixed[add1|div2], 20, 5;';

async function open(browser, base, dev, ref) {
  const p = await openPage(browser, base, 'index.html', { raw: true, device: dev });
  await p.page.addInitScript(SEED);
  if (ref) {
    const body = execSync(`git show ${ref}:index.html`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(S1);
  return p;
}
// every grade's types: the count options, and the chosen count's text against the select's text box
async function sweep(page) {
  const out = [];
  for (let g = 1; g <= 8; g++) {
    await page.selectOption(`${S1} [name="grade"]`, String(g));
    const types = await page.$$eval(`${S1} [name="problemType"] option`, os => os.map(o => o.value).filter(Boolean));
    for (const t of types) {
      await page.selectOption(`${S1} [name="problemType"]`, t);
      out.push(await page.evaluate(([sel, g, t]) => {
        const e = document.querySelector(`${sel} [name="count"]`), s = getComputedStyle(e), span = document.createElement('span');
        span.style.cssText = `font:${s.font};white-space:pre;position:absolute;visibility:hidden`;
        span.textContent = e.options[e.selectedIndex].text; document.body.appendChild(span);
        const tw = span.getBoundingClientRect().width; span.remove();
        return { g, t, options: [...e.options].map(o => `${o.value}=${o.text}`).join('|'), value: e.value,
          tw: Math.round(tw), room: Math.round(e.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) - 22) };
      }, [S1, g, t]));
    }
  }
  return out;
}
async function generate(page) {
  await page.click('#mwgToggleModeBtn'); await page.fill('#mwgAdvancedBox', CLASS);
  await page.check('#mwgAnswerKeyToggle'); await page.click('#mwgGenerateBtn');
  await page.waitForFunction(() => window.__prints > 0);
  const html = await page.$eval('#mwgResults', r => r.innerHTML);
  await page.click('#mwgToggleModeBtn');
  await page.fill(`${S1} [name="studentName"]`, 'Avi Cohen');
  await page.selectOption(`${S1} [name="grade"]`, '6'); await page.selectOption(`${S1} [name="problemType"]`, 'fractions');
  await page.click('#mwgGenCodeBtn');
  const code = await page.$eval('#mwgCodeOutput', e => e.value);
  return { html, code };
}

const srv = await serve(); const browser = await launch();
try {
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}; before: ${BEFORE}`);
  let base = null;
  for (const [shape, dev] of SHAPES) {
    const p = await open(browser, srv.base, dev, REF);
    const rows = await sweep(p.page), capped = rows.filter(r => !r.options.startsWith('=Count'));
    const right = capped.filter(r => r.options === '30=30 problems (max)' && r.value === '30');
    const cut = rows.filter(r => r.value && r.tw > r.room);
    check(capped.length >= 25 && right.length === capped.length, `${shape}: ${right.length} of ${capped.length} capped choices read "30 problems (max)", chosen (${capped.length - right.length ? capped.find(r => !right.includes(r)).options : 'all'})`);
    check(cut.length === 0, `${shape}: every capped count shows its whole text (${cut.length} cut${cut.length ? ': "' + cut[0].options.split('=')[1] + '" ' + cut[0].tw + '/' + cut[0].room : ''})`);
    if (!base) {
      const was = await open(browser, srv.base, dev, BEFORE);
      const old = await sweep(was.page);
      const others = rows.filter(r => r.options.startsWith('=Count')), oldOthers = old.filter(r => r.options.startsWith('=Count'));
      check(others.length > 100 && others.length === oldOthers.length && others.every((r, i) => r.options === oldOthers[i].options && r.t === oldOthers[i].t),
        `${shape}: the other ${others.length} types' counts as before (${others[0].options.slice(0, 40)}…)`);
      const now = await generate(p.page), then = await generate(was.page);
      check(now.html.length > 10000 && now.html === then.html, `${shape}: a seeded class set with keys (capped and other rows) byte-identical to ${BEFORE}'s (${now.html.length} chars)`);
      check(now.code === then.code && /^Avi Cohen, , fractions(\[[a-z|-]+\])?, 30, 6;/.test(now.code), `${shape}: Generate Advanced Code as before (${JSON.stringify(now.code.split('\n')[0])})`);
      base = true; await was.close();
    }
    check(p.errors.length === 0, `${shape}: 0 page errors (${p.errors.length})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS41-count-text: ${fails.length} failing check(s)` : '\nS41-count-text: all green');
process.exit(fails.length ? 1 : 0);
