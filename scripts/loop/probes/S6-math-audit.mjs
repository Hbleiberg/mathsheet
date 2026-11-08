// Probe (loop S6, pass G on index.html): the numbers themselves. For every selector (each type at the
// grades that change its generator, each fraction / decimal operation, Mixed at every grade) it pastes
// 200 students into Advanced Input (counts rotating 30/40/50/60), generates with the answer key, and reads
// both back from the DOM:
//   - every key problem is the sheet's own problem (same text, same order);
//   - every key answer equals the problem's value, recomputed here with exact rationals;
//   - the description's count equals the problems on the sheet;
//   - each level keeps its label's promise (PROMISE: operand digits, divisor range, exact division or a
//     remainder, no negative differences).
// It reports what it measured per selector; `--n <k>` changes the sheets per selector, `--only <sel>`
// runs one ("div3@5"), `--control` serves a page with three planted defects (Division Level 3's key off by one,
// fraction keys over a wrong denominator, the header's count the one asked) and must fail three checks.
// Since S8 fraction keys are whole / mixed numbers in lowest terms ("1", "1 1/3"), and a check holds them to it.
//   node scripts/loop/probes/S6-math-audit.mjs [--n 200] [--only div3@5] [--control]
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const N = +(arg('--n') || 200), ONLY = arg('--only'), control = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };

// ── selectors: type@grade (the grade only where it changes the generator) ──
const basic = ['add1','add2','add3','add4','add5','sub1','sub2','sub3','sub4','sub5','mul1','mul2','mul3','mul4','mul5','div1','div2','div3','div4','div5'];
const SELECTORS = [
  ...basic.map(t => `${t}@5`),
  'fractions@5', 'fractions@6',
  ...['add','sub','mul','divf','divw'].map(o => `fractions[fractions-${o}]@6`),
  'decimals@5', 'decimals@6',
  ...['add','sub','mulw','muld','divw','divd'].map(o => `decimals[decimals-${o}]@6`),
  'rounding@5', 'longdivision@5', 'longdivision@6', 'orderofoperations@6', 'integers@7', 'integers@8',
  'exponents@8', 'scientificnotation@8',
  ...[1,2,3,4,5,6,7,8].map(g => `mixed@${g}`),
].filter(s => !ONLY || s === ONLY);

// ── exact rationals ──
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const R = (n, d = 1n) => { n = BigInt(n); d = BigInt(d); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return { n: n / g, d: d / g }; };
const add = (x, y) => R(x.n * y.d + y.n * x.d, x.d * y.d), sub = (x, y) => R(x.n * y.d - y.n * x.d, x.d * y.d);
const mul = (x, y) => R(x.n * y.n, x.d * y.d), div = (x, y) => R(x.n * y.d, x.d * y.n);
const eq = (x, y) => x.n === y.n && x.d === y.d;
const dec = s => { s = s.replace(/,/g, '').replace(/[−-]/, '-'); const neg = s.startsWith('-'); s = s.replace('-', '');
  const [i, f = ''] = s.split('.'); const r = R(BigInt(i + f), 10n ** BigInt(f.length)); return neg ? R(-r.n, r.d) : r; };
const show = x => x.d === 1n ? `${x.n}` : `${x.n}/${x.d}`;

// The horizontal problem's text (fractions as [n/d], powers as ^e) → its value.
function evalExpr(src) {
  const toks = src.replace(/=\s*$/, '').match(/\[\d+\/\d+\]|\d[\d,]*(?:\.\d+)?|\^\d+|[+−\-×÷()√]/g) || [];
  let i = 0;
  const peek = () => toks[i], next = () => toks[i++];
  function atom() {
    let t = next();
    if (t === '(') { const v = sum(); next(); return pow(v); }
    if (t === '√') { const v = atom(); const r = BigInt(Math.round(Math.sqrt(Number(v.n)))); if (r * r !== v.n || v.d !== 1n) throw new Error('not a square'); return R(r); }
    if (t[0] === '[') { const [n, d] = t.slice(1, -1).split('/'); return pow(R(BigInt(n), BigInt(d))); }
    return pow(dec(t));
  }
  function pow(v) { if (peek() && peek()[0] === '^') { const e = BigInt(next().slice(1)); return R(v.n ** e, v.d ** e); } return v; }
  function unary() { if (peek() === '-' || peek() === '−') { next(); const v = unary(); return R(-v.n, v.d); } return atom(); }
  function prod() { let v = unary(); while (peek() === '×' || peek() === '÷') v = next() === '×' ? mul(v, unary()) : div(v, unary()); return v; }
  function sum() { let v = prod(); while (peek() === '+' || peek() === '−' || peek() === '-') v = next() === '+' ? add(v, prod()) : sub(v, prod()); return v; }
  const v = sum(); if (i !== toks.length) throw new Error(`unparsed tail in "${src}"`); return v;
}

