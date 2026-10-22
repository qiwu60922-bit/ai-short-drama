/**
 * V12 Series Rhythm Profile CLI (offline).
 * npx tsx scripts/series-rhythm-check.ts SHOT_SPEC.json [--profile dense|default|intrigue|slow_burn] [--min-events N] [--max-shot N] [--require-cut-motive]
 * Exit 0 PASS · 27 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Reverse-engineered from 2026-10-21 hits《大唐憨婿第四季》《当家主母的自我修养》《婆婆装瘫七年，我高调离婚！》。
 */
import { readFileSync } from 'node:fs';
import { evaluateSeriesRhythm } from '@/agents/assembly/series-rhythm-profile';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: series-rhythm-check SHOT_SPEC.json [--profile dense|default|intrigue|slow_burn] [--min-events N] [--max-shot N] [--require-cut-motive]\n',
  );
  process.exit(2);
}
const r = evaluateSeriesRhythm(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--profile') ? { profile: arg('--profile') } : {}),
  ...(arg('--min-events') ? { minEventsPer90s: Number(arg('--min-events')) } : {}),
  ...(arg('--max-shot') ? { maxShotSeconds: Number(arg('--max-shot')) } : {}),
  requireCutMotive: a.includes('--require-cut-motive'),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 27);
