/**
 * V12 Frequency×Peak Link Gate CLI (offline).
 * npx tsx scripts/frequency-peak-link-check.ts LEDGER.json
 * 第N次 tipping × 情绪峰值 跨账本联表. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateFrequencyPeakLink } from '@/agents/assembly/frequency-peak-link-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: frequency-peak-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateFrequencyPeakLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
