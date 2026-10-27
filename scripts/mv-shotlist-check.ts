/**
 * V12 MV Shotlist Gate CLI (offline).
 * npx tsx scripts/mv-shotlist-check.ts SHOTLIST.json
 * 分镜表时间连续 · 景别分布 · 段落时长.
 * Exit 0 PASS · 35 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Method from MIT blackiseki/anime-mv-art-direction (no prompts/APIs vendored).
 */
import { readFileSync } from 'node:fs';
import { evaluateMvShotlist } from '@/agents/assembly/mv-shotlist-gate';

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: mv-shotlist-check SHOTLIST.json\n');
  process.exit(2);
}

const r = evaluateMvShotlist(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 35);
