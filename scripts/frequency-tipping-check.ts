/**
 * V12 Frequency-Tipping Gate CLI (offline).
 * npx tsx scripts/frequency-tipping-check.ts LEDGER.json
 * 第 N 次/第 N 天 tipping 计数器. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3. Reverse-engineered from 2026-10-26 hits
 * 《备用联系人》《边军破刀：一路砍到裂土封王》《修仙满级回现代，我让全家横着走》.
 */
import { readFileSync } from 'node:fs';
import { evaluateFrequencyTipping } from '@/agents/assembly/frequency-tipping-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: frequency-tipping-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateFrequencyTipping(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
