// Shared Playwright harness for the MathSheet improvement loop (scripts/loop/README.md).
// Serves the repo root over local HTTP, opens a generator page with every foreign origin aborted
// (pass { cdn: true } to let the two cdnjs PDF libraries load), stubs window.print so a generate
// can be driven by a real click, and knows each page's DOM contract (PAGES).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);

// Chromium and Playwright are preinstalled in the cloud sandbox (never `playwright install`);
// the package is reachable through NODE_PATH or the global node22 tree.
function loadPlaywright() {
  const req = createRequire(import.meta.url);
  for (const spec of ['playwright', '/opt/node22/lib/node_modules/playwright/index.js']) {
    try { return req(spec); } catch (e) { /* try the next */ }
  }
  throw new Error('playwright not found: run from the cloud sandbox or `npm i -g playwright`');
}
const { chromium, devices } = loadPlaywright();
export { devices };

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };

/** Start a static server on the repo root. Returns { base, close }. */
export function serve(port = 0) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(ROOT, url === '/' ? 'index.html' : url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => {
    const base = `http://127.0.0.1:${server.address().port}`;
    resolve({ base, close: () => new Promise(r => { server.closeAllConnections?.(); server.close(r); }) });
  }));
}

/** Per-page DOM contract. index.html predates the standard (CLAUDE.md → Known exceptions). */
export const PAGES = {
  'index.html': {
    app: '#mwg-app', students: '#mwgStudentsContainer', entry: '.mwg-student-entry',
    generate: '#mwgGenerateBtn', pdf: '#mwgSavePdfBtn', results: '#mwgResults', printId: 'mwg-results-print',
    sheet: '.mwg-worksheet', keySheet: '.mwg-answer-key-sheet', cell: '.mwg-problem-cell', key: '#mwgAnswerKeyToggle',
    perStudent: '#mwgWorksheetsPerStudent', fixedGrid: false, name: 'input[name="studentName"]',
    modeToggle: '#mwgToggleModeBtn', advanced: '#mwgAdvancedBox', save: '#mwgSaveBtn',
    storageKey: 'mwgRosterData_v2', pdfName: 'worksheets.pdf',
    advancedSample: 'Cohen, Avi, 1, add1, 30, 2;\n, 2, sub2, 30, 2;', advancedName: 'Cohen, Avi',   // a comma in a name (S3)
    errors: '#mwgErrors, #mwgStatus',
    // The default entries carry no grade/type/count; the smoke fills each before generating.
    prepare: async page => {
      await page.evaluate(() => {
        const fire = s => s.dispatchEvent(new Event('change', { bubbles: true }));
        for (const e of document.querySelectorAll('#mwgStudentsContainer .mwg-student-entry')) {
          const grade = e.querySelector('select[name="grade"]'); grade.value = '2'; fire(grade);
          const type = e.querySelector('select[name="problemType"]');
          type.value = [...type.options].find(o => o.value && o.value !== 'mixed').value; fire(type);
          const count = e.querySelector('select[name="count"]');
          count.value = [...count.options].find(o => o.value).value; fire(count);
        }
      });
    },
  },
  'math-minute.html': {
    app: '#math-minute-app', students: '#studentsContainer', entry: '.student-entry',
    generate: '#generatePrintButton', pdf: '#savePdfButton', results: '#results', printId: 'results-print',
    sheet: '.worksheet', keySheet: '.worksheet', cell: '.problem-cell', key: '#answerKeyToggle',
    perStudent: '#worksheetsPerStudent', fixedGrid: true, name: 'input[name="studentName"]',
    modeToggle: '#toggleInputModeButton', advanced: '#advancedInputBox', save: '#saveRosterButton',
    errors: '#errors, #statusMessages',
    storageKey: 'mathMinuteRosterData_v2', pdfName: 'math-minute-worksheets.pdf',
    advancedSample: 'Cohen, Avi, 1, 1;\n, 2, 19;', advancedName: 'Cohen, Avi',   // a comma in a name (S3)
    // The default entries carry no level; the smoke picks each entry's first real option.
    prepare: page => page.evaluate(() => {
      for (const sel of document.querySelectorAll('#studentsContainer .student-entry select[name="level"]')) {
        const o = [...sel.options].find(o => o.value); if (o) { sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      }
    }),
  },
  'math-facts.html': {
    app: '#math-facts-app', students: '#studentsContainer', entry: '.student-entry',
    generate: '#generatePrintButton', pdf: '#savePdfButton', results: '#results', printId: 'results-print',
    sheet: '.worksheet', keySheet: '.worksheet', cell: '.problem-cell', key: '#answerKeyToggle',
    perStudent: '#worksheetsPerStudent', fixedGrid: true, name: 'input[name="studentName"]',
    modeToggle: '#toggleInputModeButton', advanced: '#advancedInputBox', save: '#saveRosterButton',
    errors: '#errors, #statusMessages',
    storageKey: 'mathFactsRosterData_v1', pdfName: 'math-facts-worksheets.pdf',
    advancedSample: 'Cohen, Avi, 1, +2;\n, 2, x3;', advancedName: 'Cohen, Avi',   // a comma in a name (S3)
    // The default entries carry no level; the smoke picks each entry's first real option.
    prepare: page => page.evaluate(() => {
      for (const sel of document.querySelectorAll('#studentsContainer .student-entry select[name="level"]')) {
        const o = [...sel.options].find(o => o.value); if (o) { sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      }
    }),
  },
};

export const launch = () => chromium.launch();

/**
 * Open a page in a fresh context. Options: viewport, colorScheme, cdn (allow cdnjs), device
 * (a playwright devices descriptor), storage ({ key: value } seeded before load).
 * Returns { context, page, errors, failed, prints() }.
 */
export async function openPage(browser, base, file, opts = {}) {
  const spec = PAGES[file];
  if (!spec) throw new Error(`unknown page ${file}`);
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1280, height: 900 },
    colorScheme: opts.colorScheme || 'light',
    acceptDownloads: true,
    ...(opts.device || {}),
  });
  const errors = [], failed = [], requests = [], aborted = [];
  await context.route('**/*', route => {
    const u = route.request().url();
    if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (opts.cdn && /^https:\/\/cdnjs\.cloudflare\.com\//.test(u)) return route.continue();
    aborted.push(u);   // every foreign request the page tried (the eager-CDN census reads this)
    return route.abort();
  });
  await context.addInitScript(seed => {
    window.__prints = 0;
    window.print = function () { window.__prints++; };
    try { for (const k in seed) localStorage.setItem(k, seed[k]); } catch (e) {}
  }, opts.storage || {});
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  page.on('requestfailed', r => { if (r.url().startsWith(base)) failed.push(r.url()); });
  page.on('response', r => requests.push({ url: r.url(), status: r.status() }));
  const t0 = Date.now();
  await page.goto(`${base}/${file}`, { waitUntil: 'load' });
  await page.waitForSelector(`${spec.students} ${spec.entry}`, { timeout: 10000 });
  const loadMs = Date.now() - t0;
  if (spec.prepare && !opts.raw) await spec.prepare(page);
  return {
    context, page, spec, file, errors, failed, requests, aborted, loadMs,
    prints: () => page.evaluate(() => window.__prints),
    close: () => context.close(),
  };
}

