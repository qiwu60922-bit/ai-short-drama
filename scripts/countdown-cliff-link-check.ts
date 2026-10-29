/** V12 Countdown×Cliff Link CLI. Exit 0/36/2. PASS ≠ Final ≠ G3. */
import { readFileSync } from 'node:fs';
import { evaluateCountdownCliffLink } from '@/agents/assembly/countdown-cliff-link-gate';
const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: countdown-cliff-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateCountdownCliffLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
