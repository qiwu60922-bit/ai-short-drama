/**
 * V12 Vest/Mask×Peak Link Gate CLI (offline).
 * npx tsx scripts/vest-mask-peak-link-check.ts LEDGER.json
 * 马甲/假人设掉落 × 羞辱峰值 跨账本联表. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3. Reverse-engineered from 2026-10-29 hits
 * 《飞上枝头难成凤凰》《警报！叶楚出狱》《云海不相逢》.
 */
import { readFileSync } from 'node:fs';
import { evaluateVestMaskPeakLink } from '@/agents/assembly/vest-mask-peak-link-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: vest-mask-peak-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateVestMaskPeakLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
