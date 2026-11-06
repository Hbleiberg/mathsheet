// Probe (loop S13, pass F): the HTML-escaping helper matches the CLAUDE.md standard on all three pages.
// Static arm: each page's helper (`escapeHtml`, `esc` on index.html) is lifted out of the page's source and run in
// a VM on the five characters it must escape; `&`, `<`, `>` and `"` were right since S0, but the apostrophe step
// replaced `'` with itself (the string "'" IS an apostrophe), so a single quote reached the markup raw —
// harmless today (every user value lands in a text node or a double-quoted attribute) but a gap the smoke's XSS
// arm cannot see. Live arm: on each page a student name holding every special character is typed, generated,
// saved and reloaded, and put through Generate Advanced Code; the printed name, the restored input and the code
// line all read the typed name exactly, so the entity is invisible to a teacher and a student. The static arm
// fails on every page before the fix (`--ref aadebcc`); the live arm passes before and after (that is its point).
//   node scripts/loop/probes/S13-escape-html.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { serve, launch, openPage, generate, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const APOS = String.fromCharCode(39);
const HELPER = { 'index.html': 'esc', 'math-minute.html': 'escapeHtml', 'math-facts.html': 'escapeHtml' };
const UI = {
  'index.html':       { save: '#mwgSaveBtn', genCode: '#mwgGenCodeBtn', codeOut: '#mwgCodeOutput' },
  'math-minute.html': { save: '#saveRosterButton', genCode: '#generateAdvancedCodeButton', codeOut: '#advancedCodeOutput' },
  'math-facts.html':  { save: '#saveRosterButton', genCode: '#generateAdvancedCodeButton', codeOut: '#advancedCodeOutput' },
};
const pageSource = file => REF
  ? execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' })
  : fs.readFileSync(path.join(ROOT, file), 'utf8');

/** The helper's source text, by brace matching from `function <name>(`. */
function liftFunction(src, name) {
  const m = new RegExp(`\\bfunction\\s+${name}\\s*\\(`).exec(src);
  if (!m) return null;
  let depth = 0, i = src.indexOf('{', m.index), j = i;
  for (; j < src.length; j++) { if (src[j] === '{') depth++; else if (src[j] === '}' && --depth === 0) break; }
  return src.slice(m.index, j + 1);
}
async function serveFrom(page, file, ref, entry) {
  const body = execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8' });
  await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector(entry);
}

const srv = await serve(); const browser = await launch();
for (const file of Object.keys(HELPER)) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);

  // Static arm: the helper itself, on the five characters CLAUDE.md names.
  const fn = liftFunction(pageSource(file), HELPER[file]);
  check(!!fn, `the helper ${HELPER[file]}() is found in the page`);
  if (fn) {
    const ctx = vm.createContext({});
    vm.runInContext(`${fn}; var out = ${HELPER[file]}("&<>" + String.fromCharCode(34) + String.fromCharCode(39) + "a");`, ctx);
    const out = ctx.out, want = '&amp;&lt;&gt;&quot;&#x27;a';
    check(out === want, `${HELPER[file]}("&<>\\"'a") = ${JSON.stringify(out)} (standard: ${JSON.stringify(want)})`);
  }

  // Live arm: a name with every special character is typed, printed, saved, reloaded and put in an advanced line.
  const name = `O${APOS}Brien & <Sons> "Co" ${APOS}17`;
  const ui = UI[file];
  let p = await openPage(browser, srv.base, file);
  if (REF) { await serveFrom(p.page, file, REF, `${p.spec.students} ${p.spec.entry}`); if (p.spec.prepare) await p.spec.prepare(p.page); }
  const nameSel = `${p.spec.students} ${p.spec.entry} >> nth=0 >> ${p.spec.name}`;
  await p.page.fill(nameSel, name);
  const sheets = await generate(p);
  const printed = await p.page.$$eval(p.spec.sheet, els => els.map(e => e.textContent));
  check(sheets > 0 && printed.some(t => t.includes(name)), `the printed sheet carries the typed name once decoded (${sheets} sheet(s))`);
  const raw = await p.page.$$eval(p.spec.sheet, els => els.map(e => e.innerHTML).join('\n'));
  check(!/<sons>/i.test(raw) && raw.includes('&lt;Sons&gt;'), `the angle brackets reach the sheet as entities, never as a tag`);
  await p.page.click(ui.save);
  await p.page.waitForTimeout(150);
  await p.page.reload({ waitUntil: 'load' });
  await p.page.waitForSelector(nameSel);
  const restored = await p.page.inputValue(nameSel);
  check(restored === name, `the saved roster restores the name exactly (${JSON.stringify(restored)})`);
  await p.page.click(ui.genCode);
  await p.page.waitForTimeout(150);
  const code = await p.page.inputValue(ui.codeOut).catch(() => '');
  check(code.split('\n')[0].startsWith(name + ','), `Generate Advanced Code writes the name as typed (${JSON.stringify(code.split('\n')[0].slice(0, 60))})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS13-escape-html: ${fails.length} failing check(s)` : '\nS13-escape-html: all green');
process.exit(fails.length ? 1 : 0);
