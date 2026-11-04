// Compile every inline <script> of every root HTML page; one syntax error kills a page's whole JS
// while the HTML still renders. Exit 1 on the first failure.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
let bad = 0, n = 0;
for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, i = 0;
  while ((m = re.exec(html))) {
    i++; n++;
    try { new vm.Script(m[1], { filename: `${f}#script${i}` }); }
    catch (e) { bad++; console.log(`FAIL ${f} inline script ${i}: ${e.message}`); }
  }
}
console.log(`check-inline-js: ${n} inline scripts, ${bad} failing`);
process.exit(bad ? 1 : 0);
