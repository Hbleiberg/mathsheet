// Probe (loop S19; the P2 from S18): a name still too long at the 11 px floor ends in a written "…", its end cut,
// never its start. Before, the "…" was CSS (`text-overflow`), which Save PDF's html2canvas does not draw, so the PDF
// cut the name mid-letter ("Alexandria Montgomery-Washington th", "…Washington" with "Jr" silently gone), and in an
// LTR line a Hebrew name's overflow is at the right, its start: print replaced the first name with "…" and the PDF
// cut it. Per page, sheets and keys: every floor name is the typed name's start plus "…", fits its box (nothing
// for a CSS ellipsis or a clip to take), keeps its first letter inside the box, and is the longest such start;
// names that fit keep their full text; the English control is unchanged. Save PDF draws the DOM's text, so these
// are what the PDF shows (proved on real cdnjs rasters in S19).
// Fails on the pages before the change (`--ref f9e7b6a`).
//   node scripts/loop/probes/S19-long-name.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const NAMES = ['Alexandria Montgomery-Washington the Third of Westchester', 'Bartholomew Montgomery-Washington Jr',
  'אלישבע רחל בת-שבע פרידמן-גולדשטיין הכהן מירושלים', 'Avi Cohen', 'יהושע אברהם בן-ציון פרידמן', 'אלישבע רחל בת-שבע פרידמן-גולדשטיין.'];
const FIT = new Set(NAMES.slice(3));   // these fit (18, ~15.5 and 11 px): untouched
const PAGE = {
  'index.html': { row: (n, i) => `${n}, ${i + 1}, add2, 30, 2;`, field: '.mwg-ws-header-main > .mwg-ws-field:first-child > .mwg-ws-field-value',
    sheet: '#mwgResults .mwg-worksheet, #mwgResults .mwg-answer-key-sheet' },
  'math-minute.html': { row: (n, i) => `${n}, ${i + 1}, 5;`, field: '.worksheet-header-main > .student-field:first-child > .student-field-value', sheet: '#results .worksheet' },
  'math-facts.html': { row: (n, i) => `${n}, ${i + 1}, +3;`, field: '.worksheet-header-main > .student-field:first-child > .student-field-value', sheet: '#results .worksheet' },
};

const srv = await serve(); const browser = await launch();
for (const file of Object.keys(PAGE)) {
  if (ONLY && ONLY !== file) continue;
  const s = PAGE[file];
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  const p = await openPage(browser, srv.base, file, { raw: true });
  const pg = p.page;
  if (REF) {
    const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
    await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
  }
  await pg.click(p.spec.modeToggle);
  await pg.check(p.spec.key);
  await pg.fill(p.spec.advanced, NAMES.map(s.row).join('\n'));
  await pg.click(p.spec.generate); await pg.waitForFunction(() => window.__prints > 0);
  const got = await pg.evaluate(({ field, sheet }) => {
    const ctx = document.createElement('canvas').getContext('2d');
    return [...document.querySelectorAll(sheet)].map(sh => {
      const f = sh.querySelector(field), cs = getComputedStyle(f), fb = f.getBoundingClientRect();
      const room = fb.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const walk = n => { if (n.nodeType === 3 && n.data) return n; for (const c of n.childNodes) { const t = walk(c); if (t) return t; } return null; };
      const node = walk(f), r = document.createRange();
      r.selectNodeContents(f); const all = r.getBoundingClientRect();
      r.setStart(node, 0); r.setEnd(node, 1); const first = r.getBoundingClientRect();
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      return { text: f.textContent, size: parseFloat(cs.fontSize), room, textW: all.width, clipped: f.scrollWidth > f.clientWidth + 0.5,
        firstIn: first.left >= fb.left - 0.5 && first.right <= fb.right - parseFloat(cs.paddingRight) + 0.5, fontSpec: ctx.font };
    });
  }, { field: s.field, sheet: s.sheet });
  const typed = got.length === NAMES.length * 2 ? [...NAMES, ...NAMES] : null;
  check(!!typed, `${got.length} sheets and keys read (${NAMES.length} names, key on)`);
  if (!typed) { await p.close(); continue; }
  for (const [i, x] of got.entries()) {
    const name = typed[i], where = `${i < NAMES.length ? 'sheet' : 'key'} ${(i % NAMES.length) + 1}`;
    const atFloor = x.size === 11 && x.text !== name;
    if (FIT.has(name)) {
      check(x.text === name && !x.clipped, `${where}: "${name}" fits and keeps its full text (${x.size} px)`);
      continue;
    }
    check(atFloor && x.text.endsWith('…') && name.startsWith(x.text.slice(0, -1)) && x.text.length > 12,
      `${where}: "${name.slice(0, 24)}…" at 11 px is its start plus "…" ("${x.text}")`);
    check(!x.clipped && x.textW <= x.room + 0.5, `${where}: the cut name fits its box (${x.textW.toFixed(1)} / ${x.room.toFixed(1)} px), nothing for an ellipsis or a clip to take`);
    check(x.firstIn, `${where}: its first letter ("${name[0]}") sits inside the box`);
    // the longest start: one more character (a space skipped) and "…" would overflow
    const kept = x.text.slice(0, -1), more = name.slice(0, name.indexOf(kept) + kept.length + (name[kept.length] === ' ' ? 2 : 1)).trimEnd() + '…';
    const w = await pg.evaluate(([font, t]) => { const c = document.createElement('canvas').getContext('2d'); c.font = font; return c.measureText(t).width; }, [x.fontSpec, more]);
    check(w > x.room - 1, `${where}: one more letter would not fit ("${more.slice(-6)}" ${w.toFixed(1)} px of ${(x.room - 1).toFixed(1)})`);
  }
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS19-long-name: ${fails.length} failing check(s)` : '\nS19-long-name: all green');
process.exit(fails.length ? 1 : 0);
