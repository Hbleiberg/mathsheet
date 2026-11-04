// Session close-out: every static check and the smoke, in order; the first failure stops it.
// `--cdn` adds the PDF arm to the smoke. Run from anywhere.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const cdn = process.argv.includes('--cdn');
const steps = [
  ['check-inline-js', ['check-inline-js.mjs']],
  ['check-ledger', ['check-ledger.mjs']],
  ['coverage --check', ['coverage.mjs', '--check']],
  ['smoke', ['smoke.mjs', ...(cdn ? ['--cdn'] : [])]],
];
for (const [name, args] of steps) {
  console.log(`\n=== ${name}`);
  const r = spawnSync(process.execPath, args.map((a, i) => i === 0 ? path.join(here, a) : a), { stdio: 'inherit' });
  if (r.status !== 0) { console.log(`\ncloseout: ${name} FAILED`); process.exit(1); }
}
console.log('\ncloseout: all checks passed');
