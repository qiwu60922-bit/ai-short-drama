/**
 * V12 Foreshadow Ledger Gate CLI (offline). npx tsx scripts/foreshadow-check.ts LEDGER.json [--min-ferment 2] [--max-idle 8]
 * 伏笔账本：ID唯一 · 回收状态矛盾 · 悬置 · 发酵期 · 并发上限 · 分集悬空引用/状态同步. Exit 0 PASS · 31 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Rules adapted from mengxiujie/ManjuForge scripts/consistency_check.py (MIT-0).
 */
import { readFileSync } from 'node:fs';
import { evaluateForeshadowLedger } from '@/agents/assembly/foreshadow-ledger-gate';

const a = process.argv; const arg = (k: string) => { const i = a.indexOf(k); return i > 0 ? a[i + 1] : undefined; };
const file = a[2];
if (!file || file.startsWith('--')) { process.stderr.write('usage: foreshadow-check LEDGER.json [opts]\n'); process.exit(2); }
const r = evaluateForeshadowLedger(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--min-ferment') ? { minFermentEps: Number(arg('--min-ferment')) } : {}),
  ...(arg('--max-idle') ? { maxIdleEps: Number(arg('--max-idle')) } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 31);