// A problem record from the page → { value, kind, parts } ; an answer string → a check.
function solve(t) {
  let m;
  if ((m = t.match(/^DIV (\d+) (\d+)$/))) { const d = +m[1], dd = +m[2]; return { kind: 'div', d, dd, q: Math.floor(dd / d), r: dd % d }; }
  if ((m = t.match(/^Round (\d+) to nearest (tens|hundreds|thousands)$/))) { const p = { tens: 10, hundreds: 100, thousands: 1000 }[m[2]];
    return { kind: 'round', n: +m[1], place: p, value: R(BigInt(Math.floor(+m[1] / p + 0.5) * p)) }; }
  if ((m = t.match(/^([\d,]+(?:\.\d+)?) = \? × 10\^\?$/))) return { kind: 'sci?', value: dec(m[1]) };
  if ((m = t.match(/^(\d+) ([+−×]) (\d+)$/))) {
    const a = BigInt(m[1]), b = BigInt(m[3]), op = m[2];
    return { kind: 'stack', a: +m[1], b: +m[3], op, value: R(op === '+' ? a + b : op === '−' ? a - b : a * b) };
  }
  return { kind: 'expr', value: evalExpr(t) };
}
// A fraction key's written form (S8): "whole" 3, "mixed" 1 1/3, "proper" 2/5 (both in lowest terms, the
// fractional part proper), or what is wrong with it.
function fractionForm(a) {
  let m;
  if (/^\d+$/.test(a)) return 'whole';
  if ((m = a.match(/^(\d+) (\d+)\/(\d+)$/))) return +m[1] > 0 && +m[2] > 0 && +m[2] < +m[3] && gcd(BigInt(m[2]), BigInt(m[3])) === 1n ? 'mixed' : `bad mixed ${a}`;
  if ((m = a.match(/^(\d+)\/(\d+)$/))) return +m[1] === 0 ? '0/x' : +m[2] === 1 ? 'n/1' : +m[1] >= +m[2] ? 'improper' : gcd(BigInt(m[1]), BigInt(m[2])) === 1n ? 'proper' : 'not lowest';
  return `other ${a}`;
}
function answerOk(p, ans) {
  const a = ans.trim();
  if (p.kind === 'div') { const want = p.r ? `${p.q} r${p.r}` : `${p.q}`; return a === want; }
  if (p.kind === 'sci?') { const m = a.match(/^(\d+(?:\.\d+)?) x 10\^(\d+)$/); if (!m) return false;
    const c = dec(m[1]); return Number(c.n) / Number(c.d) >= 1 && Number(c.n) / Number(c.d) < 10 && eq(mul(c, R(10n ** BigInt(m[2]))), p.value); }
  let v;
  if (/^-?\d+\/\d+$/.test(a)) { const [n, d] = a.split('/'); v = R(BigInt(n), BigInt(d)); }
  else if (/^\d+ \d+\/\d+$/.test(a)) { const [w, f] = a.split(' '); const [n, d] = f.split('/'); v = R(BigInt(w) * BigInt(d) + BigInt(n), BigInt(d)); }
  else if (/^[−-]?[\d,]+(\.\d+)?$/.test(a)) v = dec(a);
  else return false;
  return eq(v, p.value);
}

