// Probe (loop S7, pass G on the two standard pages): the numbers themselves. For every level / fact code of
// math-facts.html (default) or math-minute.html (`--page math-minute.html`) it pastes N students into
// Advanced Input, generates with the answer key, reads every sheet and key back from the DOM and asserts:
//   - every sheet holds the level's count on its rows class, under the level's description;
//   - every key problem is the sheet's own, and every key answer recomputes here;
//   - every problem keeps the description's promise (PROMISE) and lies in the level's documented family
//     (FAMILY, re-enumerated here from the page's comments, not read from its code);
//   - the deck: a sheet holds min(count, family) distinct facts, the facts on a full deck appear floor or
//     ceil(count / family) times each, the same fact never stands twice in a row, a fact dealt twice on one
//     sheet that can be written both ways is written both ways, and every family fact is dealt somewhere;
//   - the split levels (half + / half −, one row per operation) keep their split.
// It reports what it measured per level (operand 0 / 1 shares, which operand stands on top, fact counts).
// `--n <k>` sheets per level (default 200), `--only <code>`, `--control` serves the page with three planted
// defects (a ×7 key off by one, a deal that draws with replacement, a family outside its promise) and must
// fail at least three checks.
//   node scripts/loop/probes/S7-facts-audit.mjs [--page math-minute.html] [--n 200] [--only x7] [--control]
import fs from 'node:fs';
import path from 'node:path';
import { serve, launch, openPage, ROOT } from '../harness.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const FILE = arg('--page') || 'math-facts.html';
const N = +(arg('--n') || 200), ONLY = arg('--only'), control = process.argv.includes('--control');
const fails = [];
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails.push(msg); };

const ADD = '+', SUB = '−', MUL = '×', DIV = '÷';
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const form = (op, a, b) => [op, a, b];                         // division: [÷, dividend, divisor]
const both = (op, x, y) => x === y ? [form(op, x, y)] : [form(op, x, y), form(op, y, x)];
const value = ([op, a, b]) => op === ADD ? a + b : op === SUB ? a - b : op === MUL ? a * b : a / b;
const factKey = ([op, a, b]) => (op === ADD || op === MUL) ? `${Math.min(a, b)}${op}${Math.max(a, b)}` : `${a}${op}${b}`;
const formKey = f => f.join(' ');
const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const COUNT = { 30: 'Thirty', 40: 'Forty', 50: 'Fifty', 60: 'Sixty' };

