/**
 * V12 Persona×Mask Link CLI (offline).
 * npx tsx scripts/persona-mask-link-check.ts LEDGER.json
 * Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluatePersonaMaskLink } from '@/agents/assembly/persona-mask-link-gate';

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: persona-mask-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluatePersonaMaskLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
