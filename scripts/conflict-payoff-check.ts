/**
 * V12 Conflict Payoff Gap Gate CLI (offline).
 * npx tsx scripts/conflict-payoff-check.ts LEDGER.json [--max-gap-eps 1] [--max-same-ep-sec 60]
 * 冲突→兑现间隔：不受隔夜气 · 同集秒级上限 · 逾期未兑现. Exit 0 PASS · 32 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3. Reverse-engineered from 2026-10-16 红果 hits《帐中香》《东北后妈》《公路求生…》.
 */
import { readFileSync } from 'node:fs';
import { evaluateConflictPayoffGap } from '@/agents/assembly/conflict-payoff-gap-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: conflict-payoff-check LEDGER.json [--max-gap-eps 1] [--max-same-ep-sec 60]\n',
  );
  process.exit(2);
}
const r = evaluateConflictPayoffGap(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--max-gap-eps') ? { maxGapEpisodes: Number(arg('--max-gap-eps')) } : {}),
  ...(arg('--max-same-ep-sec') ? { maxSameEpGapSec: Number(arg('--max-same-ep-sec')) } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 32);