// ── each level: { code, count, desc, family: [forms], promise(form, index), split?: [[ops, n], ...] in order ──
const LEVELS = [];
if (FILE === 'math-facts.html') {
  const addFam = {
    '+0+1': [0, 1].flatMap(x => range(0, 9).flatMap(n => both(ADD, x, n))),
    doubles: range(1, 9).map(n => form(ADD, n, n)),
    'doubles+1': range(1, 8).flatMap(n => both(ADD, n, n + 1)),
  };
  for (let n = 2; n <= 10; n++) addFam['+' + n] = range(0, Math.min(9, 18 - n)).flatMap(o => both(ADD, n, o));
  const subFam = {
    '-self': range(1, 10).flatMap(a => [form(SUB, a, a), form(SUB, a, 0), form(SUB, a, 1)]),
    '-fr10': range(0, 10).map(b => form(SUB, 10, b)),
  };
  for (let n = 2; n <= 9; n++) subFam['-' + n] = range(0, 10).map(d => form(SUB, d + n, n));
  const mulFam = {}, divFam = {};
  for (let n = 0; n <= 12; n++) mulFam['x' + n] = range(0, 12).flatMap(o => both(MUL, n, o));
  for (let n = 1; n <= 12; n++) divFam['/' + n] = range(0, 12).map(q => form(DIV, n * q, n));
  const one = (code, desc, family, promise) => LEVELS.push({ code, count: 30, desc, family, promise });
  one('+0+1', 'Thirty addition facts — plus zero or one', addFam['+0+1'], ([o, a, b]) => o === ADD && (a <= 1 || b <= 1));
  one('doubles', 'Thirty addition facts — doubles to 9 + 9', addFam.doubles, ([o, a, b]) => o === ADD && a === b && a <= 9);
  one('doubles+1', 'Thirty addition facts — doubles plus one', addFam['doubles+1'], ([o, a, b]) => o === ADD && Math.abs(a - b) === 1);
  for (let n = 2; n <= 10; n++) one('+' + n, `Thirty addition facts — plus ${WORD[n]}`, addFam['+' + n], ([o, a, b]) => o === ADD && (a === n || b === n));
  one('-self', 'Thirty subtraction facts — minus itself, zero, or one', subFam['-self'], ([o, a, b]) => o === SUB && (b === a || b === 0 || b === 1));
  one('-fr10', 'Thirty subtraction facts — friends of ten', subFam['-fr10'], ([o, a, b]) => o === SUB && a === 10 && b <= 10);
  for (let n = 2; n <= 9; n++) one('-' + n, `Thirty subtraction facts — minus ${WORD[n]}`, subFam['-' + n], ([o, a, b]) => o === SUB && b === n && a >= b);
  for (let n = 0; n <= 12; n++) one('x' + n, `Thirty multiplication facts — times ${WORD[n]}`, mulFam['x' + n], ([o, a, b]) => o === MUL && (a === n || b === n));
  for (let n = 1; n <= 12; n++) one('/' + n, `Thirty division facts — divided by ${WORD[n]}`, divFam['/' + n], ([o, a, b]) => o === DIV && b === n && a % b === 0);
  const uniq = forms => [...new Map(forms.map(f => [formKey(f), f])).values()];
  const allAdd = uniq(Object.values(addFam).flat()), allSub = uniq(Object.values(subFam).flat());
  const allMul = uniq(Object.values(mulFam).flat()), allDiv = uniq(Object.values(divFam).flat());
  const mixed = (prefix, noun, family, promise, split) => [30, 40, 50, 60].forEach(c => LEVELS.push({
    code: prefix + c, count: c, desc: `${COUNT[c]} mixed ${noun}`, family, promise, split: split && split(c) }));
  mixed('mix+', 'addition facts', allAdd, ([o]) => o === ADD);
  mixed('mix-', 'subtraction facts', allSub, ([o, a, b]) => o === SUB && a >= b);
  mixed('mixpm', 'addition and subtraction facts', [...allAdd, ...allSub], ([o, a, b]) => o === ADD || (o === SUB && a >= b),
    c => ({ shuffled: true, parts: [[[ADD], c / 2, allAdd], [[SUB], c / 2, allSub]] }));
  mixed('mixx', 'multiplication facts', allMul, ([o]) => o === MUL);
  mixed('mix/', 'division facts', allDiv, ([o, a, b]) => o === DIV && b >= 1 && a % b === 0);
  mixed('mixmd', 'multiplication and division facts', [...allMul, ...allDiv], ([o, a, b]) => o === MUL || (o === DIV && a % b === 0),
    c => ({ shuffled: true, parts: [[[MUL], c / 2, allMul], [[DIV], c / 2, allDiv]] }));
} else if (FILE === 'math-minute.html') {
  // The page's documented ranges (its comments): additionFacts(maxSum, allowZero), subtractionFacts(maxTop),
  // teenSubtractionFacts(), multiplicationFacts(minFactor, maxFactor, allowZero), divisionFacts(lo, hi).
  const add = (maxSum, zero) => range(zero ? 0 : 1, 9).flatMap(a => range(zero ? 0 : 1, 9).filter(b => a + b <= maxSum).map(b => form(ADD, a, b)));
  const sub9 = range(1, 9).flatMap(a => range(0, a).map(b => form(SUB, a, b)));
  const teen = range(10, 18).flatMap(a => range(a - 9, 9).map(b => form(SUB, a, b)));
  const mul = (lo, hi, zero) => range(zero ? 0 : 1, 9).flatMap(a => range(Math.max(lo, 1), hi).map(b => form(MUL, a, b)));
  const div = (lo, hi) => range(lo, hi).flatMap(d => range(1, 10).map(q => form(DIV, d * q, d)));
  const L = (code, count, desc, family, promise, split) => LEVELS.push({ code: String(code), count, desc, family, promise, split });
  const isAdd = ([o]) => o === ADD, isSub = ([o, a, b]) => o === SUB && a >= b, isMul = ([o]) => o === MUL, isDiv = ([o, a, b]) => o === DIV && a % b === 0;
  L(1, 30, 'Thirty addition facts, sums less than ten', add(9, true), f => isAdd(f) && value(f) < 10);
  L(2, 30, 'Thirty addition facts, sums through eighteen', add(18, false), f => isAdd(f) && value(f) <= 18);
  L(3, 30, 'Thirty subtraction facts, numbers through nine', sub9, f => isSub(f) && f[1] <= 9 && f[2] <= 9);
  L(4, 30, 'Thirty subtraction facts, numbers through twenty', teen, f => isSub(f) && f[1] <= 20);
  [[5, 40, 'Forty'], [7, 50, 'Fifty'], [9, 60, 'Sixty']].forEach(([c, n, w]) => L(c, n, `${w} addition facts`, add(18, true), isAdd));
  [[6, 40, 'Forty'], [8, 50, 'Fifty'], [10, 60, 'Sixty']].forEach(([c, n, w]) => L(c, n, `${w} subtraction facts`, teen, isSub));
  L(11, 30, 'Thirty easy multiplication facts', mul(0, 5, true), f => isMul(f) && Math.min(f[1], f[2]) <= 5);
  L(12, 30, 'Thirty hard multiplication facts', mul(6, 9, false), f => isMul(f) && Math.max(f[1], f[2]) >= 6);
  [[13, 40, 'Forty'], [14, 50, 'Fifty'], [15, 60, 'Sixty']].forEach(([c, n, w]) => L(c, n, `${w} multiplication facts`, mul(0, 9, true), isMul));
  L(16, 30, 'Thirty easy division facts', div(1, 5), f => isDiv(f) && f[2] <= 5);
  L(17, 30, 'Thirty hard division facts', div(6, 9), f => isDiv(f) && f[2] >= 6);
  [[18, 40, 'Forty'], [19, 50, 'Fifty'], [20, 60, 'Sixty']].forEach(([c, n, w]) => L(c, n, `${w} division facts`, div(1, 9), isDiv));
  const mixFam = [add(18, true), teen, mul(0, 9, true), div(1, 9)];
  L(21, 40, 'Mixed facts: addition, subtraction, multiplication, division', mixFam.flat(),
    f => [isAdd, isSub, isMul, isDiv].some(t => t(f)),
    { shuffled: false, parts: [[[ADD], 10, mixFam[0]], [[SUB], 10, mixFam[1]], [[MUL], 10, mixFam[2]], [[DIV], 10, mixFam[3]]] });
} else throw new Error(`no levels for ${FILE}`);
const RUN = LEVELS.filter(l => !ONLY || l.code === ONLY);

