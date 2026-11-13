// Probe (loop S47; found S46, pass G on index.html): the printed descriptions of index.html's Subtraction Levels 3-5 write
// the minus sign U+2212, "Subtraction Level 3 (2-digit − 1-digit)", as the page's own menu and every problem do; they
// wrote a hyphen, "(2-digit - 1-digit)". One student per level code (add1-div5) at grade 5, the key on, Math.random
// seeded, by real clicks in the Advanced box:
//   - 20 sheets and 20 keys, each under its level's description (the handle resolves);
//   - every description that names its operation's numbers writes that operation's own sign (+ − × ÷), none a hyphen
//     between spaces;
//   - `--identity`: every sheet and key byte-identical to the page before the change once the three descriptions' sign
//     is read back as a hyphen (decays with later approved changes to the sheets: S23's rule);
//   - 0 page errors.
// Fails before the change (`--ref <commit>`).
//   node scripts/loop/probes/S47-sub-minus.mjs [--ref <commit>] [--identity]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), IDENTITY = process.argv.includes('--identity');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const SEED = () => { let s = 20261113; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };
const OPS = { add: '+', sub: '−', mul: '×', div: '÷' };
const CODES = Object.keys(OPS).flatMap(o => [1, 2, 3, 4, 5].map(k => o + k));
// before the change: the commit before the one that wrote U+2212 into sub3's label, or HEAD while uncommitted
const fixAt = execSync('git log -1 --format=%h -S"Subtraction Level 3 (2-digit \\u2212 1-digit)" -- index.html', { cwd: ROOT, encoding: 'utf8' }).trim();
const BEFORE = fixAt ? `${fixAt}~1` : 'HEAD';

async function run(browser, base, ref) {
  const p = await openPage(browser, base, 'index.html');
  const pg = p.page;
  await p.context.addInitScript(SEED);
  if (ref) {
    const body = execSync(`git show ${ref}:index.html`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
    await pg.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  if (!(await pg.$eval('#mwgAnswerKeyToggle', e => e.checked))) await pg.click('#mwgAnswerKeyToggle');
  await pg.click('#mwgToggleModeBtn');
  await pg.fill('#mwgAdvancedBox', CODES.map((c, i) => `Noa ${c}, ${i + 1}, ${c}, 30, 5;`).join('\n'));
  const before = await p.prints();
  await pg.click('#mwgGenerateBtn');
  await pg.waitForFunction(n => window.__prints > n, before, { timeout: 30000 });
  const out = await pg.evaluate(() => {
    const read = sel => [...document.querySelectorAll(sel)].map(s => ({ html: s.outerHTML,
      desc: (s.querySelector('.mwg-ws-desc-text') || { textContent: '' }).textContent.trim() }));
    return { sheets: read('#mwgResults .mwg-worksheet:not(.mwg-answer-key-sheet)'), keys: read('#mwgResults .mwg-answer-key-sheet') };
  });
  out.errors = p.errors.slice(); await p.close(); return out;
}

const srv = await serve(); const browser = await launch();
try {
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}; before the change: ${BEFORE}`);
  const now = await run(browser, srv.base, REF);
  check(now.sheets.length === CODES.length && now.keys.length === CODES.length && now.sheets.every(s => s.desc),
    `${now.sheets.length} sheets and ${now.keys.length} keys, each with a description`);
  for (const [what, list] of [['sheet', now.sheets], ['key', now.keys]]) {
    const off = [];
    list.forEach((s, i) => { const code = CODES[i], sign = OPS[code.slice(0, 3)], level = +code[3];
      const named = /\d-digit/.test(s.desc);   // Levels 3-5 name their numbers ("2-digit + 1-digit")
      if (!s.desc.includes(`Level ${level}`) || / - /.test(s.desc) || (named && !s.desc.includes(` ${sign} `))) off.push(`${code}: "${s.desc}"`); });
    check(off.length === 0, `every ${what} description writes its operation's own sign, never a hyphen (${off.length} off: ${off.slice(0, 3).join(' | ')})`);
  }
  const sub3 = now.sheets[CODES.indexOf('sub3')];
  check(sub3 && sub3.desc === '30 Subtraction Level 3 (2-digit − 1-digit) — Grade 5', `sub3 reads "${sub3 && sub3.desc}"`);
  check(now.errors.length === 0, `0 page errors (${now.errors.join('; ')})`);
  if (IDENTITY && !REF) {
    const old = await run(browser, srv.base, BEFORE);
    // the minus is wider than a hyphen (Arial 0.584 em, 0.333), so a key's long description ("ANSWER KEY — 30
    // Subtraction Level 3 (2-digit − 1-digit) — Grade 5") may be fitted half a pixel smaller by fitLongDescriptions (S22)
    const back = h => h.replace(/(\d-digit) − (1-digit|2-digit|any)\)/g, '$1 - $2)');
    const unfit = h => h.replace(/(<span class="mwg-ws-desc-text")[^>]*>/, '$1>');
    const ALL = [...now.sheets, ...now.keys], OLD = [...old.sheets, ...old.keys];
    const changed = ALL.filter((s, i) => s.html !== (OLD[i] || {}).html).length;
    const differ = ALL.filter((s, i) => unfit(back(s.html)) !== unfit((OLD[i] || {}).html || '')).length;
    const refit = ALL.map((s, i) => back(s.html) !== (OLD[i] || {}).html ? `${s.desc}: ${(OLD[i].html.match(/font-size: ([\d.]+)px/) || [, 'none'])[1]} → ${(s.html.match(/font-size: ([\d.]+)px/) || [, 'none'])[1]} px` : null).filter(Boolean);
    check(differ === 0 && changed === 6 && refit.every(r => /^ANSWER KEY — 30 Subtraction Level [345] /.test(r)),
      `--identity: every sheet and key byte-identical to ${BEFORE}'s but the sign (${changed} changed: sub3-5's sheets and keys; ${differ} differ otherwise; ${refit.length} key description fitted anew: ${refit.join(' | ')})`);
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS47-sub-minus: ${fails.length} failing check(s)` : '\nS47-sub-minus: all green');
process.exit(fails.length ? 1 : 0);
