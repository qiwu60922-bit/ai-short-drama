/**
 * V12 Story-Ledger Suite CLI (offline) — rehearsal/assembly 总入口.
 * npx tsx scripts/story-ledger-suite-check.ts BUNDLE.json
 * Hang #71–#76 gates. Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateStoryLedgerSuite } from '@/agents/assembly/story-ledger-suite';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: story-ledger-suite-check BUNDLE.json\n');
  process.exit(2);
}
const r = evaluateStoryLedgerSuite(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
