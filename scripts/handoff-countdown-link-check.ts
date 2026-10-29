/**
 * V12 Handoff×Countdown Link CLI (offline).
 * npx tsx scripts/handoff-countdown-link-check.ts LEDGER.json
 * Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateHandoffCountdownLink } from '@/agents/assembly/handoff-countdown-link-gate';

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: handoff-countdown-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateHandoffCountdownLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
