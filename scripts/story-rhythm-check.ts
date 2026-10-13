/**
 * V12 Story Rhythm Gate CLI (offline). npx tsx scripts/story-rhythm-check.ts SHOT_SPEC.json [--min-events 10] [--max-shot 8] [--require-cut-motive]
 * Exit 0 PASS · 27 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateStoryRhythm } from '@/agents/assembly/story-rhythm-gate';

const a = process.argv; const arg = (k: string) => { const i = a.indexOf(k); return i > 0 ? a[i + 1] : undefined; };
const file = a[2];
if (!file || file.startsWith('--')) { process.stderr.write('usage: story-rhythm-check SHOT_SPEC.json [opts]\n'); process.exit(2); }
const r = evaluateStoryRhythm(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--min-events') ? { minEventsPer90s: Number(arg('--min-events')) } : {}),
  ...(arg('--max-shot') ? { maxShotSeconds: Number(arg('--max-shot')) } : {}),
  requireCutMotive: a.includes('--require-cut-motive'),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 27);
