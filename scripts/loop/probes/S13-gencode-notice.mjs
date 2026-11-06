// Probe (loop S13, pass F): Generate Advanced Code's empty-roster notice says what the code needs, on every page.
// The standard pages said "Add at least one student with a name and level", though a name is optional on every
// page and the code line needs only a level; index.html said "one complete student" without saying what that is.
// Approved S13 (gate 2): the standard pages name the level, index.html its grade, type and count. Each page is
// loaded untouched (no level or grade set): with a name typed and no level the click shows the new notice and no
// panel; with a level set and the name cleared the panel opens and the code line starts with the empty name
// field — the notice's claim, proved. Fails on the page before the wording change (`--ref <commit>`).
//   node scripts/loop/probes/S13-gencode-notice.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const UI = {
  'index.html':       { genCode: '#mwgGenCodeBtn', panel: '#mwgCodePanel', codeOut: '#mwgCodeOutput', status: '#mwgStatus',
                        want: 'Add at least one student with a grade, type and count before generating advanced code.' },
  'math-minute.html': { genCode: '#generateAdvancedCodeButton', panel: '#advancedCodePanel', codeOut: '#advancedCodeOutput', status: '#statusMessages',
                        want: 'Add at least one student with a level before generating advanced code.' },
  'math-facts.html':  { genCode: '#generateAdvancedCodeButton', panel: '#advancedCodePanel', codeOut: '#advancedCodeOutput', status: '#statusMessages',
                        want: 'Add at least one student with a level before generating advanced code.' },
};
async function serveFrom(page, file, ref, entry) {
  const body = execSync(`git show ${ref}:${file}`, { cwd: ROOT, encoding: 'utf8' });
  await page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector(entry);
}

const srv = await serve(); const browser = await launch();
for (const file of Object.keys(UI)) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  const ui = UI[file];
  const p = await openPage(browser, srv.base, file, { raw: true });   // untouched first paint: no level, no grade
  if (REF) await serveFrom(p.page, file, REF, `${p.spec.students} ${p.spec.entry}`);
  const nameSel = `${p.spec.students} ${p.spec.entry} >> nth=0 >> ${p.spec.name}`;
  await p.page.fill(nameSel, 'Rivka');
  await p.page.click(ui.genCode);
  await p.page.waitForTimeout(150);
  const notice = (await p.page.locator(ui.status).allInnerTexts()).join(' | ').trim();
  const shown = await p.page.isVisible(ui.panel);
  check(notice === ui.want, `a name and no level: the notice reads ${JSON.stringify(notice)}`);
  check(!shown, `a name and no level: the code panel stays closed`);

  await p.page.fill(nameSel, '');
  if (p.spec.prepare) await p.spec.prepare(p.page);                 // a level (grade, type, count on index), no name
  await p.page.click(ui.genCode);
  await p.page.waitForTimeout(150);
  const open = await p.page.isVisible(ui.panel);
  const line = open ? (await p.page.inputValue(ui.codeOut)).split('\n')[0] : '';
  check(open && line.startsWith(','), `a level and no name: the panel opens and the line starts with the empty name (${JSON.stringify(line.slice(0, 40))})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS13-gencode-notice: ${fails.length} failing check(s)` : '\nS13-gencode-notice: all green');
process.exit(fails.length ? 1 : 0);
