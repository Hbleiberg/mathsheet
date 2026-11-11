// Probe (loop S34; found S32, pass E): an invisible mark in a selector field skipped the line. Text copied from a phone
// or a Hebrew document can carry LRM / RLM, an embedding or isolate, a zero-width space or joiner, a word joiner or a
// BOM; in the Advanced box's level (index: its type, count or grade) any of them made a line that looks right
// "invalid" ("Entry 5 has an invalid level (must be 1-21): "S05, 1, 5""). Per page, 17 marks before, after and around
// each selector field, one line each (index 153, the twins 51), pasted by real clicks and generated with Math.random
// seeded: every line prints, nothing is reported, and the sheets are byte-identical to the same paste without the marks;
// a name keeps its own (ZWNJ is part of some names: "Mehr" ZWNJ "dad"); a wrong selector behind a mark is still reported.
// Fails before the change (`--ref 3d12adb`).
//   node scripts/loop/probes/S34-selector-marks.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const MARKS = [0x200E, 0x200F, 0x061C, 0x202A, 0x202B, 0x202C, 0x202D, 0x202E, 0x2066, 0x2067, 0x2068, 0x2069,
  0x200B, 0x200C, 0x200D, 0x2060, 0xFEFF].map(c => String.fromCharCode(c));
const ZWNJ = String.fromCharCode(0x200C);
const SEL = {   // the selector fields after Name and Number, and a wrong one
  'index.html':       { fields: ['add2', '30', '2'], wrong: ['zz', '30', '2'], results: '#mwgResults', errors: '#mwgErrors' },
  'math-minute.html': { fields: ['5'], wrong: ['99'], results: '#results', errors: '#errors' },
  'math-facts.html':  { fields: ['+3'], wrong: ['+99'], results: '#results', errors: '#errors' },
};
const SEED = () => { let s = 20261111; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

const srv = await serve(); const browser = await launch();
try {
  for (const file of Object.keys(SEL)) {
    if (ONLY && ONLY !== file) continue;
    const sel = SEL[file];
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
    const p = await openPage(browser, srv.base, file);
    const pg = p.page;
    await p.context.addInitScript(SEED);
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    }
    // clean and marked lines, one per mark × place × field; the ZWNJ name line in both
    const clean = [], marked = [];
    let k = 0;
    for (const m of MARKS) for (const place of ['before', 'after', 'around']) for (let f = 0; f < sel.fields.length; f++) {
      k++;
      const fields = sel.fields.slice(), v = fields[f];
      clean.push([`S${k}`, String(k), ...fields].join(', '));
      fields[f] = place === 'before' ? m + v : place === 'after' ? v + m : m + v + m;
      marked.push([`S${k}`, String(k), ...fields].join(', '));
    }
    const nameLine = [`Mehr${ZWNJ}dad`, '0', ...sel.fields].join(', ');
    clean.push(nameLine); marked.push(nameLine);
    const run = async (lines, prints = true) => {
      await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' });
      await pg.click(p.spec.modeToggle);
      await pg.fill(p.spec.advanced, lines.join(';\n') + ';');
      const before = await p.prints();
      await pg.click(p.spec.generate);
      if (prints) await pg.waitForFunction(n => window.__prints > n, before, { timeout: 60000 }).catch(() => {});
      else await pg.waitForTimeout(400);
      return pg.evaluate(s => ({
        html: document.querySelector(s.results).innerHTML,
        sheets: document.querySelectorAll(s.results + ' ' + s.sheet).length,
        names: [...document.querySelectorAll(s.results + ' span[dir="auto"]')].map(e => e.textContent),
        errors: document.querySelector(s.errors).innerText.trim(),
      }), { results: sel.results, errors: sel.errors, sheet: p.spec.sheet });
    };
    const a = await run(clean), b = await run(marked);
    check(a.sheets === clean.length, `the clean paste prints ${a.sheets} of ${clean.length} lines (the handle resolves)`);
    check(b.sheets === marked.length, `${marked.length - 1} marked lines and the name line print ${b.sheets} sheets`);
    check(b.errors === '', `nothing reported for the marked paste (${b.errors.slice(0, 120).replace(/\n/g, ' / ')})`);
    check(a.html === b.html, `the sheets are byte-identical to the clean paste's (${a.html.length} / ${b.html.length} chars)`);
    check(b.names.some(n => n === `Mehr${ZWNJ}dad`), 'the name keeps its ZWNJ');
    // a wrong selector behind a mark is still reported
    const w = await run([[`W1`, '1', ...sel.wrong.map((v, i) => i === 0 ? MARKS[0] + v : v)].join(', ')], false);
    check(w.sheets === 0 && /Entry 1/.test(w.errors), `a wrong selector behind an LRM is still reported (${w.errors.replace(/\n+/g, ' / ').slice(0, 110)})`);
    check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
    await p.close();
  }
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS34-selector-marks: ${fails.length} failing check(s)` : '\nS34-selector-marks: all green');
process.exit(fails.length ? 1 : 0);
