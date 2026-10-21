/**
 * V12 Alliance Ledger Gate CLI (offline).
 * npx tsx scripts/alliance-ledger-check.ts LEDGER.json [--min-events 3] [--max-idle-eps 30]
 * 人物同盟：seed→echo→payoff · 成员≥2 · 最少事件 · 空窗预警.
 * Exit 0 PASS · 35 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Reverse-engineered from 2026-10-20~21 hits《觉醒伪神7》《七块五养全家》《天降福星：沈家小渔》.
 */
import { readFileSync } from 'node:fs';
import { evaluateAllianceLedger } from '@/agents/assembly/alliance-ledger-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: alliance-ledger-check LEDGER.json [--min-events 3] [--max-idle-eps 30]\n',
  );
  process.exit(2);
}
const r = evaluateAllianceLedger(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--min-events') ? { minEvents: Number(arg('--min-events')) } : {}),
  ...(arg('--max-idle-eps') ? { maxIdleEps: Number(arg('--max-idle-eps')) } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 35);
