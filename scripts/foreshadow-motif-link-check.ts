/**
 * V12 Foreshadow×Motif Link Gate CLI (offline).
 * npx tsx scripts/foreshadow-motif-link-check.ts LEDGER.json
 * 剧情伏笔×视觉母题联表. Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateForeshadowMotifLink } from '@/agents/assembly/foreshadow-motif-link-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: foreshadow-motif-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateForeshadowMotifLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
