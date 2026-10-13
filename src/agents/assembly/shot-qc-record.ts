/**
 * Per-shot QC record: first / mid / last frame stills for HUMAN identity review.
 * Never auto-passes: record starts PENDING_REVIEW; only recordHumanVerdict (named reviewer) changes it,
 * and even then V11_G3 stays NOT_EVALUATED. Local ffmpeg only.
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ffprobeInfo, type ProbeInfo } from './ffmpeg-concat-worker';

export type QcFrameRole = 'first' | 'mid' | 'last';
export interface QcStill { role: QcFrameRole; timeSeconds: number; path: string; contentSha256: string; }
export interface ShotQcRecord {
  schemaVersion: 1;
  shotId: string;
  takePath: string;
  takeSha256?: string;
  probe: ProbeInfo;
  stills: QcStill[];
  identity: { status: 'PENDING_REVIEW' | 'HUMAN_PASS' | 'HUMAN_FAIL'; reviewer: string | null; reviewedAt: string | null; note: string };
  gates: { V11_G3: 'NOT_EVALUATED'; publish: 'FORBIDDEN'; autoPass: 'FORBIDDEN' };
  createdAt: string;
}

export interface QcDeps {
  probe?: (p: string) => Promise<ProbeInfo>;
  extractFrame?: (takePath: string, t: number, outPath: string) => Promise<void>;
  sha256File?: (p: string) => Promise<string>;
  now?: () => string;
}

/** Sample times: 0, duration/2, last frame (duration − 1/fps). */
export function qcSampleTimes(p: ProbeInfo): Record<QcFrameRole, number> {
  const frame = p.fps > 0 ? 1 / p.fps : 0.04;
  const last = Math.max(0, p.durationSeconds - frame);
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return { first: 0, mid: r(p.durationSeconds / 2), last: r(last) };
}

const ffExtract = (takePath: string, t: number, outPath: string) => new Promise<void>((res, rej) =>
  execFile('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', takePath, '-frames:v', '1', outPath], (e) => (e ? rej(e) : res())));
const fileSha = async (p: string) => createHash('sha256').update(await readFile(p)).digest('hex');

export async function createShotQcRecord(input: { shotId: string; takePath: string; takeSha256?: string; qcDir: string }, deps: QcDeps = {}): Promise<ShotQcRecord> {
  const probe = await (deps.probe ?? ffprobeInfo)(input.takePath);
  const times = qcSampleTimes(probe);
  const dir = join(input.qcDir, input.shotId);
  await mkdir(dir, { recursive: true });
  const stills: QcStill[] = [];
  for (const role of ['first', 'mid', 'last'] as const) {
    const path = join(dir, `${role}.png`);
    await (deps.extractFrame ?? ffExtract)(input.takePath, times[role], path);
    stills.push({ role, timeSeconds: times[role], path, contentSha256: await (deps.sha256File ?? fileSha)(path) });
  }
  const record: ShotQcRecord = {
    schemaVersion: 1, shotId: input.shotId, takePath: input.takePath, ...(input.takeSha256 ? { takeSha256: input.takeSha256 } : {}),
    probe, stills,
    identity: { status: 'PENDING_REVIEW', reviewer: null, reviewedAt: null, note: 'Human three-frame identity review required; no auto-pass' },
    gates: { V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' },
    createdAt: (deps.now ?? (() => new Date().toISOString()))(),
  };
  await writeFile(join(dir, 'qc-record.json'), JSON.stringify(record, null, 2));
  return record;
}

/** Only path to change identity status. Requires a named human reviewer; G3 untouched. */
export function recordHumanVerdict(rec: ShotQcRecord, v: { reviewer: string; verdict: 'HUMAN_PASS' | 'HUMAN_FAIL'; note?: string; at: string }): ShotQcRecord {
  const reviewer = v.reviewer.trim();
  if (!reviewer || /^(auto|bot|agent|system|ci)$/i.test(reviewer)) throw new Error('human reviewer name required (no auto/bot verdicts)');
  if (rec.stills.length !== 3) throw new Error('three stills required before verdict');
  return { ...rec, identity: { status: v.verdict, reviewer, reviewedAt: v.at, note: v.note ?? '' }, gates: { ...rec.gates } };
}
