// Probe (loop S14, from pass F in S13): the four teacher-facing strings that had drifted on index.html read as
// they do on the standard pages (approved S13, gate 2): the Advanced Input Code panel's help line, the success
// message after "Use in Advanced Input", and the two clear-roster confirms. The expected strings are lifted from
// math-facts.html's source, so the probe also holds the standard page to them; index.html is driven live (the panel
// opened, the code used, each confirm fired with its dialog read). Fails on the page before the change
// (`--ref 9030fbe`).
//   node scripts/loop/probes/S14-index-copy.mjs [--ref <commit>]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };

// The standard page's strings, read from its source.
const facts = fs.readFileSync(path.join(ROOT, 'math-facts.html'), 'utf8');
const lift = (re, what) => { const m = re.exec(facts); check(!!m, `math-facts.html carries the ${what}`); return m ? m[1] : ''; };
const HELP = lift(/<div style="[^"]*">(This text is formatted for the Advanced Input box[^<]*)<\/div>/, 'code panel help line');
const MOVED = lift(/showSuccess\("(Advanced code moved into Advanced Input\.)"\)/, '"moved" success message');
const CLEAR_CUR = lift(/window\.confirm\("(Are you sure you want to clear the current roster\?)"\)/, 'clear-current confirm');
const CLEAR_SAVED = lift(/window\.confirm\("(Are you sure you want to clear the saved roster\?)"\)/, 'clear-saved confirm');

const srv = await serve(); const browser = await launch();
const file = 'index.html';
console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
const p = await openPage(browser, srv.base, file);
if (REF) {
  const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
  await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
  await p.spec.prepare(p.page);
}
await p.page.click('#mwgGenCodeBtn');
await p.page.waitForTimeout(150);
const help = (await p.page.locator('#mwgCodePanel > div').allInnerTexts()).map(t => t.trim()).find(t => /Advanced Input box/.test(t)) || '';
check(help === HELP, `the code panel's help line reads as on the standard pages (${JSON.stringify(help)})`);
await p.page.click('#mwgUseCodeBtn');
await p.page.waitForTimeout(150);
const moved = (await p.page.locator('#mwgStatus').allInnerTexts()).join(' | ').trim();
check(moved === MOVED, `"Use in Advanced Input" reports as on the standard pages (${JSON.stringify(moved)})`);
const dialogs = [];
p.page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
await p.page.click('#mwgClearCurrentBtn'); await p.page.waitForTimeout(100);
await p.page.click('#mwgClearSavedBtn'); await p.page.waitForTimeout(100);
check(dialogs[0] === CLEAR_CUR, `Clear Current Roster asks as the standard pages do (${JSON.stringify(dialogs[0])})`);
check(dialogs[1] === CLEAR_SAVED, `Clear Saved Roster asks as the standard pages do (${JSON.stringify(dialogs[1])})`);
check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
await p.close(); await browser.close(); await srv.close();
console.log(fails.length ? `\nS14-index-copy: ${fails.length} failing check(s)` : '\nS14-index-copy: all green');
process.exit(fails.length ? 1 : 0);
