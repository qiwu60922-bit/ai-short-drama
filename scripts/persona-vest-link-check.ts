/**
 * V12 Persona×Vest Link Gate CLI (offline).
 * npx tsx scripts/persona-vest-link-check.ts LEDGER.json
 * 人设卡×马甲联表. Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluatePersonaVestLink } from '@/agents/assembly/persona-vest-link-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: persona-vest-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluatePersonaVestLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
