/**
 * V12 SSC Preflight Gate CLI (offline). npx tsx scripts/ssc-preflight-check.ts PAYLOAD.json
 * 人物数量锁 · XYZ · 冻结前资产 · Panel9 衔接. Exit 0 PASS · 31 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Rules adapted from yzsp-studio/ssc (MIT).
 */
import { readFileSync } from 'node:fs';
import { evaluateSscPreflight } from '@/agents/assembly/ssc-preflight-gate';

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: ssc-preflight-check PAYLOAD.json\n');
  process.exit(2);
}
const r = evaluateSscPreflight(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 31);
