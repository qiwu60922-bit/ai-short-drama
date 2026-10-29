/**
 * V12 Amnesia×Motif Link Gate CLI (offline).
 * npx tsx scripts/amnesia-motif-link-check.ts LEDGER.json
 * 失忆唤回 × 视觉母题 跨账本联表. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateAmnesiaMotifLink } from '@/agents/assembly/amnesia-motif-link-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: amnesia-motif-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateAmnesiaMotifLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
