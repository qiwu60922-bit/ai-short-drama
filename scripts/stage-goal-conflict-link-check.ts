/**
 * V12 Stage-Goal×Conflict Link Gate CLI (offline).
 * npx tsx scripts/stage-goal-conflict-link-check.ts LEDGER.json
 * 季目标×冲突快兑现联表. Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateStageGoalConflictLink } from '@/agents/assembly/stage-goal-conflict-link-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: stage-goal-conflict-link-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateStageGoalConflictLink(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
