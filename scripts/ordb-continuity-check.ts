/**
 * V12 ORDB Continuity Gate CLI (offline).
 *   npx tsx scripts/ordb-continuity-check.ts RUN.json
 * 多集连续性：时间线严格递增 · 角色事实漂移 · 未知角色 · 转场断裂 · 重复对白.
 * Exit 0 PASS · 33 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Rules rewritten from soulverse92500-ui/open-reality-drama-benchmark evaluator.py (MIT).
 */
import { readFileSync } from 'node:fs';
import { evaluateOrdbRun } from '@/agents/assembly/ordb-continuity-gate';

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: ordb-continuity-check RUN.json\n');
  process.exit(2);
}
const r = evaluateOrdbRun(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.pass ? 0 : 33);
