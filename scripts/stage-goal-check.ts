/**
 * V12 Stage Goal Gate CLI (offline).
 * npx tsx scripts/stage-goal-check.ts LEDGER.json [--max-stall-eps 5] [--warn-remaining-eps 2]
 * 季级阶段目标账本：destination · 推进 · 停滞 · 倒计时.
 * Exit 0 PASS · 32 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateStageGoals } from '@/agents/assembly/stage-goal-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: stage-goal-check LEDGER.json [--max-stall-eps 5] [--warn-remaining-eps 2]\n',
  );
  process.exit(2);
}
const r = evaluateStageGoals(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--max-stall-eps') ? { maxStallEps: Number(arg('--max-stall-eps')) } : {}),
  ...(arg('--warn-remaining-eps') ? { warnRemainingEps: Number(arg('--warn-remaining-eps')) } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 32);
