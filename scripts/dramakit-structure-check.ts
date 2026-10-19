/**
 * V12 Dramakit Structure Gate CLI (offline).
 *   npx tsx scripts/dramakit-structure-check.ts SHOTLIST.json
 * 分镜结构/时长/钩子密度机械闸门.
 * Exit 0 PASS · 33 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Rules rewritten from gaoren7716-lab/dramakit engine/lib/scan.py (MIT).
 */
import { readFileSync } from 'node:fs';
import { evaluateDramakitShotlist } from '@/agents/assembly/dramakit-structure-gate';

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: dramakit-structure-check SHOTLIST.json\n');
  process.exit(2);
}
const r = evaluateDramakitShotlist(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.pass ? 0 : 33);