// ── in the page: every sheet and key as plain records ──
function extract() {
  const read = s => {
    const g = s.querySelector('.problems-grid');
    return { desc: s.querySelector('.description-text').textContent, rows: (g.className.match(/rows-(\d+)/) || [])[1],
      items: [...g.children].map(c => {
        const st = c.querySelector('.problem-stack');
        if (st) { const ans = st.querySelector(':scope > span:not(.problem-top)');
          return [st.querySelector('.problem-operator').textContent.trim(), st.querySelector('.problem-top').textContent.trim(),
            st.querySelector('.problem-bottom').textContent.trim(), ans ? ans.textContent : null]; }
        const dv = c.querySelector('.division-problem');
        if (dv) { const dd = dv.querySelector('.division-dividend'), ans = dd.querySelector('span');
          return ['÷', dd.firstChild.nodeValue.trim(), dv.querySelector('.division-divisor').textContent.trim(), ans ? ans.textContent : null]; }
        return ['?', '', '', null];
      }) };
  };
  return { all: [...document.querySelectorAll('#results .worksheet')].map(read), errors: document.querySelector('#errors').innerText.trim() };
}

const srv = await serve(); const browser = await launch();
const report = {};
try {
  const p = await openPage(browser, srv.base, FILE, { raw: true });
  if (control) {
    let body = fs.readFileSync(path.join(ROOT, FILE), 'utf8');
    const plant = (from, to) => { if (!body.includes(from)) throw new Error(`control anchor missing: ${from}`); body = body.replace(from, to); };
    plant('return dealProblems(makeDeck(facts), count);',
      'return Array.from({ length: count }, function () { return facts[randomInt(0, facts.length - 1)]; });');
    if (FILE === 'math-facts.html') {
      plant('op === "\\u00d7" ? a * b : a - b;', 'op === "\\u00d7" ? a * b + (b === 7 ? 1 : 0) : a - b;');
      plant('stack("\\u2212", a, 0), stack("\\u2212", a, 1));', 'stack("\\u2212", a, 0), stack("\\u2212", a, 2));');
    } else {
      plant('op === "\\u2212" ? a - b : a * b;', 'op === "\\u2212" ? a - b : a * b + (b === 7 ? 1 : 0);');
      plant('case 1:  return deal(additionFacts(9, true), 30);', 'case 1:  return deal(additionFacts(10, true), 30);');
    }
    await p.page.route(new RegExp(`/${FILE.replace('.', '\\.')}$`), r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await p.page.reload({ waitUntil: 'load' });
    await p.page.waitForSelector(`${p.spec.students} ${p.spec.entry}`);
  }
  // Every level the page offers is audited (a new one fails here until it is added above).
  const offered = await p.page.$$eval('select[name="level"] option', os => [...new Set(os.map(o => o.value).filter(Boolean))]);
  const known = new Set(LEVELS.map(l => l.code));
  check(offered.length > 0 && offered.every(v => known.has(v)) && LEVELS.every(l => offered.includes(l.code)),
    `the probe audits every level the dropdown offers (${offered.length} offered, ${LEVELS.length} audited; unknown: ${offered.filter(v => !known.has(v)).join(' ') || 'none'})`);
  await p.page.click(p.spec.modeToggle);
  await p.page.setChecked(p.spec.key, true);
  for (const lv of RUN) {
    const lines = Array.from({ length: N }, (_, i) => `S${i}, ${i}, ${lv.code};`);
    await p.page.fill(p.spec.advanced, lines.join('\n'));
    const before = await p.prints();
    await p.page.click(p.spec.generate);
    await p.page.waitForFunction(n => window.__prints > n, before, { timeout: 60000 });
    const { all, errors } = await p.page.evaluate(extract);
    const sheets = all.slice(0, all.length / 2), keys = all.slice(all.length / 2);
    const famKeys = new Map();                                   // fact key -> Set of form keys the family writes
    lv.family.forEach(f => { const k = factKey(f); if (!famKeys.has(k)) famKeys.set(k, new Set()); famKeys.get(k).add(formKey(f)); });
    const r = report[lv.code] = { sheets: sheets.length, keys: keys.length, errors, problems: 0, badCount: 0, badDesc: 0, badRows: 0,
      keyDiffers: 0, keyWrong: 0, broken: 0, outside: 0, outsideEx: [], distinctOff: 0, unbalanced: 0, twiceInRow: 0, oneWay: 0,
      splitOff: 0, dealt: new Set(), family: famKeys.size, zeroOp: 0, oneOp: 0, zeroAns: 0, top: {}, maxAns: -1, maxTop: -1 };
    sheets.forEach((s, i) => {
      const k = keys[i];
      if (s.items.length !== lv.count) r.badCount++;
      if (s.desc !== lv.desc || !k || k.desc !== `ANSWER KEY — ${lv.desc}`) r.badDesc++;
      if (s.rows !== String(lv.count / 10)) r.badRows++;
      const forms = s.items.map(([o, a, b]) => [o, +a, +b]);
      forms.forEach((f, j) => {
        r.problems++;
        const ki = k && k.items[j];
        if (!ki || ki[0] !== s.items[j][0] || ki[1] !== s.items[j][1] || ki[2] !== s.items[j][2]) r.keyDiffers++;
        if (!ki || ki[3] === null || String(value(f)) !== ki[3]) r.keyWrong++;
        if (!lv.promise(f, j) || value(f) < 0 || !Number.isInteger(value(f))) r.broken++;
        const fk = factKey(f);
        if (!famKeys.has(fk) || !famKeys.get(fk).has(formKey(f))) { r.outside++; if (r.outsideEx.length < 3) r.outsideEx.push(formKey(f)); }
        r.dealt.add(fk);
        if (f[1] === 0 || f[2] === 0) r.zeroOp++;
        if (f[1] === 1 || f[2] === 1) r.oneOp++;
        if (value(f) === 0) r.zeroAns++;
        r.maxAns = Math.max(r.maxAns, value(f)); r.maxTop = Math.max(r.maxTop, f[1]);
        r.top[f[1]] = (r.top[f[1]] || 0) + 1;
        if (j > 0 && factKey(forms[j - 1]) === fk) r.twiceInRow++;
      });
      // The deck: each part (the whole sheet, or each operation's share) deals distinct facts, balanced.
      const parts = lv.split ? lv.split.parts : [[null, lv.count, lv.family]];
      let off = 0;
      parts.forEach(([ops, n, fam], pi) => {
        const pf = lv.split ? (lv.split.shuffled ? forms.filter(f => ops.includes(f[0])) : forms.slice(pi * n, pi * n + n)) : forms;
        if (lv.split && (pf.length !== n || pf.some(f => !ops.includes(f[0])))) r.splitOff++;
        const size = new Set(fam.map(factKey)).size, counts = {};
        pf.forEach(f => { const fk = factKey(f); counts[fk] = (counts[fk] || 0) + 1; });
        const distinct = Object.keys(counts).length;
        if (distinct !== Math.min(n, size)) off++;
        const vals = Object.values(counts);
        if (Math.max(...vals) > Math.ceil(n / size) || (n >= size && Math.min(...vals) < Math.floor(n / size))) r.unbalanced++;
        // a fact dealt twice that the family writes both ways shows both ways
        const seen = {};
        pf.forEach(f => { const fk = factKey(f); (seen[fk] = seen[fk] || new Set()).add(formKey(f)); });
        Object.entries(seen).forEach(([fk, fs]) => { if (counts[fk] >= 2 && famKeys.has(fk) && famKeys.get(fk).size === 2 && fs.size < 2) r.oneWay++; });
      });
      if (off) r.distinctOff++;
    });
    r.undealt = [...famKeys.keys()].filter(k => !r.dealt.has(k));
    // Coverage is required only when N sheets make a miss by chance unlikely (expected misses < 0.01):
    // 50 sheets of mixmd30 draw 15 of 156 division facts a sheet and miss ~1 by chance.
    const parts = lv.split ? lv.split.parts : [[null, lv.count, lv.family]];
    r.coverageRequired = parts.every(([, n, fam]) => { const size = new Set(fam.map(factKey)).size;
      return size * Math.pow(1 - Math.min(n, size) / size, N) < 0.01; });
    console.log(`${lv.code.padEnd(9)} ${String(r.sheets).padStart(3)}+${String(r.keys).padEnd(3)} probs ${String(r.problems).padStart(5)} | family ${String(r.family).padStart(3)} dealt ${String(r.dealt.size).padStart(3)}` +
      ` | 0-operand ${(100 * r.zeroOp / r.problems).toFixed(0).padStart(2)}% 1-operand ${(100 * r.oneOp / r.problems).toFixed(0).padStart(2)}% answer 0 ${(100 * r.zeroAns / r.problems).toFixed(0).padStart(2)}% max ${r.maxAns}` +
      (r.badCount + r.badDesc + r.badRows + r.keyDiffers + r.keyWrong + r.broken + r.outside + r.distinctOff + r.unbalanced + r.twiceInRow + r.oneWay + r.splitOff + r.undealt.length
        ? ` | ${JSON.stringify({ badCount: r.badCount, badDesc: r.badDesc, badRows: r.badRows, keyDiffers: r.keyDiffers, keyWrong: r.keyWrong, broken: r.broken,
          outside: r.outside, outsideEx: r.outsideEx, distinctOff: r.distinctOff, unbalanced: r.unbalanced, twiceInRow: r.twiceInRow, oneWay: r.oneWay, splitOff: r.splitOff,
          undealt: r.undealt.slice(0, 6) })}` : ''));
    const tops = Object.entries(r.top).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t, n]) => `${t}:${(100 * n / r.problems).toFixed(0)}%`).join(' ');
    if (process.argv.includes('--tops')) console.log(`          top operands: ${tops}`);
  }
  const R = Object.values(report), sum = k => R.reduce((s, r) => s + (Array.isArray(r[k]) ? r[k].length : r[k]), 0);
  console.log(`\n${FILE}`);
  check(R.length === RUN.length && R.every(r => r.sheets === N && r.keys === N), `every level made ${N} sheets and ${N} keys`);
  check(sum('problems') > 0, `problems read: ${sum('problems')}`);
  check(sum('badCount') + sum('badRows') === 0, `every sheet holds its level's count on its rows class (${sum('badCount')} counts, ${sum('badRows')} rows off)`);
  check(sum('badDesc') === 0, `every sheet and key carries its level's description (${sum('badDesc')} differ)`);
  check(sum('keyDiffers') === 0, `every key problem is the sheet's own (${sum('keyDiffers')} differ)`);
  check(sum('keyWrong') === 0, `every key answer recomputes (${sum('keyWrong')} wrong)`);
  check(sum('broken') === 0, `every problem keeps its description's promise, no negative or fractional answer (${sum('broken')} break it)`);
  check(sum('outside') === 0, `every problem lies in its level's documented family (${sum('outside')} outside)`);
  check(sum('distinctOff') + sum('unbalanced') === 0, `the deck: min(count, family) distinct facts a sheet, each dealt floor/ceil(count / family) times (${sum('distinctOff')} + ${sum('unbalanced')} sheets off)`);
  check(sum('twiceInRow') === 0, `no fact stands twice in a row (${sum('twiceInRow')})`);
  check(sum('oneWay') === 0, `a fact dealt twice on a sheet is written both ways when it can be (${sum('oneWay')} written one way)`);
  check(sum('splitOff') === 0, `the split levels keep their split (${sum('splitOff')} sheets off)`);
  const name = r => Object.keys(report).find(k => report[k] === r);
  check(R.every(r => !r.coverageRequired || r.undealt.length === 0), `every family fact is dealt on some sheet (${R.filter(r => r.coverageRequired && r.undealt.length).map(name).join(' ') || 'all'}` +
    `${R.some(r => !r.coverageRequired) ? `; not required at --n ${N}: ${R.filter(r => !r.coverageRequired).map(name).join(' ')}` : ''})`);
  check(R.every(r => !r.errors), `no level reports an error (${R.map(r => r.errors).filter(Boolean)[0] || 'none'})`);
  check(p.errors.length === 0, `0 page errors (${p.errors.join(' | ')})`);
  await p.close();
} catch (e) { check(false, e.message.split('\n')[0]); }
finally { await browser.close(); await srv.close(); }
console.log(fails.length ? `\nS7-facts-audit: ${fails.length} failing` : '\nS7-facts-audit: all green');
process.exit(fails.length ? 1 : 0);
