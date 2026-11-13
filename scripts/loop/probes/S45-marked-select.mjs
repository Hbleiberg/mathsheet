// Probe (loop S45, pass C; found S30): a select the validation box marks red keeps a white fill. An author border drops
// a select's native look, and Chromium painted the marked Level (index: Grade, Type, Count) grey, rgb(239,239,239),
// beside the white fields around it. Per page, on a fresh roster whose selects are empty, Generate & Print:
//   - every marked select has its 2 px red border (what Fix and the clears read) and is painted white inside, as an
//     unmarked select is, at its own size (S38);
//   - picking a value clears the mark and every style it set: the select painted as native again;
//   - Generate Anyway clears every mark the same way.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S45-marked-select.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const REF = (i => i > 0 ? process.argv[i + 1] : null)(process.argv.indexOf('--ref'));
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const PAGES = {
  'index.html': { gen: '#mwgGenerateBtn', anyway: '#mwgValidationGenerate', box: '#mwgValidationBox', sel: '#mwgStudentsContainer select', entry: '#mwgStudentsContainer .mwg-student-entry' },
  'math-minute.html': { gen: '#generatePrintButton', anyway: '#mmValidationGenerate', box: '#mmValidationBox', sel: '#studentsContainer select[name="level"]', entry: '#studentsContainer .student-entry' },
  'math-facts.html': { gen: '#generatePrintButton', anyway: '#mmValidationGenerate', box: '#mmValidationBox', sel: '#studentsContainer select[name="level"]', entry: '#studentsContainer .student-entry' },
};
// the painted fill: the select's own pixels left of its arrow, at mid-height
async function fill(page, loc) {
  const png = await loc.screenshot();
  return page.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(img.width - 60, img.height >> 1, 1, 1).data; return `${d[0]},${d[1]},${d[2]}`;
  }, png.toString('base64'));
}
const srv = await serve(); const browser = await launch();
try {
  for (const [file, s] of Object.entries(PAGES)) {
    const p = await openPage(browser, srv.base, file, { raw: true });
    const { page } = p;
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
      await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await page.reload({ waitUntil: 'load' });
    }
    await page.waitForSelector(s.entry, { state: 'attached' });
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const sels = page.locator(s.sel);
    const n = await sels.count();
    const native = await fill(page, sels.first()), size0 = await sels.first().boundingBox();
    await page.click(s.gen); await page.waitForSelector(s.box, { state: 'visible' });
    const marked = await page.evaluate(sel => [...document.querySelectorAll(sel)].map((e, i) => /rgb\(204,\s*0,\s*0\)/.test(e.style.border) ? i : -1).filter(i => i >= 0), s.sel);
    check(marked.length >= 3, `${marked.length} empty selects marked red (of ${n})`);
    const fills = []; for (const i of marked) fills.push(await fill(page, sels.nth(i)));
    const grey = fills.filter(f => f !== '255,255,255');
    check(native === '255,255,255' && grey.length === 0, `every marked select painted white inside, as an unmarked one (${native}) is (${grey.length ? grey.join(' / ') : 'all 255,255,255'})`);
    const size1 = await sels.nth(marked[0]).boundingBox();
    check(Math.abs(size1.height - size0.height) < 0.25 && Math.abs(size1.width - size0.width) < 0.25, `the marked select keeps its size (${size0.width.toFixed(1)} × ${size0.height.toFixed(1)} → ${size1.width.toFixed(1)} × ${size1.height.toFixed(1)})`);
    // pick a value in the first marked select
    const first = sels.nth(marked[0]);
    const val = await first.evaluate(e => [...e.options].find(o => o.value).value);
    await first.selectOption(val);
    const st = await first.evaluate(e => [e.style.border, e.style.padding, e.style.backgroundColor].join('|'));
    check(st === '||', `a value picked clears the mark and what it set (border | padding | fill: "${st}")`);
    check(await fill(page, first) === native, 'the picked select painted as native again');
    await page.click(s.anyway);
    const left = await page.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => e.style.border || e.style.padding || e.style.backgroundColor).length, s.sel);
    check(left === 0, `Generate Anyway clears every mark and its fill (${left} left)`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS45-marked-select: ${fails.length} failing check(s)` : '\nS45-marked-select: all green');
process.exit(fails.length ? 1 : 0);