/** Click Generate & Print (print stubbed) and wait for the sheets. Returns the sheet count. */
export async function generate(p) {
  const before = await p.prints();
  await p.page.click(p.spec.generate);
  // A validation box ("Generate Anyway") may interpose on an incomplete roster.
  const anyway = p.page.locator('#mmValidationGenerate, #mwgValidationGenerate');
  if (await anyway.count() && await anyway.first().isVisible()) await anyway.first().click();
  try {
    await p.page.waitForFunction(n => window.__prints > n, before, { timeout: 15000 });
  } catch (e) {
    const shown = await p.page.$$eval(p.spec.errors, els => els.map(e => e.innerText.trim()).filter(Boolean).join(' | '));
    throw new Error(`generate never reached window.print on ${p.file}; the page says: ${shown || '(nothing)'}`);
  }
  return p.page.locator(p.spec.sheet).count();
}

/** Problem-cell counts per sheet. */
export const cellCounts = p => p.page.$$eval(`${p.spec.sheet}`, (sheets, cell) =>
  sheets.map(s => s.querySelectorAll(cell).length), p.spec.cell);

/** Re-apply the page's own print trick (results moved to body, id swapped) under emulated print
 *  and measure each sheet. Returns [{ w, h }] in CSS px (11in × 8.5in = 1056 × 816). */
export async function printBoxes(p) {
  await p.page.emulateMedia({ media: 'print' });
  const { results, printId, sheet, keySheet } = p.spec;
  const boxes = await p.page.evaluate(({ results, printId, sheet, keySheet }) => {
    const r = document.querySelector(results);
    r.id = printId; document.body.appendChild(r);
    return [...document.querySelectorAll(`${sheet}, ${keySheet}`)].map(s => {
      const b = s.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height) };
    });
  }, { results, printId, sheet, keySheet });
  await p.page.emulateMedia({ media: 'screen' });
  return boxes;
}