// ── in the page: every sheet and key as plain records ──
function extract() {
  const canon = el => { let s = ''; for (const n of el.childNodes) {
    if (n.nodeType === 3) s += n.textContent;
    else if (n.classList.contains('mwg-fraction')) s += `[${n.querySelector('.mwg-fraction-num').textContent}/${n.querySelector('.mwg-fraction-den').textContent}]`;
    else if (n.tagName === 'SUP') s += '^' + n.textContent; else s += canon(n); } return s.replace(/\s+/g, ' ').trim(); };
  const item = c => {
    const dv = c.querySelector('.mwg-division-problem');
    if (dv) { const divisor = dv.querySelector('.mwg-division-divisor').textContent.trim();
      const dd = dv.querySelector('.mwg-division-dividend');
      // A key's division is the sheet's own since S8: its quotient a red span over the dividend (" r3" nested in it).
      const q = dd && dd.querySelector('span');
      if (q) return { t: `DIV ${divisor} ${dd.firstChild.textContent.trim()}`, ans: q.textContent.replace(/\u00a0/g, ' ').trim() };
      // Written across, a key's division is the sheet's own problem with its quotient in red at the right (S25).
      if (dd) { const red = c.querySelector(':scope > span'); return { t: `DIV ${divisor} ${dd.textContent.trim()}`, ans: red ? red.textContent : undefined }; }
      const col = dv.children[1]; return { t: `DIV ${divisor} ${col.children[1].textContent.trim()}`, ans: col.children[0].textContent }; }
    const st = c.querySelector('.mwg-problem-stack');
    if (st) return { t: `${st.querySelector('.mwg-problem-top').textContent.trim()} ${st.querySelector('.mwg-problem-operator').textContent.trim()} ${st.querySelector('.mwg-problem-bottom').textContent.trim()}`,
      ans: st.children[2] ? st.children[2].textContent : undefined };
    const hp = c.querySelector('.mwg-horiz-problem'); const red = c.querySelector(':scope > span');
    return { t: canon(hp).replace(/ =$/, ''), ans: red ? red.textContent : undefined };
  };
  const read = s => { const g = s.querySelector('.mwg-problems-grid, .mwg-horiz-grid');
    return { desc: s.querySelector('.mwg-ws-desc-text').textContent, horiz: g.classList.contains('mwg-horiz-grid'), items: [...g.children].map(item) }; };
  return { sheets: [...document.querySelectorAll('#mwgResults .mwg-worksheet')].map(read),
    keys: [...document.querySelectorAll('#mwgResults .mwg-answer-key-sheet')].map(read),
    errors: document.querySelector('#mwgErrors').innerText.trim() };
}

