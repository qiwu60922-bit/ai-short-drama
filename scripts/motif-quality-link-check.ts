/** V12 motif-quality-link CLI. Exit 0/36/2. PASS ≠ Final ≠ G3. */
import { readFileSync } from 'node:fs';
import { evaluateMotifQualityLink } from '@/agents/assembly/motif-quality-link-gate';
const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: motif-quality-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateMotifQualityLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
