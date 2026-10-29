/**
 * V12 Ensemble-Cast Gate CLI (offline).
 * npx tsx scripts/ensemble-cast-check.ts LEDGER.json
 * 家庭群像差异化分工. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateEnsembleCast } from '@/agents/assembly/ensemble-cast-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: ensemble-cast-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateEnsembleCast(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
