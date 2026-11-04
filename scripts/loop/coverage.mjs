// Names the stalest pass for the next session from the ledger's Surface coverage table and the
// suite rotation rows: never-run first, then the lowest last-session number; ties go to the
// handoff's `⚑ next:` note, then roster order. `--check` validates the note against the record.
import fs from 'node:fs';
import path from 'node:path';
import * as R from './ledger-rules.mjs';
const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const text = fs.readFileSync(path.join(ROOT, R.LEDGER), 'utf8');
const parsed = R.parseSections(text);
const cov = R.parseCoverage(parsed); const suite = R.parseSuiteRows(parsed);
// A suite row whose note says `blocked` (L until the hosting question is answered) is out of the pick.
const rot = R.section(parsed, '### Discovery-pass rotation');
const blocked = new Set((rot ? rot.lines : []).map(l => l.match(R.SUITE_ROW_RE)).filter(m => m && /blocked/i.test(m[3] || '')).map(m => m[1]));
const cells = [];
for (const l of R.SURFACE_PASSES) for (const s of R.SURFACES) cells.push({ letter: l, surface: s, last: (cov && cov.table[l] && cov.table[l][s]) ?? -1 });
for (const l of R.SUITE_PASSES) if (!blocked.has(l)) cells.push({ letter: l, surface: null, last: suite[l] ?? -1 });
const min = Math.min(...cells.map(c => c.last));
const stalest = cells.filter(c => c.last === min);
const note = text.match(R.NEXT_NOTE_RE);
let pick = stalest[0];
if (note) { const hinted = stalest.find(c => c.letter === note[1] && (c.surface || null) === (note[2] || null)); if (hinted) pick = hinted; }
const label = c => `${c.letter} ${R.ROSTER[c.letter].name}${c.surface ? ' on ' + c.surface : ' (suite)'}${c.last < 0 ? ' — never run' : ' — last S' + c.last}`;
if (blocked.size) console.log('blocked (skipped in the pick): ' + [...blocked].join(', '));
console.log('stalest:'); stalest.forEach(c => console.log('  ' + label(c)));
console.log('pick: ' + label(pick));
if (process.argv.includes('--check')) {
  if (!note) { console.log('coverage --check: FAIL — the handoff has no `⚑ next:` note'); process.exit(1); }
  const valid = cells.some(c => c.letter === note[1] && (c.surface || null) === (note[2] || null));
  if (!valid) { console.log(`coverage --check: FAIL — \`⚑ next: ${note[0].slice(8)}\` names no pass/surface the roster has`); process.exit(1); }
  const noted = cells.find(c => c.letter === note[1] && (c.surface || null) === (note[2] || null));
  if (noted.last !== min) console.log(`coverage --check: note picks ${label(noted)} while the stalest is ${label(stalest[0])} — allowed only with a reason in the handoff`);
  console.log('coverage --check: ok');
}