const digits = n => String(Math.abs(n)).length;
// What each level's label promises (TYPE_LABELS), as a test on the parsed problem.
const PROMISE = {
  add1: p => Number(p.value.n) < 10, add2: p => Number(p.value.n) >= 10 && Number(p.value.n) <= 20,
  add3: p => digits(p.a) === 2 && digits(p.b) === 1, add4: p => digits(p.a) === 2 && digits(p.b) === 2, add5: p => digits(p.a) === 3,
  sub1: p => p.a < 10 && p.value.n >= 0n, sub2: p => p.a >= 10 && p.a <= 20 && p.value.n >= 0n,
  sub3: p => digits(p.a) === 2 && digits(p.b) === 1 && p.value.n >= 0n, sub4: p => digits(p.a) === 2 && digits(p.b) === 2 && p.value.n >= 0n,
  sub5: p => digits(p.a) === 3 && p.value.n >= 0n,
  mul1: p => Math.min(p.a, p.b) <= 5, mul2: p => [p.a, p.b].some(x => x >= 6 && x <= 9),
  mul3: p => digits(p.a) === 2 && digits(p.b) === 1, mul4: p => digits(p.a) === 2 && digits(p.b) === 2, mul5: p => digits(p.a) === 3 && digits(p.b) === 1,
  div1: p => p.d >= 1 && p.d <= 5 && !p.r, div2: p => p.d >= 6 && p.d <= 9 && !p.r,
  div3: p => digits(p.dd) === 2 && p.d <= 9 && !p.r, div4: p => digits(p.dd) === 2 && p.d <= 9 && p.r > 0,
  div5: p => digits(p.dd) === 3 && p.d <= 9 && !p.r,
  'fractions[fractions-sub]': p => p.value.n >= 0n, 'decimals[decimals-sub]': p => p.value.n >= 0n,
};
const srv = await serve(); const browser = await launch();
const report = {};
try {
  const p = await openPage(browser, srv.base, 'index.html', { raw: true });
  if (control) {
    let body = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const plant = (from, to) => { if (!body.includes(from)) throw new Error(`control anchor missing: ${from}`); body = body.replace(from, to); };
    plant('while(d*q>99); return {html:divisionHtml(d,d*q,true),answer:q,', 'while(d*q>99); return {html:divisionHtml(d,d*q,true),answer:q+1,');
    plant('var desc = descriptionFor(type, grade, problems.length);', 'var desc = descriptionFor(type, grade, count);');
    plant('(whole ? whole + " " : "") + rest + "/" + d;', '(whole ? whole + " " : "") + rest + "/" + (d + 1);');
    await p.page.route(/\/index\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' });
    await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
  }
  await p.page.click(p.spec.modeToggle);
  await p.page.setChecked(p.spec.key, true);
  for (const sel of SELECTORS) {
    const [type, grade] = sel.split('@');
    const lines = Array.from({ length: N }, (_, i) => `S${i}, ${i}, ${type}, ${[30, 40, 50, 60][i % 4]}, ${grade};`);
    await p.page.fill(p.spec.advanced, lines.join('\n'));
    const before = await p.prints();
    await p.page.click(p.spec.generate);
    await p.page.waitForFunction(n => window.__prints > n, before, { timeout: 60000 });
    const r = await p.page.evaluate(extract);
    const st = report[sel] = { sheets: r.sheets.length, keys: r.keys.length, problems: 0, wrongKey: [], mismatch: 0, badCount: [], broken: [], badForm: [], badPlaces: [], notes: {} };
    const promise = PROMISE[type];
    const note = (k, v) => { (st.notes[k] ??= new Map()).set(v, ((st.notes[k].get(v)) || 0) + 1); };
    if (r.errors) st.pageErrors = r.errors;
    r.sheets.forEach((sh, i) => {
      const key = r.keys[i]; const want = +sh.desc.match(/^(\d+)/)[1];
      if (want !== sh.items.length) st.badCount.push(`${sh.desc} → ${sh.items.length} on the sheet`);
      note('grid', sh.horiz ? 'across' : 'stacked');
      sh.items.forEach((it, j) => {
        st.problems++;
        const k = key && key.items[j];
        if (!k || k.t !== it.t) { st.mismatch++; return; }
        const ans = k.ans;
        let pr; try { pr = solve(it.t); } catch (e) { st.wrongKey.push(`unparsed: ${it.t} (${e.message})`); return; }
        if (!answerOk(pr, ans || '')) st.wrongKey.push(`${it.t} → key "${ans}"`);
        if (promise && !promise(pr)) st.broken.push(it.t);
        // what the level's description promises, measured
        if (pr.kind === 'stack') { note('a digits', digits(pr.a)); note('b digits', digits(pr.b)); note(`op ${pr.op}`, '');
          const v = Number(pr.value.n); note('value<0', v < 0); if (sel.startsWith('add')) note('sum', v < 10 ? '<10' : v <= 20 ? '10-20' : '>20');
          if (sel.startsWith('add2')) note('sum max', Math.max(...[v]));
          if (sel.startsWith('sub1') || sel.startsWith('sub2')) note('minuend', pr.a < 10 ? '<10' : pr.a <= 20 ? '10-20' : '>20');
          if (sel.startsWith('mul1')) note('min factor ≤ 5', Math.min(pr.a, pr.b) <= 5);
          if (sel.startsWith('mul2')) note('a factor 6-9', [pr.a, pr.b].some(x => x >= 6 && x <= 9)); }
        if (pr.kind === 'div') { note('dividend digits', digits(pr.dd)); note('divisor', pr.d); note('quotient digits', digits(pr.q)); note('remainder', pr.r > 0); }
        if (pr.kind === 'round') { note('n < place', pr.n < pr.place); note('rounds to 0', pr.value.n === 0n); }
        if (pr.kind === 'expr' || pr.kind === 'sci?') { const v = pr.value; note('value<0', v.n < 0n);
          if (/\[/.test(it.t)) { const ka = (ans || '').trim(); const form = fractionForm(ka); note('key form', form);
            if (form !== (v.d === 1n ? 'whole' : v.n > v.d ? 'mixed' : 'proper')) st.badForm.push(`${it.t} → key "${ka}"`); }
          if (/-/.test(it.t)) note('hyphen-minus in problem', true);
          for (const f of it.t.match(/\[\d+\/\d+\]/g) || []) { const [n, d] = f.slice(1, -1).split('/').map(BigInt); note('operand in lowest terms', gcd(n, d) === 1n); }
          if (sel.startsWith('decimals')) for (const x of it.t.replace(/\[[^\]]*\]/g, '').match(/\d+(?:\.\d+)?/g) || []) note('places shown', (x.split('.')[1] || '').length);
          // the Decimals type shows the level's places on every number, sheet and key (S11, gate 6): "45.0 + 7.0 = 52.0"
          if (type === 'decimals') { const want = +grade <= 5 ? 1 : 2, re = new RegExp(`^\\d+\\.\\d{${want}}$`);
            for (const x of it.t.replace(/=\s*$/, '').match(/\d+(?:\.\d+)?/g) || []) if (!re.test(x)) { st.badPlaces.push(`${it.t}`); break; }
            if (ans !== undefined && ans !== null && !re.test(ans.trim())) st.badPlaces.push(`${it.t} → key "${ans.trim()}"`); }
          if (/^-/.test((ans || '').trim())) note('hyphen-minus in key', true); }
      });
    });
    const shown = Object.fromEntries(Object.entries(st.notes).map(([k, m]) => [k, Object.fromEntries([...m].sort())]));
    console.log(`${sel}: ${st.sheets} sheets, ${st.keys} keys, ${st.problems} problems; wrong key ${st.wrongKey.length}, key≠sheet ${st.mismatch}, count≠description ${st.badCount.length}${st.broken.length ? `, off its label ${st.broken.length} (${st.broken.slice(0, 3).join(' | ')})` : ''}${st.pageErrors ? '; page says: ' + st.pageErrors.slice(0, 120) : ''}`);
    console.log('   ' + JSON.stringify(shown));
    if (st.wrongKey.length) console.log('   e.g. ' + st.wrongKey.slice(0, 4).join(' | '));
    if (st.badCount.length) console.log('   e.g. ' + st.badCount.slice(0, 2).join(' | '));
  }
  console.log('\nindex.html');
  const all = Object.values(report);
  check(all.every(s => s.sheets === N && s.keys === N), `every selector made ${N} sheets and ${N} keys`);
  check(all.reduce((a, s) => a + s.problems, 0) > 0, `problems read: ${all.reduce((a, s) => a + s.problems, 0)}`);
  check(all.every(s => !s.mismatch), `every key problem is the sheet's own (${all.reduce((a, s) => a + s.mismatch, 0)} differ)`);
  check(all.every(s => !s.wrongKey.length), `every key answer recomputes (${all.reduce((a, s) => a + s.wrongKey.length, 0)} wrong)`);
  check(all.every(s => !s.broken.length), `every level keeps its label's promise (${Object.entries(report).filter(([, s]) => s.broken.length).map(([k, s]) => `${k} ${s.broken.length}/${s.problems}`).join(', ') || 'all'})`);
  check(all.every(s => !s.badCount.length), `every description's count is the sheet's (${all.reduce((a, s) => a + s.badCount.length, 0)} differ)`);
  const badPlaces = all.flatMap(s => s.badPlaces);
  check(badPlaces.length === 0, `every Decimals number shows the level's places, sheet and key (${badPlaces.length} not; ${badPlaces.slice(0, 3).join(' | ')})`);
  const badForm = all.flatMap(s => s.badForm);
  check(badForm.length === 0, `every fraction key is a whole number, a mixed number or a proper fraction, in lowest terms (${badForm.length} not; ${badForm.slice(0, 3).join(' | ')})`);
  check(!p.errors.length, `0 page errors (${p.errors.join('; ')})`);
  await p.close();
} finally { await browser.close(); await srv.close(); }
console.log(`\nS6-math-audit: ${fails.length ? fails.length + ' failing' : 'all green'}`);
process.exit(fails.length ? 1 : 0);
