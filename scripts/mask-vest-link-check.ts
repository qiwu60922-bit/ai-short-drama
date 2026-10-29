/** V12 mask-vest-link CLI. Exit 0/36/2. PASS ≠ Final ≠ G3. */
import { readFileSync } from 'node:fs';
import { evaluateMaskVestLink } from '@/agents/assembly/mask-vest-link-gate';
const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: mask-vest-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateMaskVestLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
