/**
 * V12 Bond-Contract Gate CLI (offline).
 * npx tsx scripts/bond-contract-check.ts LEDGER.json
 * 契约关系→真情升级/解除账本. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3. Reverse-engineered from 2026-10-28 hits
 * 《邱秘书的婚事》《后妈只想苟…》《十八岁太奶奶驾到…》《在八月盛夏》.
 */
import { readFileSync } from 'node:fs';
import { evaluateBondContract } from '@/agents/assembly/bond-contract-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: bond-contract-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateBondContract(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
