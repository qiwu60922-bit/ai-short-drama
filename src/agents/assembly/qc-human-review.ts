/**
 * QC human review import: review file (exported from qc/index.html) → qc-record.json updates.
 * All-or-nothing: any schema/unknown-shot/stale-stills error ⇒ nothing written.
 * Only HUMAN_PASS / HUMAN_FAIL by a named human; G3 stays NOT_EVALUATED; history kept.
 */
import { readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { recordHumanVerdict, type ShotQcRecord } from './shot-qc-record';

export const NON_HUMAN_REVIEWER = /^(auto|bot|agent|system|ci|grok|grok ?bot|ai|machine)$/i;

export const QcReviewFileSchema = z.object({
  schemaVersion: z.literal(1),
  reviewer: z.string().transform((s) => s.trim()).refine((s) => s.length > 0 && !NON_HUMAN_REVIEWER.test(s), 'real human reviewer name required'),
  reviewedAt: z.string().min(1),
  verdicts: z.array(z.object({
    shotId: z.string().min(1),
    verdict: z.enum(['HUMAN_PASS', 'HUMAN_FAIL']),
    note: z.string().default(''),
    stillsSha256: z.array(z.string().regex(/^[a-f0-9]{64}$/i)).length(3),
  }).refine((v) => v.verdict !== 'HUMAN_FAIL' || v.note.trim().length > 0, 'HUMAN_FAIL requires a note')).min(1),
}).superRefine((v, ctx) => {
  const ids = v.verdicts.map((x) => x.shotId);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['verdicts'], message: 'duplicate shotId' });
});
export type QcReviewFile = z.infer<typeof QcReviewFileSchema>;

type HistoryEntry = { status: string; reviewer: string; reviewedAt: string; note: string };
type RecordWithHistory = ShotQcRecord & { reviewHistory?: HistoryEntry[] };

export interface ImportResult { ok: boolean; applied: { shotId: string; status: string }[]; errors: string[]; }

export async function importQcReview(qcDir: string, raw: unknown): Promise<ImportResult> {
  const p = QcReviewFileSchema.safeParse(raw);
  if (!p.success) return { ok: false, applied: [], errors: p.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
  const review = p.data;
  const errors: string[] = [];
  const updates: { path: string; rec: RecordWithHistory }[] = [];
  for (const v of review.verdicts) {
    const path = join(qcDir, v.shotId, 'qc-record.json');
    let rec: RecordWithHistory;
    try { rec = JSON.parse(await readFile(path, 'utf8')); } catch { errors.push(`${v.shotId}: no qc-record.json`); continue; }
    const current = rec.stills.map((s) => s.contentSha256.toLowerCase());
    if (current.join() !== v.stillsSha256.map((s) => s.toLowerCase()).join()) { errors.push(`${v.shotId}: stale review (stills changed since export)`); continue; }
    try {
      const next = recordHumanVerdict(rec, { reviewer: review.reviewer, verdict: v.verdict, note: v.note, at: review.reviewedAt }) as RecordWithHistory;
      next.reviewHistory = [...(rec.reviewHistory ?? []), { status: v.verdict, reviewer: review.reviewer, reviewedAt: review.reviewedAt, note: v.note }];
      next.gates = { V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' };
      updates.push({ path, rec: next });
    } catch (e) { errors.push(`${v.shotId}: ${(e as Error).message}`); }
  }
  if (errors.length) return { ok: false, applied: [], errors };
  for (const u of updates) { await writeFile(`${u.path}.tmp`, JSON.stringify(u.rec, null, 2)); await rename(`${u.path}.tmp`, u.path); }
  return { ok: true, applied: updates.map((u) => ({ shotId: u.rec.shotId, status: u.rec.identity.status })), errors: [] };
}
