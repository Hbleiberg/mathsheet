// Probe (loop S49; found S12, pass D): the three settings checkboxes (Print Answer Key, Remove 'Student Number' Field,
// Name blank) were 16 px targets beside a 16 px label. Each label now reaches over its checkbox and halfway to the next
// row, so each line is one target, 30 px tall on the twins (rows 8 px apart) and 42 px on index (20 px apart), with
// nothing moved. On all three pages at 1280, 800 and 390 px:
//   - each label's box starts at its row's left edge (over the checkbox) and is at least 30 / 42 px tall; no two overlap;
//   - every point of that box (a 4 × 2 px grid) hits this setting's label or checkbox: nothing covers it, and on the page
//     before the change no other control sat there;
//   - real mouse clicks at the box's top and bottom edges, in the gap and on the checkbox toggle that checkbox once and
//     no other; Playwright's check() still lands;
//   - nothing moves: every element of the app but the three labels keeps its box, the labels' text keeps its place, and
//     the settings column's pixels are identical to the page before the change;
//   - 0 page errors.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S49-settings-targets.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const PAGES = [
  { file: 'index.html', root: '#mwg-app', ids: ['mwgAnswerKeyToggle', 'mwgRemoveNumberToggle', 'mwgNameBlankToggle'], tall: 42 },
  { file: 'math-minute.html', root: '#math-minute-app', ids: ['answerKeyToggle', 'removeNumberToggle', 'nameBlankToggle'], tall: 30 },
  { file: 'math-facts.html', root: '#math-facts-app', ids: ['answerKeyToggle', 'removeNumberToggle', 'nameBlankToggle'], tall: 30 },
];

async function open(browser, base, file, ref, width) {
  const p = await openPage(browser, base, file, { raw: true });
  if (ref) {
    const body = execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await p.page.setViewportSize({ width, height: 1400 });
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`#${PAGES.find(x => x.file === file).ids[2]}`);
  return p;
}
const geometry = (pg, { root, ids }) => pg.evaluate(({ root, ids }) => {
  const r = e => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
  const labels = ids.map(id => document.querySelector(`label[for="${id}"]`));
  const text = l => { const g = document.createRange(); g.selectNodeContents(l); return r(g); };
  return {
    rows: ids.map((id, k) => ({ cb: r(document.getElementById(id)), row: r(document.getElementById(id).parentElement), label: r(labels[k]), text: text(labels[k]) })),
    others: [...document.querySelector(root).querySelectorAll('*')].filter(e => !labels.includes(e)).map(r),
  };
}, { root, ids });
const hits = (pg, ids, boxes) => pg.evaluate(({ ids, boxes }) => boxes.map((b, k) => {
  const foreign = new Set(); let n = 0;
  for (let x = b[0] + 0.5; x < b[0] + b[2]; x += 4) for (let y = b[1] + 0.5; y < b[1] + b[3]; y += 2) {
    n++; const e = document.elementFromPoint(x, y);
    if (!(e && (e.id === ids[k] || e.htmlFor === ids[k]))) foreign.add(e ? (e.id || e.htmlFor || e.className || e.tagName) : 'none');
  }
  return { n, foreign: [...foreign] };
}), { ids, boxes });
const near = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) <= 0.25);

