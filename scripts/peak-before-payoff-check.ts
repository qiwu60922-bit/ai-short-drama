/**
 * V12 Peak-Before-Payoff Gate CLI (offline).
 * npx tsx scripts/peak-before-payoff-check.ts LEDGER.json [--min-peak-to-payoff-eps 0]
 * 巅峰后再兑现 · 蓄仇清算. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3. Reverse-engineered from 2026-10-22～10-23 hits
 * 《卖掉养老房那天，我重获新生》《和离后我带女儿横扫魔域》(+昨日《婆婆装瘫七年》候选).
 */
import { readFileSync } from 'node:fs';
import { evaluatePeakBeforePayoff } from '@/agents/assembly/peak-before-payoff-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: peak-before-payoff-check LEDGER.json [--min-peak-to-payoff-eps 0]\n',
  );
  process.exit(2);
}
const r = evaluatePeakBeforePayoff(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--min-peak-to-payoff-eps')
    ? { minPeakToPayoffEps: Number(arg('--min-peak-to-payoff-eps')) }
    : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
