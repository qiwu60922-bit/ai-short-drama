/**
 * V12 Fake-Ledger Reconcile Gate CLI (offline).
 * npx tsx scripts/fake-ledger-reconcile-check.ts LEDGER.json
 * 假账本条目级对账. Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateFakeLedgerReconcile } from '@/agents/assembly/fake-ledger-reconcile-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: fake-ledger-reconcile-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateFakeLedgerReconcile(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
