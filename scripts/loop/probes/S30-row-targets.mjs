// Probe (loop S30; found S12, pass D on math-facts.html): Duplicate / Delete student were 16 px of text with no padding
// (D's floor is 44 px; AA's 24 passed only by the spacing exception), side by side in every roster row, and a missed
// Delete loses a row with no undo. Each now carries 12 px / 5 px of padding taken back by a negative margin. On all three
// pages at 1280, 800 and 390 px, for every default row:
//   - each target is ≥ 39 px tall and its text's width + 10 px wide, inside its entry, overlapping neither the other
//     target nor any heading, label or field of the entry;
//   - a point 10 px above or below each link's text hits that link, and real mouse clicks there duplicate and delete;
//   - nothing moves: every element of the roster and both links' text sit where the reference page puts them (±0.25 px).
// Fails before the change (`--control`: the reference page served as the one under test).
//   node scripts/loop/probes/S30-row-targets.mjs [--control] [--ref <commit>]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref') || '02939af', CONTROL = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEL = {
  'index.html': { dup: '.mwg-duplicate-link', del: '.mwg-delete-link', entry: '.mwg-student-entry', rows: '#mwgStudentsContainer' },
  'math-minute.html': { dup: '.duplicate-student-link', del: '.delete-student-link', entry: '.student-entry', rows: '#studentsContainer' },
};
SEL['math-facts.html'] = SEL['math-minute.html'];
const srv = await serve(); const browser = await launch();

async function open(file, width, body) {
  const p = await openPage(browser, srv.base, file, { raw: true, viewport: { width, height: 1600 } });   // every row on screen: elementFromPoint sees only the viewport
  if (body) {
    await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  }
  p.page.on('dialog', d => d.accept());
  return p;
}
// every element of the roster (the two links by their text) and the two targets per row
const measure = (p, s) => p.page.evaluate(s => {
  const R = b => ({ l: b.left, t: b.top, r: b.right, b: b.bottom });
  const textBox = e => { const r = document.createRange(); r.selectNodeContents(e); return R(r.getBoundingClientRect()); };
  const root = document.querySelector(s.rows);
  const layout = [...root.querySelectorAll('*')].map(e => e.matches(`${s.dup}, ${s.del}`) ? textBox(e) : R(e.getBoundingClientRect()));
  const rows = [...root.querySelectorAll(s.entry)].map(ent => {
    const e = R(ent.getBoundingClientRect()), dup = ent.querySelector(s.dup), del = ent.querySelector(s.del);
    const others = [...ent.querySelectorAll('h3, label, input, select, textarea, button')].filter(o => o !== dup && o !== del && o.getClientRects().length).map(o => R(o.getBoundingClientRect()));
    const hit = (el, x, y) => { const h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); };
    const one = el => {
      const b = R(el.getBoundingClientRect()), t = textBox(el), cx = (t.l + t.r) / 2;
      return { h: b.b - b.t, w: b.r - b.l, tw: t.r - t.l, inside: b.l >= e.l && b.r <= e.r && b.t >= e.t && b.b <= e.b,
        covers: others.filter(o => o.l < b.r && o.r > b.l && o.t < b.b && o.b > b.t).length,
        above: hit(el, cx, t.t - 10), below: hit(el, cx, t.b + 10), t };
    };
    const a = one(dup), b = one(del), da = R(dup.getBoundingClientRect()), db = R(del.getBoundingClientRect());
    const apart = da.r <= db.l + 0.01 || db.r <= da.l + 0.01 || da.b <= db.t + 0.01 || db.b <= da.t + 0.01;
    return { dup: a, del: b, apart };
  });
  return { layout, rows };
}, s);

try {
  for (const file of Object.keys(SEL)) {
    const s = SEL[file];
    let ref = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    // S40's two rows of fields at 701-900 px on index (approved, gate 4) moved the 800 px roster by design: replay that
    // rule into the reference, so this arm still sees only the targets' own change (repaired S42)
    if (file === 'index.html' && !ref.includes('An iPad upright')) {
      const rule = fs.readFileSync(`${ROOT}/index.html`, 'utf8').match(/\/\* An iPad upright[\s\S]*?\n\}\n/);
      if (!rule) throw new Error("index.html lacks S40's 701-900 px rule");
      ref = ref.replace('@media (max-width: 700px) {', () => rule[0] + '@media (max-width: 700px) {');
    }
    console.log(`${file}${CONTROL ? ` (control: ${REF})` : ''}`);
    for (const width of [1280, 800, 390]) {
      const p = await open(file, width, CONTROL ? ref : null), q = await open(file, width, ref);
      const m = await measure(p, s), r = await measure(q, s);
      const moved = m.layout.length === r.layout.length ? Math.max(...m.layout.map((b, i) => Math.max(...['l', 't', 'r', 'b'].map(k => Math.abs(b[k] - r.layout[i][k]))))) : Infinity;
      check(m.rows.length === 3 && moved <= 0.25, `${width} px: ${m.layout.length} roster elements and the links' text where ${REF} puts them (largest move ${moved === Infinity ? 'n/a' : moved.toFixed(2)} px)`);
      const t = m.rows.flatMap(x => [x.dup, x.del]);
      check(t.every(x => x.h >= 39 && x.w >= x.tw + 9.9), `${width} px: ${t.length} targets ≥ 39 px tall and their text + 10 px wide (${t.map(x => `${x.w.toFixed(0)}×${x.h.toFixed(1)}`).slice(0, 2).join(', ')})`);
      check(t.every(x => x.inside && !x.covers) && m.rows.every(x => x.apart), `${width} px: every target inside its entry, over no heading, label or field, Duplicate and Delete apart`);
      check(t.every(x => x.above && x.below), `${width} px: 10 px above and below each link's text hits the link (${t.filter(x => !(x.above && x.below)).length} of ${t.length} miss)`);
      // real clicks in the grown area: Duplicate row 1 from above its text, Delete row 2 from below
      const count = () => p.page.locator(`${s.rows} ${s.entry}`).count();
      const n0 = await count(), d = m.rows[0].dup.t, x = m.rows[1].del.t;
      await p.page.mouse.click((d.l + d.r) / 2, d.t - 10); const n1 = await count();
      const x2 = (await measure(p, s)).rows[1].del.t; await p.page.mouse.click((x2.l + x2.r) / 2, x2.b + 10); const n2 = await count();
      check(n1 === n0 + 1 && n2 === n1 - 1, `${width} px: a click 10 px above Duplicate adds a row (${n0} → ${n1}), 10 px below Delete removes one (→ ${n2})`);
      check(!p.errors.length, `${width} px: 0 page errors (${p.errors.join('; ')})`);
      await p.close(); await q.close();
    }
  }
} finally { await browser.close(); await srv.close(); }
console.log(`\nS30-row-targets: ${fails.length ? fails.length + ' failing check(s)' : 'all green'}`);
process.exit(fails.length ? 1 : 0);
