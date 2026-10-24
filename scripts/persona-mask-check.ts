/**
 * V12 Persona-Mask Gate CLI (offline).
 * npx tsx scripts/persona-mask-check.ts LEDGER.json
 * 伪装人设/假身份账本 · 抓包与崩塌. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3. Reverse-engineered from 2026-10-24 hits
 * 《枝头春意闹》《逃婚三年，江少的花心人设崩了》《算不平的糊涂账》.
 */
import { readFileSync } from 'node:fs';
import { evaluatePersonaMask } from '@/agents/assembly/persona-mask-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: persona-mask-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluatePersonaMask(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
