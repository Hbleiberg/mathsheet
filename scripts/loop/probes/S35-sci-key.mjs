// Probe (loop S35; found S6, pass G): index.html's Scientific Notation key writes its answer in the sheet's own notation.
// The sheet asks "460,000 = ? \u00d7 10<sup>?</sup>" (and "4.6 \u00d7 10<sup>5</sup> ="), but the key answered "4.6 x 10^5": an
// ASCII x and a caret where the sheet has the times sign and a raised power. Grade 8, Math.random seeded, 6 sheets with
// their keys by real clicks: every key answer to a "? \u00d7 10?" problem reads coefficient, U+00D7, "10" and a <sup> exponent,
// with no "x" or "^"; its value equals the sheet's number and the coefficient is 1 to under 10; the other direction
// still answers the whole number ("460,000"); the key's problems are the sheet's own. Fails before (`--ref febeb65`).
//   node scripts/loop/probes/S35-sci-key.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const TIMES = String.fromCharCode(0xd7);
const SEED = () => { let s = 20261113; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

const srv = await serve(); const browser = await launch();
try {
  const p = await openPage(browser, srv.base, 'index.html');
  const pg = p.page;
  await p.context.addInitScript(SEED);
  if (REF) {
    const body = execSync(`git show ${REF}:index.html`, { cwd: ROOT, encoding: 'utf8' });
    await pg.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  }
  console.log(`index.html${REF ? ` (served from ${REF})` : ''}`);
  await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector('#mwgStudentsContainer .mwg-student-entry', { state: 'attached' });
  await pg.selectOption('#mwgWorksheetsPerStudent', '3');
  if (!(await pg.$eval('#mwgAnswerKeyToggle', e => e.checked))) await pg.click('#mwgAnswerKeyToggle');
  await pg.click('#mwgToggleModeBtn');
  await pg.fill('#mwgAdvancedBox', 'Noa, 1, scientificnotation, 30, 8;\nAvi, 2, scientificnotation, 30, 8;');
  const before = await p.prints();
  await pg.click('#mwgGenerateBtn');
  await pg.waitForFunction(n => window.__prints > n, before, { timeout: 30000 }).catch(() => {});
  const got = await pg.evaluate(() => {
    const canon = el => { let s = ''; for (const n of el.childNodes) s += n.nodeType === 3 ? n.textContent : n.tagName === 'SUP' ? '^' + n.textContent : canon(n); return s.replace(/\s+/g, ' ').trim(); };
    const sheet = [...document.querySelectorAll('#mwgResults .mwg-worksheet .mwg-horiz-problem')].map(canon);
    const key = [...document.querySelectorAll('#mwgResults .mwg-answer-key-sheet .mwg-horiz-cell')].map(c => {
      const a = c.lastElementChild, sup = a.querySelector('sup');
      return { q: canon(c.querySelector('.mwg-horiz-problem')), a: canon(a), text: a.textContent, sup: sup ? sup.textContent : null,
        raised: sup ? getComputedStyle(sup).verticalAlign === 'super' && parseFloat(getComputedStyle(sup).fontSize) < parseFloat(getComputedStyle(a).fontSize) : false };
    });
    return { sheet, key };
  });
  check(got.sheet.length === 180 && got.key.length === 180, `${got.sheet.length} problems on 6 sheets, ${got.key.length} on the keys`);
  check(JSON.stringify(got.key.map(k => k.q)) === JSON.stringify(got.sheet), 'the key\'s problems are the sheet\'s own, in order');
  const ask = got.key.filter(k => /\? \u00d7 10\^\?/.test(k.q)), back = got.key.filter(k => !/\?/.test(k.q));
  check(ask.length > 40 && back.length > 40, `both directions present (${ask.length} "? ${TIMES} 10?", ${back.length} "${TIMES} 10\u207f =")`);
  const badForm = ask.filter(k => !/^\d\.\d \u00d7 10\^\d$/.test(k.a) || /[x^]/.test(k.text) || !k.raised);
  check(badForm.length === 0, `every "?" answer reads "c ${TIMES} 10" with a raised <sup> power, no x or caret (${badForm.slice(0, 2).map(k => JSON.stringify(k.text)).join(', ')})`);
  const badValue = ask.filter(k => {
    const m = k.a.match(/^(\d\.\d) \u00d7 10\^(\d)$/), v = +k.q.match(/^([\d,]+) =/)[1].replace(/,/g, '');
    return !m || +m[1] < 1 || +m[1] >= 10 || Math.round(+m[1] * 10 ** +m[2]) !== v;
  });
  check(badValue.length === 0, `every "?" answer equals the sheet's number, coefficient 1 to under 10 (${badValue.slice(0, 2).map(k => k.q + ' ' + k.a).join('; ')})`);
  const badBack = back.filter(k => { const m = k.q.match(/^(\d\.\d) \u00d7 10\^(\d) =$/); return !m || k.a !== Math.round(+m[1] * 10 ** +m[2]).toLocaleString('en-US'); });
  check(badBack.length === 0, `the other direction still answers the whole number (${badBack.slice(0, 2).map(k => k.q + ' ' + k.a).join('; ')})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS35-sci-key: ${fails.length} failing check(s)` : '\nS35-sci-key: all green');
process.exit(fails.length ? 1 : 0);
