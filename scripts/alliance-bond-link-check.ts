/**
 * V12 Alliance×Bond Link Gate CLI (offline).
 * npx tsx scripts/alliance-bond-link-check.ts LEDGER.json
 * 人物同盟×契约关系联表. Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateAllianceBondLink } from '@/agents/assembly/alliance-bond-link-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: alliance-bond-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateAllianceBondLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
