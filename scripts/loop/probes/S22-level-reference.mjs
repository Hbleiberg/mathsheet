// Probe (loop S22, pass D on math-minute.html): the Level Reference shows two columns, levels 1–11 and 12–21, but was
// written row by row, so a screen reader read it 1, 12, 2, 13, … 10, 21, 11. In the Advanced view, at 1280, 800 and
// 390 px: the accessibility tree reads the 21 levels in order, each text as before; every item sits exactly where it sat
// before the change (geometry against 7dbcdb9) and the card's pixels are identical. Fails before the change
// (`--ref 7dbcdb9`, the order checks).
//   node scripts/loop/probes/S22-level-reference.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), BASE = '7dbcdb9';
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const FILE = 'math-minute.html';

const srv = await serve(); const browser = await launch();
async function view(ref, width) {
  const p = await openPage(browser, srv.base, FILE, { raw: true, viewport: { width, height: 900 } });
  const pg = p.page;
  if (ref) {
    const body = execSync(`git show ${ref}:${FILE}`, { cwd: ROOT, encoding: 'utf8' });
    await pg.route(new RegExp(`/${FILE.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  }
  await pg.click(p.spec.modeToggle);
  const items = await pg.$$eval('#levelReferenceGrid .level-reference-item', els => els.map(e => {
    const r = e.getBoundingClientRect(), g = e.parentElement.getBoundingClientRect();
    return { text: e.textContent, x: r.left - g.left, y: r.top - g.top, w: r.width, h: r.height };
  }));
  const cdp = await pg.context().newCDPSession(pg);
  await cdp.send('Accessibility.enable');
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const read = nodes.filter(n => !n.ignored && n.role && n.role.value === 'StaticText' && /^\d+ – /.test((n.name && n.name.value) || '')).map(n => n.name.value);
  await cdp.detach();
  const shot = await pg.locator('.level-reference-card').screenshot();
  const errors = p.errors.slice();
  await p.close();
  return { items, read, shot, errors };
}

console.log(`${FILE}${REF ? ` (served from ${REF})` : ''}`);
for (const width of [1280, 800, 390]) {
  console.log(` ${width} px`);
  const now = await view(REF, width), was = await view(BASE, width);
  const num = t => parseInt(t, 10);
  check(now.items.length === 21, `21 levels listed (${now.items.length})`);
  check(now.items.map(i => num(i.text)).join() === Array.from({ length: 21 }, (_, i) => i + 1).join(), `written in order 1…21 (${now.items.map(i => num(i.text)).join(',')})`);
  check(now.read.map(num).join() === Array.from({ length: 21 }, (_, i) => i + 1).join(), `the accessibility tree reads 1…21 (${now.read.map(num).join(',')})`);
  const byText = new Map(was.items.map(i => [i.text, i]));
  const moved = now.items.filter(i => { const b = byText.get(i.text); return !b || Math.abs(b.x - i.x) > 0.5 || Math.abs(b.y - i.y) > 0.5 || Math.abs(b.w - i.w) > 0.5 || Math.abs(b.h - i.h) > 0.5; });
  check(moved.length === 0, `every level's text and box as before (${moved.length} differ${moved.length ? ': ' + moved.slice(0, 3).map(m => m.text).join('; ') : ''})`);
  check(now.shot.equals(was.shot), `the card's pixels identical (${now.shot.length} / ${was.shot.length} bytes)`);
  check(now.items.filter(i => i.x < 1).length === 11, `11 levels in the first column (${now.items.filter(i => i.x < 1).length})`);
  check(now.errors.length === 0, `0 page errors (${now.errors.join('; ')})`);
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS22-level-reference: ${fails.length} failing check(s)` : '\nS22-level-reference: all green');
process.exit(fails.length ? 1 : 0);
