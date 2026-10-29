/**
 * V12 Reaction×Peak Link Gate CLI (offline).
 * npx tsx scripts/reaction-peak-link-check.ts LEDGER.json
 * 反应镜×巅峰联表. Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateReactionPeakLink } from '@/agents/assembly/reaction-peak-link-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: reaction-peak-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateReactionPeakLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
