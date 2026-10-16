/**
 * V12 Cut Timeline Gate CLI (offline).
 * npx tsx scripts/cut-timeline-check.ts TIMELINE.json [--max-beat-sec 4] [--min-beat-sec 0.5]
 * 帧级分镜时间轴：C###·画布偶数·cue 范围·角色引用·尺合计==target_frames·2–4s 节奏 WARN.
 * Exit 0 PASS · 33 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Adapted from RNA4219/video-storyboard-forge scripts/storyboard.py (MIT).
 */
import { readFileSync } from 'node:fs';
import { evaluateCutTimeline } from '@/agents/assembly/cut-timeline-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: cut-timeline-check TIMELINE.json [--max-beat-sec 4] [--min-beat-sec 0.5]\n',
  );
  process.exit(2);
}
const r = evaluateCutTimeline(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--max-beat-sec') ? { maxBeatSec: Number(arg('--max-beat-sec')) } : {}),
  ...(arg('--min-beat-sec') ? { minBeatSec: Number(arg('--min-beat-sec')) } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 33);
