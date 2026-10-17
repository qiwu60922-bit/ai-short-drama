/**
 * V12 Assembly Review Gate CLI (offline, local ffprobe only).
 *   npx tsx scripts/assembly-review-check.ts PLAN.json
 *   npx tsx scripts/assembly-review-check.ts PLAN.json --record S01 --checks visual,audio,timing --evidence "实际播放 0–3s…"
 * Reviews live in reviews.json next to PLAN.json; each is bound to the clip's sha256 + in/out
 * spec, so changing the media or trim invalidates the old review.
 * Exit 0 PASS · 33 FAIL · 2 usage. PASS ≠ Final ≠ G3. Records claims only, never auto-approves.
 * Adapted from zhsjwjw3888/ai-drama-post scripts/studio.py (MIT).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  AssemblyReviewsSchema,
  evaluateAssemblyPlan,
  projectRelative,
  recordAssemblyReview,
  type AssemblyPlan,
  type ClipProbe,
  type ReviewCheck,
} from '@/agents/assembly/assembly-review-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: assembly-review-check PLAN.json [--record CLIP --checks visual,audio,timing --evidence TEXT]\n',
  );
  process.exit(2);
}
const root = dirname(file);
const plan = JSON.parse(readFileSync(file, 'utf8')) as AssemblyPlan;
const reviewsPath = join(root, 'reviews.json');
const reviews = existsSync(reviewsPath)
  ? AssemblyReviewsSchema.parse(JSON.parse(readFileSync(reviewsPath, 'utf8')))
  : {};

const abs = (p: string) => {
  const rel = projectRelative(p);
  return rel === null ? null : join(root, rel);
};
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');

function probe(p: string): ClipProbe | undefined {
  try {
    const j = JSON.parse(
      execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', p], {
        encoding: 'utf8',
      }),
    ) as { streams: { codec_type: string; duration?: string }[]; format: { duration?: string } };
    const v = j.streams.find((s) => s.codec_type === 'video');
    return {
      hasVideo: !!v,
      hasAudio: j.streams.some((s) => s.codec_type === 'audio'),
      durationSec: Number(v?.duration ?? j.format.duration ?? 0),
    };
  } catch {
    return undefined;
  }
}

const recordId = arg('--record');
if (recordId) {
  const clip = plan.clips?.find((c) => c.id === recordId);
  const p = clip ? abs(clip.path) : null;
  if (!clip || !p || !existsSync(p)) {
    process.stderr.write(`clip not found or file missing: ${recordId}\n`);
    process.exit(2);
  }
  const checks = (arg('--checks') ?? '').split(',').filter(Boolean) as ReviewCheck[];
  const next = recordAssemblyReview(reviews, plan, recordId, sha(p), checks, arg('--evidence') ?? '');
  writeFileSync(reviewsPath, JSON.stringify(next, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ recorded: recordId, automatic_quality_judgment: false }) + '\n');
  process.exit(0);
}

const probes: Record<string, ClipProbe> = {};
const shas: Record<string, string> = {};
for (const c of plan.clips ?? []) {
  const p = abs(c.path);
  if (!p || !existsSync(p)) continue;
  shas[c.path] = sha(p);
  const pr = probe(p);
  if (pr) probes[c.path] = pr;
}
if (plan.mix) {
  const p = abs(plan.mix);
  const pr = p && existsSync(p) ? probe(p) : undefined;
  if (pr) probes[plan.mix] = pr;
}
let subtitleText: string | undefined;
if (plan.subtitles) {
  const p = abs(plan.subtitles);
  if (p && existsSync(p)) subtitleText = readFileSync(p, 'utf8');
}
const r = evaluateAssemblyPlan(plan, { probes, sha256: shas, reviews, subtitleText });
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 33);
