// Probe (loop S15, from the S1 candidate; approved S15, gate 2): a saved roster that cannot be read is reported
// once and cleared on all three pages. Planted with unparsable JSON and with "null" (which parses and then throws on
// its first field), each page loads its 3 default rows, shows the notice "The saved roster could not be read, so
// the page starts with a blank roster.", and removes the bad value, so the next load is a plain first load with
// no message. A good payload still loads silently and keeps its value. Fails on the pages before the change
// (`--ref 69deb36`): no notice, the bad value kept.
//   node scripts/loop/probes/S15-unreadable-roster.mjs [--only <file>] [--ref <commit>]
import { execSync } from 'node:child_process';
import { serve, launch, openPage, PAGES, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const REF = arg('--ref'), ONLY = arg('--only');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };
const WANT = 'The saved roster could not be read, so the page starts with a blank roster.';
const GOOD = {
  'index.html': { students: [{ name: 'Fine', number: '1', grade: '2', type: 'add1', count: '30' }] },
  'math-minute.html': { standardStudents: [{ name: 'Fine', number: '1', level: '5' }] },
  'math-facts.html': { standardStudents: [{ name: 'Fine', number: '1', level: '+2' }] },
};
const STATUS = { 'index.html': '#mwgStatus', 'math-minute.html': '#statusMessages', 'math-facts.html': '#statusMessages' };

const srv = await serve(); const browser = await launch();
for (const file of Object.keys(GOOD)) {
  if (ONLY && ONLY !== file) continue;
  console.log(`${file}${REF ? ` (served from ${REF})` : ''}`);
  const key = PAGES[file].storageKey;
  const entry = `${PAGES[file].students} ${PAGES[file].entry}`;
  // The value is planted by hand and the page reloaded once: the harness's own `storage` seed would re-plant it on
  // every navigation, so the second load could never be a plain first load.
  const open = async () => {
    const p = await openPage(browser, srv.base, file, { raw: true });
    if (REF) {
      const body = execSync(`git show ${REF}:${file}`, { cwd: ROOT, encoding: 'utf8' });
      await p.page.route(new RegExp(`/${file.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    }
    return p;
  };
  const plantAndReload = async (p, raw) => {
    await p.page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, raw]);
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(entry);
  };
  const status = p => p.page.locator(STATUS[file]).allInnerTexts().then(t => t.join(' | ').trim());
  for (const [label, raw] of [['unparsable JSON', '{oops'], ['the word null', 'null']]) {
    const p = await open();
    await plantAndReload(p, raw);
    const rows = await p.page.$$eval(entry, e => e.length);
    const left = await p.page.evaluate(k => localStorage.getItem(k), key);
    check(rows === 3, `${label}: 3 default rows (${rows})`);
    check((await status(p)) === WANT, `${label}: the notice reads ${JSON.stringify(await status(p))}`);
    check(left === null, `${label}: the unreadable value is cleared (${JSON.stringify(left)})`);
    await p.page.reload({ waitUntil: 'load' }); await p.page.waitForSelector(entry);
    check((await status(p)) === '', `${label}: the next load is a plain first load, no message (${JSON.stringify(await status(p))})`);
    check(p.errors.length === 0, `${label}: 0 page errors (${p.errors.join('; ')})`);
    await p.close();
  }
  const good = JSON.stringify(GOOD[file]);
  const q = await open();
  await plantAndReload(q, good);
  const name = await q.page.inputValue(`${entry} >> nth=0 >> ${PAGES[file].name}`);
  check((await status(q)) === 'Saved roster loaded.' && name === 'Fine' && (await q.page.evaluate(k => localStorage.getItem(k), key)) === good, `a good roster loads as before and is kept (${JSON.stringify(await status(q))}, ${name})`);
  await q.close();
}
await browser.close(); await srv.close();
console.log(fails.length ? `\nS15-unreadable-roster: ${fails.length} failing check(s)` : '\nS15-unreadable-roster: all green');
process.exit(fails.length ? 1 : 0);
