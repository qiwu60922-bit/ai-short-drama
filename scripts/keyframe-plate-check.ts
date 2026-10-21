/**
 * V12 Keyframe Plate Gate CLI (offline).
 * npx tsx scripts/keyframe-plate-check.ts PLAN.json [--min-plates 2] [--min-clips 1]
 * H3 关键帧板：FL2VA · 同房间锁 · 邻镜共享衔接板 · 禁末帧链式.
 * Exit 0 PASS · 35 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Method from MIT stealbmin/h3-keyframe-plate-sequence (no media vendored).
 */
import { readFileSync } from 'node:fs';
import { evaluateKeyframePlate } from '@/agents/assembly/keyframe-plate-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: keyframe-plate-check PLAN.json [--min-plates 2] [--min-clips 1]\n',
  );
  process.exit(2);
}
const r = evaluateKeyframePlate(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--min-plates') ? { minPlates: Number(arg('--min-plates')) } : {}),
  ...(arg('--min-clips') ? { minClips: Number(arg('--min-clips')) } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 35);
