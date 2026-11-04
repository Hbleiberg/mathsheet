// Shared shape rules for docs/IMPROVEMENT_LOG.md — the improvement loop's live state file.
// The ledger is CURRENT STATE; history goes to docs/IMPROVEMENT_ARCHIVE.md (append-only),
// measurements and refutations to docs/loop-findings.md. check-ledger.mjs enforces these.
export const LEDGER = 'docs/IMPROVEMENT_LOG.md';
export const ARCHIVE = 'docs/IMPROVEMENT_ARCHIVE.md';
export const FINDINGS = 'docs/loop-findings.md';
export const PASSES = 'docs/loop-passes.md';

export const SURFACES = ['index.html', 'math-minute.html', 'math-facts.html'];
// Roster: letter → { name, kind }. Surface passes take one page per run; suite passes take all.
export const ROSTER = {
  A: { name: 'performance & speed', kind: 'surface' },
  B: { name: 'print & export', kind: 'surface' },
  C: { name: 'aesthetics', kind: 'surface' },
  D: { name: 'accessibility', kind: 'surface' },
  E: { name: 'errors & robustness', kind: 'suite' },
  F: { name: 'cross-page consistency', kind: 'suite' },
  G: { name: 'math correctness & pedagogy', kind: 'surface' },
  H: { name: 'teacher walkthrough', kind: 'surface' },
  I: { name: 'first load, saved data & safety', kind: 'suite' },
  L: { name: 'metadata & discoverability', kind: 'suite' },
  M: { name: 'mobile & touch', kind: 'surface' },
};
export const SURFACE_PASSES = Object.keys(ROSTER).filter(k => ROSTER[k].kind === 'surface');
export const SUITE_PASSES = Object.keys(ROSTER).filter(k => ROSTER[k].kind === 'suite');

export const SESSION_RE = /\bS(\d{1,5})\b/;
export const CANDIDATE_RE = /^- \[ \] P([1-4]) \| ([^|]+) \| (.+) \| found S(\d{1,5})$/;
export const SEED_RE = /^- \[ \] seed \| ([^|]+) \| (.+) \| from S(\d{1,5})$/;
export const PAGE_SEED_RE = /^- \[ \] page \| ([^|]+) \| (.+) \| from S(\d{1,5})$/;
export const DONE_RE = /^- \[x\] S(\d{1,5}) \| (\d{4}-\d{2}-\d{2}) \| ([0-9a-f]{7,40}|—|reverted) \| ([^|]+) \| (.+) \| (.+)$/;
export const SESSION_LOG_RE = /^- S(\d{1,5}) \| (\d{4}-\d{2}-\d{2}) \| .+$/;
export const SUITE_ROW_RE = /^- ([A-Z]) [^:(]+\(suite\): last (S\d{1,5}|—)(?: \((.*)\))?$/;
export const SURFACE_ROW_RE = /^- ([A-Z]) [^:(]+\(surface\): last (S\d{1,5}|—)(?: \((.*)\))?$/;
export const POINTER_RE = /^\*\*Next session \(S(\d{1,5})\):\*\*/;
export const NEXT_NOTE_RE = /^⚑ next: ([A-Z])(?: on (\S+))?/m;

export const LIMITS = {
  totalBytes: 60_000,
  lineChars: 500,          // any line outside the handoff block
  handoffLineChars: 1200,  // the pointer block
  doneSessions: 5,         // distinct sessions kept in ## Done
  sessionLogRows: 20,
  candidateAgeSessions: 60, // a P4 older than this (in sessions) leaves for the archive
};

export const REQUIRED = [
  '## Candidates', '## Feature seeds', '## Page seeds', '## Awaiting the maintainer', '## In progress',
  '## Done', '## Metrics', '### Per-session log', '### Surface coverage', '### Discovery-pass rotation',
];

/** Split ledger text into { preamble, sections: [{ heading, lines }] }. */
export function parseSections(text) {
  const lines = text.split('\n'); const preamble = []; const sections = []; let cur = null;
  for (const l of lines) {
    if (/^#{2,3} /.test(l)) { cur = { heading: l, lines: [] }; sections.push(cur); }
    else if (cur) cur.lines.push(l); else preamble.push(l);
  }
  return { preamble, sections };
}
export const section = (parsed, prefix) => parsed.sections.find(s => s.heading.startsWith(prefix));

/** The surface-coverage table → { [letter]: { [surface]: sessionNumber | -1 } }. */
export function parseCoverage(parsed) {
  const sec = section(parsed, '### Surface coverage'); if (!sec) return null;
  const rows = sec.lines.filter(l => /^\|/.test(l)).map(l => l.split('|').slice(1, -1).map(c => c.trim()));
  if (rows.length < 2) return null;
  const header = rows[0].slice(1); const table = {};
  for (const r of rows.slice(2)) {
    const letter = r[0]; if (!/^[A-Z]$/.test(letter)) continue;
    table[letter] = {};
    header.forEach((h, i) => { const m = (r[i + 1] || '').match(/^S(\d+)/); table[letter][h] = m ? Number(m[1]) : -1; });
  }
  return { header, table };
}

/** Suite rows → { [letter]: sessionNumber | -1 }. */
export function parseSuiteRows(parsed) {
  const sec = section(parsed, '### Discovery-pass rotation'); const out = {};
  for (const l of sec ? sec.lines : []) {
    const m = l.match(SUITE_ROW_RE); if (m) out[m[1]] = m[2] === '—' ? -1 : Number(m[2].slice(1));
  }
  return out;
}

export function pointerSession(text) { const m = text.match(POINTER_RE) || text.match(/\*\*Next session \(S(\d+)\)/); return m ? Number(m[1]) : null; }
