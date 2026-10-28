/**
 * V12 H3 Budget Gate CLI (offline).
 * npx tsx scripts/h3-budget-check.ts BUDGET.json
 * 离线 H3 成本方案 · 分层2K · 渠道对比.
 * Exit 0 PASS · 35 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Method from MIT unrealinux/minimax-h3-budget-video (no prompts/APIs vendored).
 */
import { readFileSync } from 'node:fs';
import { evaluateH3Budget } from '@/agents/assembly/h3-budget-gate';

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: h3-budget-check BUDGET.json\n');
  process.exit(2);
}

const r = evaluateH3Budget(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 35);
