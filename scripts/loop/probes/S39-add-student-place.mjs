// Probe (loop S39, pass H on index.html; all three pages): Add Student stays where it was clicked. The new row goes in
// above the button, so it went a row lower with every click and left a 1280 × 900 window from the third: a teacher
// adding 19 students scrolled 16-17 times (27-41 on an iPhone 13, 17 in mathsheet.io's frame). The earlier walkthroughs
// clicked through Playwright's `page.click`, which scrolls its target into view, and never saw it. Here a teacher who
// follows the button clicks it 19 times by mouse (or taps): per page, at 1280 × 900, on an iPhone 13, and in a 1,400 px
// frame under a 250 px header (mathsheet.io's shape, S15 / S36), with motion and with reduced motion in the frame:
// 19 rows added; after the first reach no wheel turn is needed; the button moves only while the page cannot scroll
// (1280: the first two clicks; the frame: until the roster fills it); by keyboard, Enter keeps focus on the button and
// the button in view; the roster after five clicks byte-identical to the page before the change; 0 page errors.
// Fails before the change (`--ref <commit before S39's fix>`).
//   node scripts/loop/probes/S39-add-student-place.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, devices, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const P = {
  'index.html': { btn: '#mwgAddStudentBtn', rows: '#mwgStudentsContainer', row: '.mwg-student-entry' },
  'math-minute.html': { btn: '#addStudentButton', rows: '#studentsContainer', row: '.student-entry' },
  'math-facts.html': { btn: '#addStudentButton', rows: '#studentsContainer', row: '.student-entry' },
};
const source = (file, ref) => ref ? execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8' }) : fs.readFileSync(path.join(ROOT, file), 'utf8');

async function open(browser, base, file, shape, body) {
  const opts = shape === 'iPhone 13' ? { ...devices['iPhone 13'] } : { viewport: { width: 1280, height: 900 } };
  if (shape === 'frame, reduced motion') opts.reducedMotion = 'reduce';
  const ctx = await browser.newContext(opts);
  const errors = [];
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.split('?')[0].endsWith('/' + file)) return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body });
    if (u.startsWith('http://parent.test/')) return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body:
      `<!doctype html><body style="margin:0"><div style="height:250px">header</div><iframe title="generator" src="${base}/${file}" style="display:block;width:100%;height:1400px;border:0"></iframe><div style="height:1200px"></div></body>` });
    if (u.startsWith(base)) return r.continue();
    return r.abort();
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(String(e.message || e)));
  let fr;
  if (shape.startsWith('frame')) { await page.goto('http://parent.test/'); fr = page.frames().find(f => f.url().endsWith(file)); }
  else { await page.goto(`${base}/${file}`); fr = page.mainFrame(); }
  await fr.waitForSelector(`${P[file].rows} ${P[file].row}`);
  return { ctx, page, fr, errors };
}

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(P)) {
    if (ONLY && ONLY !== file) continue;
    const u = P[file], body = source(file, REF);
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    for (const shape of ['1280 × 900', 'iPhone 13', 'frame', 'frame, reduced motion']) {
      const { ctx, page, fr, errors } = await open(browser, srv.base, file, shape, body);
      const winH = shape === 'iPhone 13' ? 664 : 900, settle = shape === 'frame' ? 700 : 80;
      const vis = async () => {
        const b = await (await fr.$(u.btn)).boundingBox();
        const inFrame = await fr.$eval(u.btn, el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
        return { b, ok: inFrame && b.y >= 0 && b.y + b.height <= winH };
      };
      const n0 = (await fr.$$(`${u.rows} ${u.row}`)).length;
      let reach = 0, later = 0, moved = 0;
      for (let i = 0; i < 19; i++) {
        let v = await vis(), guard = 0;
        while (!v.ok && guard++ < 40) {   // a wheel turn of 200 px toward the button, as a teacher scrolls
          await page.mouse.move(shape === 'iPhone 13' ? 195 : 640, 300); await page.mouse.wheel(0, v.b.y < 0 ? -200 : 200);
          if (i === 0) reach++; else later++;
          await page.waitForTimeout(80); v = await vis();
        }
        const x = v.b.x + v.b.width / 2, y = v.b.y + v.b.height / 2;
        if (shape === 'iPhone 13') await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
        await page.waitForTimeout(settle);
        const now = (await vis()).b;   // where it is now, against where it was clicked
        if (Math.abs(now.y + now.height / 2 - y) > 0.5) moved++;
      }
      const added = (await fr.$$(`${u.rows} ${u.row}`)).length - n0;
      const allowMoved = shape === '1280 × 900' ? 2 : shape.startsWith('frame') ? 4 : 0;
      check(added === 19, `${shape}: 19 clicks on the button add 19 rows (${added})`);
      check(later === 0, `${shape}: after the first reach (${reach} wheel turns) no wheel turn to find the button again (${later})`);
      check(moved <= allowMoved, `${shape}: the button moves under the pointer only while the page cannot scroll (${moved} of 19 clicks, at most ${allowMoved})`);
      check(errors.length === 0, `${shape}: 0 page errors (${errors.join('; ')})`);
      await ctx.close();
    }
    // keyboard: Enter on the focused button, 19 times
    {
      const { ctx, page, fr, errors } = await open(browser, srv.base, file, '1280 × 900', body);
      await fr.focus(u.btn);
      let out = 0, lost = 0;
      for (let i = 0; i < 19; i++) {
        await page.keyboard.press('Enter'); await page.waitForTimeout(80);
        const s = await page.evaluate(id => { const b = document.querySelector(id).getBoundingClientRect(); return { ok: b.top >= 0 && b.bottom <= innerHeight, focus: document.activeElement === document.querySelector(id) }; }, u.btn);
        if (!s.ok) out++; if (!s.focus) lost++;
      }
      const n = (await fr.$$(`${u.rows} ${u.row}`)).length;
      check(n === 22 && out === 0 && lost === 0, `keyboard: Enter ×19 makes 22 rows, the button in view after each (${19 - out} of 19) with focus kept (${19 - lost} of 19)`);
      check(errors.length === 0, `keyboard: 0 page errors (${errors.join('; ')})`);
      await ctx.close();
    }
    // the roster itself: five rows added, the same markup as the page before the change (Playwright's click scrolls)
    if (!REF) {
      const before = execSync(`git log -1 --format=%h -S"addStudentButton.getBoundingClientRect().top" -- math-facts.html`, { cwd: ROOT, encoding: 'utf8' }).trim();
      const base = before ? `${before}~1` : 'HEAD';
      const roster = async b => { const o = await open(browser, srv.base, file, '1280 × 900', b);
        await o.fr.fill(`${u.rows} input[name="studentNumber"] >> nth=2`, '3');
        for (let i = 0; i < 5; i++) await o.fr.click(u.btn);
        const h = await o.fr.$eval(u.rows, e => e.innerHTML); await o.ctx.close(); return h; };
      // math-minute's Level options as S49 writes them ("05 - 40 Addition" → "5 \u2013 40 Addition", approved), replayed into the
      // reference (S42's rule)
      const s49 = h => h.replace(/>(\d\d) - ([^<]*)<\/option>/g, (m, n, t) => '>' + Number(n) + ' \u2013 ' + t + '</option>');
      const a = s49(await roster(source(file, base))), b = await roster(body);
      check(a === b && a.length > 1000, `the roster after five clicks byte-identical to ${base}'s (${a.length} / ${b.length} chars; the numbers carry on from 3)`);
    }
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS39-add-student-place: ${fails.length} failing check(s)` : '\nS39-add-student-place: all green');
process.exit(fails.length ? 1 : 0);
