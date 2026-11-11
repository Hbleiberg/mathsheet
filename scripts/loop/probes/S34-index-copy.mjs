// Probe (loop S34, pass F; approved at gate 2): index.html words four of the shared affordances as the standard pages do.
// Pass F found three messages and the Advanced help drifted from the twins' (S13 aligned four other strings, S14):
// "Code copied." (twins: "Advanced code copied."), "No valid students found." ("… to generate worksheets."), "Unable
// to clear saved roster." ("… in this browser."), and the help without "You can also paste one student per line." and
// "Extra spaces are okay. …"; its Copy handler also carried a dead `try { void 0; } catch` whose "Unable to copy
// automatically." could never show. Per page, by real clicks: Copy in the code panel, a generate with no valid
// student, Clear Saved Roster with storage refusing, the help's text; index's four must equal both twins'.
// Fails before the change (`--ref e97c230`).
//   node scripts/loop/probes/S34-index-copy.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const IDS = {
  'index.html':       { gen: '#mwgGenCodeBtn', copy: '#mwgCopyCodeBtn', clearSaved: '#mwgClearSavedBtn', status: '#mwgStatus', help: '.mwg-advanced-help', bad: 'Noa, 1, zz, 30, 2;' },
  'math-minute.html': { gen: '#generateAdvancedCodeButton', copy: '#copyAdvancedCodeButton', clearSaved: '#clearSavedRosterButton', status: '#statusMessages', help: '.advanced-help', bad: 'Noa, 1, zz;' },
  'math-facts.html':  { gen: '#generateAdvancedCodeButton', copy: '#copyAdvancedCodeButton', clearSaved: '#clearSavedRosterButton', status: '#statusMessages', help: '.advanced-help', bad: 'Noa, 1, zz;' },
};
const source = file => REF ? execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' }) : readFileSync(`${ROOT}/${file}`, 'utf8');

const srv = await serve(); const browser = await launch();
const got = {};
try {
  for (const file of Object.keys(IDS)) {
    const id = IDS[file];
    const p = await openPage(browser, srv.base, file);
    const pg = p.page;
    if (REF) {
      const body = source(file);
      await pg.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
      await pg.reload({ waitUntil: 'load' }); await pg.waitForSelector(`${p.spec.students} ${p.spec.entry}`, { state: 'attached' }); await p.spec.prepare(pg);
    }
    await p.context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: srv.base });
    pg.on('dialog', d => d.accept());
    const status = () => pg.$eval(id.status, e => e.innerText.trim());
    const r = {};
    // 1. Copy in the code panel
    await pg.click(id.gen); await pg.click(id.copy);
    await pg.waitForFunction(s => document.querySelector(s).innerText.trim(), id.status, { timeout: 5000 }).catch(() => {});
    r.copied = await status();
    check(await pg.evaluate(() => navigator.clipboard.readText()).then(t => t.length > 0, () => false), `${file}: Copy put the code on the clipboard`);
    // 2. a generate with no valid student
    await pg.click(p.spec.modeToggle); await pg.fill(p.spec.advanced, id.bad);
    const before = await p.prints();
    await pg.click(p.spec.generate); await pg.waitForTimeout(400);
    r.none = await status();
    check(await p.prints() === before, `${file}: nothing printed for a roster with no valid student`);
    // 3. Clear Saved Roster with storage refusing
    await pg.evaluate(() => { Storage.prototype.removeItem = function () { throw new Error('denied'); }; });
    await pg.click(p.spec.modeToggle); await pg.click(id.clearSaved); await pg.waitForTimeout(200);
    r.clear = await status();
    // 4. the Advanced help
    r.help = await pg.$eval(id.help, e => e.textContent.replace(/\s+/g, ' ').trim());
    check(p.errors.length === 0, `${file}: 0 page errors (${p.errors.join('; ')})`);
    got[file] = r;
    console.log(`${file}${REF ? ` (served from ${REF})` : ''}: copy "${r.copied}" · none "${r.none}" · clear "${r.clear}"`);
    await p.close();
  }
  const [I, M, F] = Object.keys(IDS).map(f => got[f]);
  for (const k of ['copied', 'none', 'clear']) {
    check(M[k] && M[k] === F[k], `the twins agree on ${k} ("${M[k]}")`);
    check(I[k] === M[k], `index's ${k} reads as the twins' ("${I[k]}")`);
  }
  for (const line of ['You can also paste one student per line.', 'Extra spaces are okay. Blank trailing entries are ignored. Invalid entries are skipped and listed in an error message.'])
    for (const f of Object.keys(IDS)) check(got[f].help.includes(line), `${f}'s help: "${line.slice(0, 44)}…"`);
  check(!/void 0|copy automatically/.test(source('index.html')), 'index: no dead try / catch in the Copy handler');
} finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS34-index-copy: ${fails.length} failing check(s)` : '\nS34-index-copy: all green');
process.exit(fails.length ? 1 : 0);
