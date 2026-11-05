// MathSheet smoke — the loop's regression floor, run at session start (standing arm R) and by
// closeout.mjs. Every page: load clean, generate by a real click, the answer key, the print
// geometry, advanced input, the saved roster, an XSS control. `--cdn` adds the PDF arm (needs
// cdnjs reachable; skips loudly otherwise). `--only <file>` limits to one page. `--json` prints
// the measurements (load ms, generate ms, bytes) for pass A to log.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { serve, launch, openPage, generate, cellCounts, printBoxes, PAGES, ROOT } from './harness.mjs';

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const only = opt('--only');
const files = Object.keys(PAGES).filter(f => !only || f === only);
const ROWS = { 'rows-3': 30, 'rows-4': 40, 'rows-5': 50, 'rows-6': 60 };

let fails = 0;
const ok = (cond, msg) => { console.log(`  ${cond ? 'ok  ' : 'FAIL'} ${msg}`); if (!cond) fails++; };
const measurements = {};

const srv = await serve();
const browser = await launch();
try {
  for (const file of files) {
    console.log(`\n${file}`);
    const m = measurements[file] = { bytes: fs.statSync(path.join(ROOT, file)).size };

    // 1. Load
    let p = await openPage(browser, srv.base, file);
    m.loadMs = p.loadMs;
    const entries = await p.page.locator(`${p.spec.students} ${p.spec.entry}`).count();
    ok(p.errors.length === 0, `0 page errors on load (${p.errors.length}${p.errors[0] ? ': ' + p.errors[0] : ''})`);
    ok(p.failed.length === 0, `0 failed same-origin requests (${p.failed.length})`);
    ok(entries > 0, `${entries} default student entries`);

    // 2. Generate (print stubbed) — sheet count = entries × worksheets per student; cells per sheet
    const per = Number(await p.page.$eval(p.spec.perStudent, s => s.value));
    const t0 = Date.now();
    const sheets = await generate(p);
    m.generateMs = Date.now() - t0;
    ok(sheets === entries * per, `generate: ${sheets} sheets for ${entries} × ${per}`);
    ok((await p.prints()) === 1, `window.print called once`);
    const counts = await cellCounts(p);
    let expected;
    if (p.spec.fixedGrid) {   // standard pages: the rows class fixes the count (10 columns)
      const classes = await p.page.$$eval(p.spec.sheet, s => s.map(e => (e.querySelector('[class*="rows-"]') || {}).className || ''));
      expected = classes.map(c => { const r = (c.match(/(?:^|\s)(rows-\d)(?:\s|$)/) || [])[1]; return r ? ROWS[r] : null; });
    } else {                   // index.html: each entry's own Count select, repeated per copy
      const chosen = await p.page.$$eval(`${p.spec.students} ${p.spec.entry} select[name="count"]`, s => s.map(e => Number(e.value)));
      expected = chosen.flatMap(n => Array(per).fill(n));
    }
    const mismatch = counts.filter((n, i) => expected[i] != null ? n !== expected[i] : n === 0);
    ok(mismatch.length === 0, `every sheet carries its problem count (${counts.join(',')} vs ${expected.join(',')})`);
    ok(p.errors.length === 0, `0 page errors after generate`);

    // 3. Answer key adds sheets
    await p.page.check(p.spec.key);
    await generate(p);
    const keySheets = await p.page.locator(p.spec.keySheet).count() - (p.spec.keySheet === p.spec.sheet ? sheets : 0);
    ok(keySheets > 0, `answer key: ${keySheets} key sheet(s) with the toggle on`);
    await p.page.uncheck(p.spec.key);

    // 4. Print geometry — every sheet 11in × 8.5in under the page's own print trick
    const boxes = await printBoxes(p);
    const offPage = boxes.filter(b => Math.abs(b.w - 1056) > 2 || Math.abs(b.h - 816) > 2);
    ok(boxes.length > 0 && offPage.length === 0, `print: ${boxes.length} sheets at 1056×816 (${offPage.length} off: ${JSON.stringify(offPage.slice(0, 2))})`);

    // 4b. Paper — Chromium's own print path (results still moved to body by printBoxes): the @page
    //     rule must name landscape Letter, one page per sheet. An invalid `size` is dropped without
    //     a word, so the dialog falls back to portrait and an A4-landscape sheet splits in two (S2).
    const pdfInfo = buf => { const s = buf.toString('latin1');
      return { pages: (s.match(/\/Type\s*\/Page[^s]/g) || []).length, media: [...new Set(s.match(/\/MediaBox \[[^\]]*\]/g) || [])] }; };
    await p.page.emulateMedia({ media: 'print' });   // page.pdf() renders screen CSS after emulateMedia('screen')
    const letter = pdfInfo(await p.page.pdf({ preferCSSPageSize: true }));
    ok(letter.pages === boxes.length && letter.media.join() === '/MediaBox [0 0 792 612]',
      `paper: print path makes ${letter.pages} page(s) for ${boxes.length} sheets at ${letter.media.join(' ')} (landscape Letter = 0 0 792 612)`);
    const a4 = pdfInfo(await p.page.pdf({ format: 'A4', landscape: true }));
    // 4c. Font — worksheets are always Arial (CLAUDE.md), also once they leave the app wrapper:
    //     in print (moved to body) and in the PDF stage (a clone on body). S2 found the headers in
    //     the browser's default serif on both standard pages.
    const fonts = await p.page.evaluate(({ sheet }) => {
      const stage = document.createElement('div');
      stage.appendChild(document.querySelector(sheet).cloneNode(true));
      document.body.appendChild(stage);
      const bad = new Set();
      for (const root of [...document.querySelectorAll(sheet)]) {
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (w.nextNode()) {
          const el = w.currentNode.parentElement;
          if (w.currentNode.textContent.trim() && !/^Arial\b/i.test(getComputedStyle(el).fontFamily)) bad.add(`${el.className || el.tagName}: ${getComputedStyle(el).fontFamily}`);
        }
      }
      stage.remove();
      return [...bad];
    }, { sheet: p.spec.sheet });
    ok(fonts.length === 0, `print + PDF stage: every worksheet text is Arial (${fonts.length} other: ${JSON.stringify(fonts.slice(0, 2))})`);
    await p.page.emulateMedia({ media: 'screen' });
    ok(a4.pages === boxes.length, `paper: on A4 landscape every sheet still fits one page (${a4.pages} pages for ${boxes.length} sheets)`);
    await p.close();

    // 5. Advanced input — a blank name is allowed, each entry one sheet
    p = await openPage(browser, srv.base, file);
    await p.page.click(p.spec.modeToggle);
    await p.page.fill(p.spec.advanced, p.spec.advancedSample);
    await p.page.selectOption(p.spec.perStudent, '1');
    const adv = await generate(p);
    ok(adv === 2, `advanced input: 2 entries (one nameless) → ${adv} sheets`);
    ok(p.errors.length === 0, `0 page errors in advanced mode`);
    await p.close();

    // 6. Saved roster survives a reload; 7. an HTML name is inert on the sheet (XSS control)
    p = await openPage(browser, srv.base, file);
    const hostile = '<img src=x onerror="window.__xss=1">Rivka';
    await p.page.fill(`${p.spec.students} ${p.spec.entry} >> nth=0 >> ${p.spec.name}`, hostile);
    await p.page.click(p.spec.save);
    const stored = await p.page.evaluate(k => localStorage.getItem(k), p.spec.storageKey);
    ok(!!stored && stored.includes('Rivka'), `save roster writes ${p.spec.storageKey}`);
    await p.page.reload({ waitUntil: 'load' });
    await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
    const back = await p.page.inputValue(`${p.spec.students} ${p.spec.entry} >> nth=0 >> ${p.spec.name}`);
    ok(back === hostile, `saved roster restored after reload`);
    await generate(p);
    const xss = await p.page.evaluate(() => window.__xss);
    const literal = await p.page.locator(p.spec.sheet).first().innerText();
    ok(xss === undefined && literal.includes('<img'), `escapeHtml: hostile name printed literally, handler never ran`);
    await p.close();

    // 8. PDF libraries are fetched on the first Save PDF click, never on load; offline they fail soft
    p = await openPage(browser, srv.base, file);
    const eager = p.aborted.filter(u => /cdnjs/.test(u));
    ok(eager.length === 0, `no PDF-library request before the first Save PDF click (${eager.length} on load)`);
    await p.page.click(p.spec.pdf);
    await p.page.waitForTimeout(1500);
    const tried = p.aborted.filter(u => /cdnjs/.test(u)).length;
    const notice = (await p.page.locator(p.spec.errors).allInnerTexts().catch(() => [])).join(' | ');
    ok(tried > 0 && /PDF/i.test(notice) && p.errors.length === 0, `offline Save PDF: ${tried} library request(s) attempted, notice shown (${JSON.stringify(notice.slice(0, 60))}), ${p.errors.length} page errors`);
    await p.close();

    // 9. PDF arm (opt-in: needs the two cdnjs libraries)
    if (flag('--cdn')) {
      p = await openPage(browser, srv.base, file, { cdn: true });
      // The libraries load on the first Save PDF click, so reachability is probed, not read off the page.
      const reach = await p.page.evaluate(() => fetch('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', { method: 'HEAD' }).then(r => r.ok, () => false));
      if (!reach) { console.log('  SKIP PDF arm: cdnjs unreachable from here'); }
      else {
        const t1 = Date.now();
        const [dl] = await Promise.all([
          p.page.waitForEvent('download', { timeout: 120000 }),
          p.page.click(p.spec.pdf),
        ]);
        m.pdfMs = Date.now() - t1;
        const out = path.join(os.tmpdir(), `${file}.pdf`);
        await dl.saveAs(out);
        const bytes = fs.readFileSync(out);
        const pages = (bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
        m.pdfBytes = bytes.length; m.pdfPages = pages;
        ok(dl.suggestedFilename() === p.spec.pdfName, `pdf: saved as ${dl.suggestedFilename()}`);
        ok(bytes.subarray(0, 5).toString() === '%PDF-' && pages > 0, `pdf: ${pages} pages, ${bytes.length} bytes`);
        const libs = await p.page.evaluate(() => typeof html2canvas === 'function' && !!(window.jspdf && window.jspdf.jsPDF));
        const fetched = p.requests.filter(r => /cdnjs/.test(r.url) && r.status === 200).length;
        ok(libs && fetched >= 2, `pdf: both libraries fetched on the click (${fetched} cdnjs responses) and present afterwards`);
      }
      await p.close();
    }
  }
} finally {
  await browser.close();
  await srv.close();
}
if (flag('--json')) console.log('\n' + JSON.stringify(measurements, null, 2));
console.log(`\nsmoke: ${fails} failing check(s)`);
process.exit(fails ? 1 : 0);
