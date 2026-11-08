// Probe (loop S22; found S4, pass B on index.html; approved S4 at gate 6): a long description ran under "Worksheet 3 of
// 5" and a key's "(Key 3 of 5)" was cut by its box — 1,055 of 1,510 descriptions with 5 copies and keys. Every grade ×
// type the form offers, Math.random seeded, in three shapes (5 copies with keys; 1 copy with a key; 5 copies with the
// Number removed). Under print (the page's move to body): every description's text ends inside its own room, before
// the set label and the branding tag, at 9 px or more; one that fits carries no style (with the Number removed the
// column is as wide as its text: none changes); every header, problem cell and answer sits exactly where it sat before the change (against 3589e48, the same seed). Save PDF (the two cdnjs
// libraries stubbed): every clone's description fits too. Fails before the change (`--ref 3589e48`).
//   node scripts/loop/probes/S22-desc-fit.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), BASE = '3589e48';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const FILE = 'index.html';
const SEED = `(() => { let s = 20221122; Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();`;
const SHAPES = [
  { name: '5 copies with keys', copies: '5', key: true, removeNumber: false },
  { name: '1 copy with a key', copies: '1', key: true, removeNumber: false },
  { name: '5 copies, the Number removed', copies: '5', key: false, removeNumber: true },
];
// Each description: its text's ink box against its own room and its next sibling (the set label or the branding tag).
const MEASURE = `(() => [...document.querySelectorAll('.mwg-ws-desc-text')].map(t => {
  const range = document.createRange(); range.selectNodeContents(t);
  const ink = range.getBoundingClientRect(), room = t.getBoundingClientRect(), next = t.nextElementSibling.getBoundingClientRect();
  const box = t.parentNode.getBoundingClientRect(), pad = parseFloat(getComputedStyle(t.parentNode).paddingRight);
  return { text: t.textContent, over: ink.right - Math.min(room.right, next.left, box.right - pad), size: parseFloat(getComputedStyle(t).fontSize), styled: t.hasAttribute('style') };
}))()`;
const GEOMETRY = `(() => [...document.querySelectorAll('.mwg-worksheet, .mwg-answer-key-sheet')].map(s => {
  const o = s.getBoundingClientRect();
  const at = el => { const r = el.getBoundingClientRect(); return [r.left - o.left, r.top - o.top, r.width, r.height].map(v => Math.round(v * 10) / 10).join(','); };
  return [at(s.querySelector('.mwg-ws-header')), ...[...s.querySelectorAll('.mwg-ws-field-value, .mwg-ws-set-label, .mwg-problems-grid > *, .mwg-horiz-grid > *')].map(at)].join(';');
}))()`;

