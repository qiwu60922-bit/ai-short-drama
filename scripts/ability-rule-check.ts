/**
 * V12 Ability Rule Gate CLI (offline).
 * npx tsx scripts/ability-rule-check.ts LEDGER.json [--max-first-use-eps 1] [--max-dormant-eps 3]
 * 金手指规则账本：每周期次数 · 二选一选项 · 全场唯一持有人 · 故事日不倒退 · 拿到就用 · 熄火预警.
 * Exit 0 PASS · 32 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Reverse-engineered from 2026-10-16 红果 hits《伪人降临！我是全场唯一预言家》《一块钱硬币，玩出万亿商业帝国》《家有五女…》.
 */
import { readFileSync } from 'node:fs';
import { evaluateAbilityRules } from '@/agents/assembly/ability-rule-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: ability-rule-check LEDGER.json [--max-first-use-eps 1] [--max-dormant-eps 3]\n',
  );
  process.exit(2);
}
const r = evaluateAbilityRules(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--max-first-use-eps') ? { maxFirstUseGapEps: Number(arg('--max-first-use-eps')) } : {}),
  ...(arg('--max-dormant-eps') ? { maxDormantEps: Number(arg('--max-dormant-eps')) } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 32);
