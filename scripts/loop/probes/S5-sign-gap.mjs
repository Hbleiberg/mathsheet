// Probe (loop S5): on math-facts and math-minute every stacked problem, sheet and key, leaves the same gap
// between its sign and the bottom number. A one-digit number's 18 px box gave "× 7" 7.2 px and "×12" 2 px.
// Every level of both pages, under emulated print with the page's move trick:
//   - every gap is 7.2 px (±0.2), whatever the number of digits;
//   - a one-digit problem is where it was: the sign ends 20 px (±0.1) left of the stack's right edge;
//   - the bottom line fits inside the stack (the sign never runs past its left edge).
// math-minute has no two-digit bottom number today: its CSS changed to stay the twin of math-facts'.
// Fails on the pre-fix pages (`--control` serves each page from `git show 2a74f54:<page>`).
//   node scripts/loop/probes/S5-sign-gap.mjs [--control]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const control = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };

const srv = await serve(); const browser = await launch();
try {
  for (const file of ['math-facts.html', 'math-minute.html']) {
    console.log(file);
    const p = await openPage(browser, srv.base, file, { raw: true });
    if (control) {
      const body = execSync(`git show 2a74f54:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await p.page.reload({ waitUntil: 'load' });
      await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
    }
    const levels = await p.page.$$eval(`${p.spec.students} select[name="level"] option`, os => [...new Set(os.map(o => o.value).filter(Boolean))]);
    await p.page.click(p.spec.modeToggle);
    await p.page.fill(p.spec.advanced, levels.map((c, i) => `S${i}, ${i}, ${c};`).join('\n'));
    await p.page.setChecked(p.spec.key, true);
    await p.page.click(p.spec.generate);
    await p.page.waitForFunction(() => window.__prints > 0, null, { timeout: 30000 });
    await p.page.emulateMedia({ media: 'print' });
    const r = await p.page.evaluate(({ results, printId }) => {
      const res = document.querySelector(results); res.id = printId; document.body.appendChild(res);
      const text = el => { const g = document.createRange(); g.selectNodeContents(el); return g.getBoundingClientRect(); };
      const out = { sheets: document.querySelectorAll('.worksheet').length, stacks: 0, byDigits: {}, oneMoved: 0, overflow: 0 };
      for (const st of document.querySelectorAll('.problem-stack')) {
        const line = st.querySelector('.problem-bottom-line'); if (!line) continue;
        out.stacks++;
        const op = text(line.querySelector('.problem-operator')), b = line.querySelector('.problem-bottom');
        const n = b.textContent.length, gap = text(b).left - op.right, s = st.getBoundingClientRect();
        const d = out.byDigits[n] = out.byDigits[n] || { n: 0, min: 99, max: -99 };
        d.n++; d.min = Math.min(d.min, gap); d.max = Math.max(d.max, gap);
        if (n === 1 && Math.abs(s.right - op.right - 20) > 0.1) out.oneMoved++;   // was the 18 px box + 2 px margin
        if (op.left < s.left - 0.5) out.overflow++;
      }
      return out;
    }, { results: p.spec.results, printId: p.spec.printId });
    check(r.sheets === 2 * levels.length && r.stacks > 0, `${levels.length} levels, ${r.sheets} sheets with keys, ${r.stacks} stacked problems`);
    const gaps = Object.entries(r.byDigits).map(([n, d]) => `${n} digit(s): ${d.min.toFixed(1)}–${d.max.toFixed(1)} px (${d.n})`).join('; ');
    check(Object.values(r.byDigits).every(d => d.min >= 7.0 && d.max <= 7.4), `one gap for every bottom number (${gaps})`);
    check(r.oneMoved === 0, `one-digit problems where they were (${r.oneMoved} moved)`);
    check(r.overflow === 0, `every bottom line inside its stack (${r.overflow} over the left edge)`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS5-sign-gap: ${fails.length} failing` : '\nS5-sign-gap: all green');
process.exit(fails.length ? 1 : 0);
