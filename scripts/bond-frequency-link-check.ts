/**
 * V12 Bond×Frequency Link Gate CLI (offline).
 * npx tsx scripts/bond-frequency-link-check.ts LEDGER.json
 * 契约升级/解除 × 第N次 tipping 跨账本联表. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3. Reverse-engineered from 2026-10-29 hits
 * 《警报！叶楚出狱》《云海不相逢》《飞上枝头难成凤凰》.
 */
import { readFileSync } from 'node:fs';
import { evaluateBondFrequencyLink } from '@/agents/assembly/bond-frequency-link-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: bond-frequency-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateBondFrequencyLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
