// Probe (loop S38; found S30, pass C): a field the validation box marks red keeps its size. The mark is a 2 px border
// on a 1 px field, so a marked Level (index: Grade, Type, Count) was 2 px taller, the rows under it moved down 2 px,
// and back once it was filled. The mark now takes the pixel from the padding (8 → 7 px): per page, on a fresh roster
// at 1280 px and on an iPhone 13, Generate & Print marks every empty field; each marked field is still 2 px of
// rgb(204, 0, 0), as tall and wide as before it was marked, its text where it was (border + padding); every row and
// the buttons under the roster stay where they were; Fix still focuses the first marked field; a field filled in loses
// both the mark and the padding, so it is the unmarked field again. Fails before the change (`--ref 987a5c9`).
//   node scripts/loop/probes/S38-marked-field.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, devices, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const P = {
  'index.html': { fields: 'select[name="grade"], select[name="problemType"], select[name="count"]', fix: '#mwgValidationFix', gen: '#mwgGenerateBtn', below: '#mwgAddStudentBtn' },
  'math-minute.html': { fields: 'select[name="level"]', fix: '#mmValidationFix', gen: '#generatePrintButton', below: '#addStudentButton' },
  'math-facts.html': { fields: 'select[name="level"]', fix: '#mmValidationFix', gen: '#generatePrintButton', below: '#addStudentButton' },
};
const measure = (page, sel, below) => page.evaluate(([sel, below]) => {
  const rows = [...document.querySelectorAll('#mwgStudentsContainer .mwg-student-entry, #studentsContainer .student-entry')];
  return {
    rows: rows.map(r => r.getBoundingClientRect().top + scrollY),
    below: document.querySelector(below).getBoundingClientRect().top + scrollY,
    fields: [...document.querySelectorAll(sel)].filter(f => f.closest('.mwg-student-entry, .student-entry')).map(f => {
      const b = f.getBoundingClientRect(), cs = getComputedStyle(f);
      return { h: b.height, w: b.width, inset: parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop), insetL: parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft),
        border: cs.borderTopWidth + ' ' + cs.borderTopColor, inline: f.getAttribute('style') || '', marked: /204, 0, 0/.test(f.style.border) };
    }),
  };
}, [sel, below]);

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(P)) {
    if (ONLY && ONLY !== file) continue;
    const u = P[file];
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    for (const [shape, dev] of [['1280 px', { viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }], ['iPhone 13', { ...devices['iPhone 13'], reducedMotion: 'reduce' }]]) {
      const p = await openPage(browser, srv.base, file, { raw: true, device: dev });
      const { page } = p;
      if (REF) { const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
        await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
        await page.reload({ waitUntil: 'load' }); await page.waitForSelector('#mwgStudentsContainer .mwg-student-entry, #studentsContainer .student-entry'); }
      const a = await measure(page, u.fields, u.below);
      await page.click(u.gen); await page.waitForTimeout(150);
      const b = await measure(page, u.fields, u.below);
      const marked = b.fields.filter(f => f.marked);
      check(a.fields.length >= 3 && marked.length === b.fields.length, `${shape}: Generate marks all ${b.fields.length} empty fields (${marked.length})`);
      check(marked.every(f => f.border === '2px rgb(204, 0, 0)'), `${shape}: each mark still 2 px of rgb(204, 0, 0) (${[...new Set(b.fields.map(f => f.border))].join(', ')})`);
      const grew = b.fields.filter((f, i) => Math.abs(f.h - a.fields[i].h) > 0.25 || Math.abs(f.w - a.fields[i].w) > 0.25);
      check(grew.length === 0, `${shape}: every marked field as tall and wide as before (${a.fields[0].h} → ${b.fields[0].h} px; ${grew.length} changed)`);
      const moved = b.fields.filter((f, i) => Math.abs(f.inset - a.fields[i].inset) > 0.25 || Math.abs(f.insetL - a.fields[i].insetL) > 0.25);
      check(moved.length === 0, `${shape}: each field's text where it was (border + padding ${a.fields[0].inset} → ${b.fields[0].inset} px)`);
      const shift = Math.max(...b.rows.map((t, i) => Math.abs(t - a.rows[i])), Math.abs(b.below - a.below));
      check(shift < 0.25, `${shape}: the rows and the buttons under them stay put (moved ${shift.toFixed(2)} px)`);
      // Fix: the first marked field takes focus
      await page.click(u.fix); await page.waitForTimeout(100);
      const focus = await page.evaluate(sel => { const f = [...document.querySelectorAll(sel)][0]; return document.activeElement === f; }, u.fields);
      check(focus, `${shape}: Fix focuses the first marked field`);
      // fill the first field: its mark and its padding go, it is the unmarked field again
      await page.evaluate(sel => { const f = document.querySelector(sel); f.value = [...f.options].find(o => o.value).value; f.dispatchEvent(new Event('change', { bubbles: true })); }, u.fields.split(',')[0]);
      const c = await measure(page, u.fields, u.below);
      const first = c.fields[0];
      check(!first.marked && !/padding/.test(first.inline) && Math.abs(first.h - a.fields[0].h) < 0.25 && first.inset === a.fields[0].inset, `${shape}: a field filled in loses the mark and the padding (style "${first.inline}", ${first.h} px)`);
      check(p.errors.length === 0, `${shape}: 0 page errors (${p.errors.join('; ')})`);
      await p.close();
    }
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS38-marked-field: ${fails.length} failing check(s)` : '\nS38-marked-field: all green');
process.exit(fails.length ? 1 : 0);