const srv = await serve(); const browser = await launch();
try {
  for (const P of PAGES) {
    const BEFORE = REF ? null : (execSync(`git log -1 --format=%h -S"S49; found S12" -- ${P.file}`, { cwd: ROOT, encoding: 'utf8' }).trim() || null);
    const OLD = BEFORE ? `${BEFORE}~1` : 'HEAD';
    console.log(`${P.file}${REF ? ` (served from ${REF})` : ''}; before the change: ${OLD}`);
    for (const width of [1280, 800, 390]) {
      const p = await open(browser, srv.base, P.file, REF, width); const pg = p.page;
      const g = await geometry(pg, P);
      const short = g.rows.filter(x => Math.abs(x.label[0] - x.row[0]) > 1 || x.label[3] < P.tall - 0.25);
      check(short.length === 0, `${width} px: each label spans its line from the row's edge, ≥ ${P.tall} px tall (${g.rows.map(x => `${(x.label[0] - x.row[0]).toFixed(1)} / ${x.label[2].toFixed(0)}×${x.label[3].toFixed(1)}`).join(', ')})`);
      const over = g.rows.slice(1).map((x, k) => x.label[1] - (g.rows[k].label[1] + g.rows[k].label[3]));
      check(over.every(o => o >= -0.25), `${width} px: no two labels overlap (${over.map(o => o.toFixed(1)).join(', ')} px apart)`);
      const h = await hits(pg, P.ids, g.rows.map(x => x.label));
      check(h.every(x => x.n > 100 && x.foreign.length === 0), `${width} px: every point of each label's box is that setting's (${h.map(x => `${x.n} points${x.foreign.length ? ', also ' + x.foreign.join('/') : ''}`).join('; ')})`);
      // real clicks: top edge, bottom edge, the gap, the checkbox; each toggles its own checkbox once
      const bad = [];
      for (let k = 0; k < 3; k++) {
        const x = g.rows[k], L = x.label, cb = x.cb;
        const spots = { top: [x.text[0] + 5, L[1] + 1], bottom: [x.text[0] + 5, L[1] + L[3] - 1], gap: [cb[0] + cb[2] + 6, x.text[1] + x.text[3] / 2], checkbox: [cb[0] + cb[2] / 2, cb[1] + cb[3] / 2], 'over the checkbox': [cb[0] + cb[2] / 2, L[1] + 1] };
        for (const [name, [px, py]] of Object.entries(spots)) {
          const was = await pg.evaluate(ids => ids.map(id => document.getElementById(id).checked), P.ids);
          await pg.mouse.click(px, py);
          const is = await pg.evaluate(ids => ids.map(id => document.getElementById(id).checked), P.ids);
          const changed = is.map((v, j) => v !== was[j]);
          if (!(changed[k] && changed.filter(Boolean).length === 1)) bad.push(`${P.ids[k]} ${name}`);
        }
      }
      check(bad.length === 0, `${width} px: real clicks at the top and bottom edges, the gap, the checkbox and above it toggle that setting alone (${bad.length ? 'missed: ' + bad.join(', ') : '15 clicks'})`);
      let landed = true;
      for (const id of P.ids) { await pg.check(`#${id}`, { timeout: 3000 }).catch(() => { landed = false; }); await pg.uncheck(`#${id}`, { timeout: 3000 }).catch(() => { landed = false; }); }
      check(landed, `${width} px: Playwright's check() and uncheck() land on all three`);
      if (!REF) {
        const q = await open(browser, srv.base, P.file, OLD, width);
        const og = await geometry(q.page, P);
        const movedOthers = og.others.length === g.others.length ? og.others.filter((b, i) => !near(b, g.others[i])).length : -1;
        const movedText = og.rows.filter((x, k) => !near(x.text, g.rows[k].text) || !near(x.cb, g.rows[k].cb)).length;
        check(movedOthers === 0 && movedText === 0, `${width} px: nothing moved against ${OLD}: ${g.others.length} other elements, the labels' text and checkboxes (${movedOthers} / ${movedText} differ)`);
        const oh = await hits(q.page, P.ids, g.rows.map(x => x.label));
        const foreignOld = oh.flatMap(x => x.foreign.filter(f => /Toggle|button|select|input|textarea|link/i.test(f)));
        check(foreignOld.length === 0, `${width} px: on ${OLD} no other control sat inside the new boxes (${foreignOld.join(', ') || 'none'})`);
        const clip = (b => ({ x: Math.max(0, b[0] - 40), y: Math.max(0, b[1] - 20), width: b[2] + 80, height: b[3] + 40 }))(
          (rs => [Math.min(...rs.map(x => x.row[0])), rs[0].row[1], Math.max(...rs.map(x => x.row[0] + x.row[2])) - Math.min(...rs.map(x => x.row[0])), rs[2].row[1] + rs[2].row[3] - rs[0].row[1]])(g.rows));
        await pg.mouse.move(0, 0); await q.page.mouse.move(0, 0); await pg.evaluate(() => document.activeElement && document.activeElement.blur());
        const [a, b] = [await pg.screenshot({ clip }), await q.page.screenshot({ clip })];
        check(a.equals(b), `${width} px: the settings column's pixels identical to ${OLD}'s (${clip.width.toFixed(0)}×${clip.height.toFixed(0)} px)`);
        await q.close();
      }
      check(p.errors.length === 0, `${width} px: 0 page errors (${p.errors.join('; ')})`);
      await p.close();
    }
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS49-settings-targets: ${fails.length} failing check(s)` : '\nS49-settings-targets: all green');
process.exit(fails.length ? 1 : 0);
