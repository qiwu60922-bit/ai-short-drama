/**
 * V12 Motif Callback Gate CLI (offline).
 * npx tsx scripts/motif-callback-check.ts LEDGER.json [--min-appearances 3] [--max-idle-eps 40]
 * 视觉母题/道具回扣：seed→echo→payoff · 最少出现次数 · 空窗预警.
 * Exit 0 PASS · 34 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Reverse-engineered from 2026-10-17~18 红果 hits《盛夏芬德拉》《首辅娇娘》《小奶团回裴家,全家抢着宠!》.
 */
import { readFileSync } from 'node:fs';
import { evaluateMotifCallbacks } from '@/agents/assembly/motif-callback-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: motif-callback-check LEDGER.json [--min-appearances 3] [--max-idle-eps 40]\n',
  );
  process.exit(2);
}
const r = evaluateMotifCallbacks(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--min-appearances') ? { minAppearances: Number(arg('--min-appearances')) } : {}),
  ...(arg('--max-idle-eps') ? { maxIdleEps: Number(arg('--max-idle-eps')) } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 34);
