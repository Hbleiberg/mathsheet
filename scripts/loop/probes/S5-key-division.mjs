// Probe (loop S5): on math-facts and math-minute, an answer key's division problem is the student sheet's
// own problem with the quotient in red over the bar. For every division level (1 copy, key on), under
// emulated print with the page's move trick, each key cell is compared with the same cell of the sheet:
//   - the bracket and the divisor sit in their cell where the sheet puts them (within 0.5 px);
//   - the quotient is the right answer, sits above the bar, ends over the dividend's last digit, and stays
//     inside its own cell.
// Fails on the pre-fix pages (`--control` serves each page from `git show b9df9c9:<page>`).
//   node scripts/loop/probes/S5-key-division.mjs [--control]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const control = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const codes = {
  'math-facts.html': ['/1', '/2', '/3', '/4', '/5', '/6', '/7', '/8', '/9', '/10', '/11', '/12',
    'mix/30', 'mix/40', 'mix/50', 'mix/60', 'mixmd30', 'mixmd60'],
  'math-minute.html': ['16', '17', '18', '19', '20', '21'],
};

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(codes)) {
    console.log(file);
    const p = await openPage(browser, srv.base, file, { raw: true });
    if (control) {
      const body = execSync(`git show b9df9c9:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await p.page.reload({ waitUntil: 'load' });
      await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
    }
    await p.page.click(p.spec.modeToggle);
    await p.page.fill(p.spec.advanced, codes[file].map((c, i) => `S${i}, ${i}, ${c};`).join('\n'));
    await p.page.setChecked(p.spec.key, true);
    await p.page.click(p.spec.generate);
    await p.page.waitForFunction(() => window.__prints > 0, null, { timeout: 15000 });
    await p.page.emulateMedia({ media: 'print' });
    const r = await p.page.evaluate(({ results, printId, n }) => {
      const res = document.querySelector(results); res.id = printId; document.body.appendChild(res);
      const sheets = [...document.querySelectorAll('.worksheet')];
      const rel = (el, s) => { const b = el.getBoundingClientRect(), o = s.getBoundingClientRect();
        return { l: b.left - o.left, t: b.top - o.top, r: b.right - o.left, b: b.bottom - o.top, w: b.width, h: b.height }; };
      const out = { sheets: sheets.length, cells: 0, moved: 0, wrong: [], below: 0, offRight: 0, outside: 0, worst: 0 };
      for (let i = 0; i < n; i++) {
        const sheet = sheets[i], key = sheets[n + i];
        if (!sheet || !key) continue;
        const sc = sheet.querySelectorAll('.problem-cell'), kc = key.querySelectorAll('.problem-cell');
        sc.forEach((cell, j) => {
          const sDiv = cell.querySelector('.division-problem'); if (!sDiv) return;
          out.cells++;
          const kCell = kc[j], kDiv = kCell && kCell.querySelector('.division-problem');
          const kBr = kDiv && kDiv.querySelector('.division-bracket'), kDd = kDiv && kDiv.querySelector('.division-dividend');
          const q = kDd && kDd.querySelector('span');
          if (!kBr || !q) { out.moved++; return; }
          for (const sel of ['.division-bracket', '.division-divisor']) {
            const a = rel(cell.querySelector(sel), cell), b = rel(kDiv.querySelector(sel), kCell);   // a long key description wraps and lowers the whole grid (S2)
            const d = Math.max(Math.abs(a.l - b.l), Math.abs(a.t - b.t), Math.abs(a.w - b.w), Math.abs(a.h - b.h));
            out.worst = Math.max(out.worst, d); if (d > 0.5) out.moved++;
          }
          const divisor = +cell.querySelector('.division-divisor').textContent, dividend = +cell.querySelector('.division-dividend').textContent;
          if (+q.textContent !== dividend / divisor) out.wrong.push(`${dividend}÷${divisor}=${q.textContent}`);
          const qr = rel(q, key), br = rel(kBr, key), dd = rel(kDd, key), cr = rel(kCell, key);
          if (qr.b > br.t - 1) out.below++;                      // the bar is the bracket's top border
          if (Math.abs(qr.r - dd.r) > 0.5) out.offRight++;
          if (qr.t < cr.t - 0.5) out.outside++;
        });
      }
      return out;
    }, { results: p.spec.results, printId: p.spec.printId, n: codes[file].length });
    check(r.sheets === 2 * codes[file].length && r.cells > 0, `${r.sheets} sheets, ${r.cells} division cells compared`);
    check(r.moved === 0, `key bracket and divisor where the sheet puts them (${r.moved} off, worst ${r.worst.toFixed(2)} px)`);
    check(r.wrong.length === 0, `every quotient right (${r.wrong.slice(0, 3).join(', ') || 'none wrong'})`);
    check(r.below === 0 && r.offRight === 0, `quotient over the bar, ending over the dividend (${r.below} not above, ${r.offRight} off its right edge)`);
    check(r.outside === 0, `quotient inside its own cell (${r.outside} outside)`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS5-key-division: ${fails.length} failing` : '\nS5-key-division: all green');
process.exit(fails.length ? 1 : 0);
