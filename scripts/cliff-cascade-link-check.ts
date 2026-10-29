/**
 * V12 Cliff×Cascade Link Gate CLI (offline).
 * npx tsx scripts/cliff-cascade-link-check.ts LEDGER.json
 * 跨集悬念承接×开场叠钩. Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateCliffCascadeLink } from '@/agents/assembly/cliff-cascade-link-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: cliff-cascade-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateCliffCascadeLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
