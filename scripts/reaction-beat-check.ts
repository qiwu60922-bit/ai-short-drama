/**
 * V12 Reaction Beat Gate CLI (offline).
 * npx tsx scripts/reaction-beat-check.ts SHOTSPEC.json [--reaction-window-sec 8] [--require-reaction]
 * 天幕式反应镜：反转/增量/悬念后需 reaction；孤儿 reaction 预警.
 * Exit 0 PASS · 32 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateReactionBeats } from '@/agents/assembly/reaction-beat-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: reaction-beat-check SHOTSPEC.json [--reaction-window-sec 8] [--lookback-sec 12] [--require-reaction]\n',
  );
  process.exit(2);
}
const r = evaluateReactionBeats(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--reaction-window-sec') ? { reactionWindowSec: Number(arg('--reaction-window-sec')) } : {}),
  ...(arg('--lookback-sec') ? { lookbackSec: Number(arg('--lookback-sec')) } : {}),
  ...(a.includes('--require-reaction') ? { requireReaction: true } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 32);
