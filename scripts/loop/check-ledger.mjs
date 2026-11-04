// Fails a close-out whose ledger breaks the schema in scripts/loop/ledger-rules.mjs.
import fs from 'node:fs';
import path from 'node:path';
import * as R from './ledger-rules.mjs';
const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const text = fs.readFileSync(path.join(ROOT, R.LEDGER), 'utf8');
const parsed = R.parseSections(text);
const problems = [];
const bad = (m) => problems.push(m);

for (const h of R.REQUIRED) if (!R.section(parsed, h)) bad(`missing heading ${h}`);
if (Buffer.byteLength(text) > R.LIMITS.totalBytes) bad(`ledger is ${Buffer.byteLength(text)} bytes (> ${R.LIMITS.totalBytes}); move history to the archive`);

// Line lengths (the handoff block — from the pointer to the end of its section — gets more room)
let inHandoff = false;
text.split('\n').forEach((l, i) => {
  if (R.POINTER_RE.test(l)) inHandoff = true;
  if (/^#{2,3} /.test(l)) inHandoff = false;
  const cap = inHandoff ? R.LIMITS.handoffLineChars : R.LIMITS.lineChars;
  if (l.length > cap) bad(`line ${i + 1} is ${l.length} chars (> ${cap})`);
});

const rowsOf = (prefix, re, label) => {
  const sec = R.section(parsed, prefix); if (!sec) return [];
  const rows = sec.lines.filter(l => l.startsWith('- '));
  for (const l of rows) if (!re.test(l)) bad(`${label} row off-schema: ${l.slice(0, 90)}`);
  return rows;
};
const cands = rowsOf('## Candidates', R.CANDIDATE_RE, 'Candidate');
rowsOf('## Feature seeds', R.SEED_RE, 'Feature seed');
rowsOf('## Page seeds', R.PAGE_SEED_RE, 'Page seed');
const done = rowsOf('## Done', R.DONE_RE, 'Done');
const log = rowsOf('### Per-session log', R.SESSION_LOG_RE, 'Per-session log');

// Candidates sorted by priority
const pris = cands.map(l => l.match(R.CANDIDATE_RE)).filter(Boolean).map(m => Number(m[1]));
if (pris.some((p, i) => i && p < pris[i - 1])) bad('Candidates are not priority-sorted (P1 first)');

// Done keeps the last N sessions; the session log the last N rows
const doneSessions = new Set(done.map(l => l.match(R.DONE_RE)).filter(Boolean).map(m => m[1]));
if (doneSessions.size > R.LIMITS.doneSessions) bad(`## Done holds ${doneSessions.size} sessions (> ${R.LIMITS.doneSessions}); move the oldest to the archive`);
if (log.length > R.LIMITS.sessionLogRows) bad(`Per-session log has ${log.length} rows (> ${R.LIMITS.sessionLogRows})`);

// Aged P4s
const ptr = R.pointerSession(text);
if (ptr == null) bad('no **Next session (SN):** pointer');
for (const l of cands) {
  const m = l.match(R.CANDIDATE_RE);
  if (m && m[1] === '4' && ptr != null && ptr - Number(m[4]) > R.LIMITS.candidateAgeSessions) bad(`P4 older than ${R.LIMITS.candidateAgeSessions} sessions: ${l.slice(0, 80)}`);
}
if ((text.match(/\*\*Next session \(S\d+\):\*\*/g) || []).length !== 1) bad('exactly one Next session pointer is required');

// Rotation: every roster letter has a row of its kind; the coverage table has every surface pass × surface
const rot = R.section(parsed, '### Discovery-pass rotation');
for (const [letter, def] of Object.entries(R.ROSTER)) {
  const re = def.kind === 'suite' ? R.SUITE_ROW_RE : R.SURFACE_ROW_RE;
  if (!rot || !rot.lines.some(l => { const m = l.match(re); return m && m[1] === letter; })) bad(`rotation row missing or off-schema for pass ${letter} (${def.kind})`);
}
const cov = R.parseCoverage(parsed);
if (!cov) bad('Surface coverage table unreadable');
else {
  for (const s of R.SURFACES) if (!cov.header.includes(s)) bad(`Surface coverage lacks column ${s}`);
  for (const l of R.SURFACE_PASSES) if (!cov.table[l]) bad(`Surface coverage lacks row ${l}`);
}

if (problems.length) { console.log('check-ledger: FAIL'); problems.forEach(p => console.log('  - ' + p)); process.exit(1); }
console.log(`check-ledger: ok (${cands.length} candidates, ${doneSessions.size} done sessions, pointer S${ptr})`);
