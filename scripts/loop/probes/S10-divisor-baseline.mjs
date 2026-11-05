// S10 probe: on math-minute and math-facts the long-division divisor shares the dividend's baseline (approved S10,
// gate 6; it sat 3.0 px low, S5). Per page, seeded, under print (the page's own move-to-body trick), every division
// level with keys: the divisor's and the dividend's baselines agree within 0.1 px on every bracket, sheets and keys;
// the brackets and problems sit exactly where they do on the reference page (only the divisor's glyphs moved);
// every sheet 1056×816. `--only <file>`; `--ref <commit>` (HEAD); `--control` runs the reference as the page under
// test, which must fail the baseline check.
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';
const args = process.argv.slice(2), flag = f => args.includes(f), opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const REF = opt('--ref') || 'HEAD', CONTROL = flag('--control');
const SEED = `(() => { let s = 777; Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();`;
const ROSTER = {
  'math-minute.html': ['16', '17', '18', '19', '20', '21'].map((l, i) => `S${i + 1}, ${i + 1}, ${l};`).join('\n'),
  'math-facts.html': ['/1', '/5', '/7', '/12', 'mix/40', 'mixmd40', 'mixmd60'].map((l, i) => `S${i + 1}, ${i + 1}, ${l};`).join('\n'),
};
const files = opt('--only') ? [opt('--only')] : Object.keys(ROSTER);
const srv = await serve(); const browser = await launch();
let failing = 0;
const check = (ok, msg) => { if (!ok) failing++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); };

async function run(file, body) {
  const p = await openPage(browser, srv.base, file, { raw: true });
  await p.context.addInitScript(SEED);
  if (body) await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' });
  await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  await p.page.click(p.spec.modeToggle); await p.page.setChecked(p.spec.key, true);
  await p.page.fill(p.spec.advanced, ROSTER[file]);
  const n = await p.prints(); await p.page.click(p.spec.generate); await p.page.waitForFunction(n => window.__prints > n, n);
  await p.page.emulateMedia({ media: 'print' });
  const out = await p.page.evaluate(() => {
    const r = document.querySelector('#results'); r.id = 'results-print'; document.body.appendChild(r);
    const base = el => { const m = document.createElement('span'); m.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'; el.appendChild(m); const y = m.getBoundingClientRect().top; el.removeChild(m); return y; };
    return [...document.querySelectorAll('.worksheet')].map(s => {
      const sb = s.getBoundingClientRect(); const rel = b => [b.left - sb.left, b.top - sb.top, b.width, b.height].map(v => Math.round(v * 100) / 100);
      return { w: Math.round(sb.width), h: Math.round(sb.height), key: /ANSWER KEY/.test(s.querySelector('.description-text').textContent),
        probs: [...s.querySelectorAll('.division-problem')].map(d => {
          const dv = d.querySelector('.division-divisor'), dd = d.querySelector('.division-dividend'), br = d.querySelector('.division-bracket');
          return { delta: Math.round((base(dv) - base(dd)) * 100) / 100, prob: rel(d.getBoundingClientRect()), bracket: rel(br.getBoundingClientRect()), divisorTop: Math.round((dv.getBoundingClientRect().top - d.getBoundingClientRect().top) * 100) / 100 };
        }) };
    });
  });
  await p.close(); return out;
}

for (const file of files) {
  const ref = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
  const now = await run(file, CONTROL ? ref : null), before = await run(file, ref);
  console.log(`${file}${CONTROL ? ` (control: ${REF})` : ''}`);
  const probs = now.flatMap(s => s.probs), refProbs = before.flatMap(s => s.probs);
  const worst = Math.max(...probs.map(x => Math.abs(x.delta))), refWorst = Math.max(...refProbs.map(x => Math.abs(x.delta)));
  check(now.length === before.length && now.every(s => s.w === 1056 && s.h === 816), `${now.length} sheets and keys (${now.filter(s => s.key).length} keys), all 1056×816`);
  check(probs.length > 100 && worst <= 0.1, `${probs.length} brackets: divisor and dividend baselines agree within 0.1 px (worst ${worst.toFixed(2)} px; ${REF}: ${refWorst.toFixed(2)} px)`);
  const moved = probs.filter((x, i) => JSON.stringify(x.prob) !== JSON.stringify(refProbs[i].prob) || JSON.stringify(x.bracket) !== JSON.stringify(refProbs[i].bracket));
  check(probs.length === refProbs.length && !moved.length, `every problem box and bracket exactly where ${REF} puts it (${moved.length} moved)`);
  check(probs.every(x => x.divisorTop >= -0.01), `the divisor's box stays inside its problem's (top offset ${Math.min(...probs.map(x => x.divisorTop)).toFixed(2)} px)`);
}
console.log(`S10-divisor-baseline: ${failing ? failing + ' failing' : 'all green'}`);
await browser.close(); await srv.close();
process.exit(failing ? 1 : 0);