const srv = await serve(); const browser = await launch();
async function open(ref) {
  const p = await openPage(browser, srv.base, FILE, { raw: true });
  await p.context.addInitScript(SEED);
  if (ref) {
    const body = execSync(`git show ${ref}:${FILE}`, { cwd: ROOT, encoding: 'utf8' });
    await p.page.route(new RegExp(`/${FILE.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  return p;
}
// every grade × type the Standard form offers, as Advanced lines
const probe = await open(null);
const combos = await probe.page.evaluate(async () => {
  const row = document.querySelector('#mwgStudentsContainer .mwg-student-entry');
  const g = row.querySelector('select[name="grade"]'), t = row.querySelector('select[name="problemType"]'), out = [];
  for (const go of [...g.options].filter(o => o.value)) {
    g.value = go.value; g.dispatchEvent(new Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 0));
    for (const to of [...t.options].filter(o => o.value)) out.push(`S${out.length}, ${out.length}, ${to.value}, 30, ${go.value}`);
  }
  return out;
});
await probe.close();
console.log(`${FILE}${REF ? ` (served from ${REF})` : ''}: ${combos.length} grade × type combinations`);

async function run(ref, shape, lines) {
  const p = await open(ref), pg = p.page;
  await pg.click(p.spec.modeToggle);
  await pg.selectOption(p.spec.perStudent, shape.copies);
  await pg.setChecked(p.spec.key, shape.key);
  await pg.setChecked('#mwgRemoveNumberToggle', shape.removeNumber);
  await pg.fill(p.spec.advanced, lines.join('\n'));
  const t0 = Date.now();
  await pg.click(p.spec.generate); await pg.waitForFunction(() => window.__prints > 0, null, { timeout: 60000 });
  const ms = Date.now() - t0;
  await pg.emulateMedia({ media: 'print' });
  await pg.evaluate(({ results, printId }) => { const r = document.querySelector(results); r.id = printId; document.body.appendChild(r); }, { results: p.spec.results, printId: p.spec.printId });
  const descs = await pg.evaluate(MEASURE), geometry = await pg.evaluate(GEOMETRY);
  const errors = p.errors.slice(); await p.close();
  return { descs, geometry, ms, errors };
}
for (const shape of SHAPES) {
  console.log(` ${shape.name}`);
  const now = await run(REF, shape, combos), was = await run(BASE, shape, combos);
  const over = now.descs.filter(d => d.over > 0.5), wasOver = was.descs.filter(d => d.over > 0.5);
  console.log(`    ${now.descs.length} descriptions; ${wasOver.length} ran past their room before; generate ${now.ms} ms (before ${was.ms} ms)`);
  check(now.descs.length > 150, `descriptions measured (${now.descs.length})`);
  check(over.length === 0, `every description ends inside its room, before the set label and the tag (${over.length} past it${over.length ? ': "' + over[0].text + '" +' + over[0].over.toFixed(1) + ' px' : ''})`);
  const sizes = now.descs.map(d => d.size);
  check(Math.min(...sizes) >= 9, `none under 9 px (smallest ${Math.min(...sizes)} px; ${now.descs.filter(d => d.size < 13).length} shrunk)`);
  check(now.descs.every(d => d.styled === (d.size < 13)), `only a shrunk description carries a style (${now.descs.filter(d => d.styled && d.size >= 13).length} styled at 13 px)`);
  const moved = now.geometry.filter((g, i) => g !== was.geometry[i]).length;
  check(now.geometry.length === was.geometry.length && moved === 0, `every header, field, set label and problem where it was (${moved} of ${now.geometry.length} sheets differ)`);
  check(now.errors.length === 0, `0 page errors (${now.errors.join('; ')})`);
}

// Save PDF: what the html2canvas stub is handed
const H2C_STUB = `window.html2canvas = function (clone) {
  var out = [].map.call(clone.querySelectorAll('.mwg-ws-desc-text'), function (t) {
    var range = document.createRange(); range.selectNodeContents(t);
    var ink = range.getBoundingClientRect(), room = t.getBoundingClientRect(), next = t.nextElementSibling.getBoundingClientRect();
    return ink.right - Math.min(room.right, next.left); });
  (window.__clones = window.__clones || []).push(out);
  var cv = document.createElement('canvas'); cv.width = 4; cv.height = 4; return Promise.resolve(cv); };`;
const JSPDF_STUB = `window.jspdf = { jsPDF: function () { return { addPage: function () {}, addImage: function () {}, save: function () { window.__pdfSaved = 1; } }; } };`;
console.log(' Save PDF, 5 copies with keys (the longest descriptions)');
{
  const p = await open(REF), pg = p.page;
  await pg.route(/cdnjs\.cloudflare\.com\/.*html2canvas/, r => r.fulfill({ contentType: 'text/javascript', body: H2C_STUB }));
  await pg.route(/cdnjs\.cloudflare\.com\/.*jspdf/, r => r.fulfill({ contentType: 'text/javascript', body: JSPDF_STUB }));
  await pg.click(p.spec.modeToggle); await pg.selectOption(p.spec.perStudent, '5'); await pg.setChecked(p.spec.key, true);
  await pg.fill(p.spec.advanced, 'A, 1, div4, 30, 5;\nB, 2, div4, 30, 6;\nC, 3, rounding, 30, 5;');
  await pg.click(p.spec.pdf); await pg.waitForFunction(() => window.__pdfSaved, null, { timeout: 60000 });
  const clones = await pg.evaluate(() => window.__clones);
  const over = clones.flat().filter(v => v > 0.5).length;
  check(clones.length === 30, `30 pages captured (${clones.length})`);
  check(over === 0, `every page's description fits in the PDF (${over} of ${clones.flat().length} past their room)`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS22-desc-fit: ${fails.length} failing check(s)` : '\nS22-desc-fit: all green');
process.exit(fails.length ? 1 : 0);
