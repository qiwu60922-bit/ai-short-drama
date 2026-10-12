/** V12 item 4 · human review receipts — machine never judges PASS. */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { importQcReview } from '@/agents/assembly/qc-human-review';
import { buildReviewReceipt, verifyReviewReceipt, RECEIPT_SCHEMA } from '@/agents/assembly/human-review-receipt';
const rec = (dir: string, id: string) => ({ schemaVersion: 1, shotId: id, takePath: `/t/${id}.mp4`, takeSha256: 'a'.repeat(64), probe: { width: 1, height: 1, fps: 24, durationSeconds: 6 },
  stills: ['first', 'mid', 'last'].map((role, i) => ({ role, timeSeconds: i, path: join(dir, id, `${role}.png`), contentSha256: String(i + 1).repeat(64) })),
  identity: { status: 'PENDING_REVIEW', reviewer: null, reviewedAt: null, note: '' }, gates: { V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' }, createdAt: 'x' });
const sh = (id: string) => rec('/x', id).stills.map(s => s.contentSha256);
function setup() { const d = mkdtempSync(join(tmpdir(), 'hrr-')); for (const id of ['S01', 'S02']) { mkdirSync(join(d, id)); writeFileSync(join(d, id, 'qc-record.json'), JSON.stringify(rec(d, id))); } return d; }
const review = { schemaVersion: 1, reviewer: '吴琦', reviewedAt: '2026-10-12T15:30:00+08:00', verdicts: [
  { shotId: 'S01', verdict: 'HUMAN_PASS', note: '一致', stillsSha256: sh('S01') }, { shotId: 'S02', verdict: 'HUMAN_FAIL', note: '发色偏红', stillsSha256: sh('S02') }] };
describe('human review receipt', () => {
  it('import writes receipt json+md with reviewer, per-shot evidence hashes, review-file sha, machineVerdict NONE', async () => {
    const d = setup(); const r = await importQcReview(d, review, { receiptDir: join(d, 'receipts') });
    expect(r.ok).toBe(true); expect(r.receiptPath).toBeTruthy();
    const rc = JSON.parse(readFileSync(r.receiptPath!, 'utf8'));
    expect(rc.schema).toBe(RECEIPT_SCHEMA); expect(rc.reviewer).toBe('吴琦'); expect(rc.machineVerdict).toBe('NONE');
    expect(rc.gates).toEqual({ V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' });
    expect(rc.shots[0]).toMatchObject({ shotId: 'S01', verdict: 'HUMAN_PASS', takeSha256: 'a'.repeat(64), stillsSha256: sh('S01') });
    expect(rc.reviewFileSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(existsSync(r.receiptPath!.replace(/\.json$/, '.md'))).toBe(true);
    expect((await verifyReviewReceipt(r.receiptPath!, d)).ok).toBe(true);
  });
  it('failed import writes no receipt', async () => {
    const d = setup(); const r = await importQcReview(d, { ...review, reviewer: 'grok' }, { receiptDir: join(d, 'receipts') });
    expect(r.ok).toBe(false); expect(existsSync(join(d, 'receipts'))).toBe(false);
  });
  it('builder refuses machine reviewers and any g3/autoPass true', () => {
    expect(() => buildReviewReceipt({ ...review, reviewer: 'agent' } as any, [])).toThrow(/human/);
    expect(() => buildReviewReceipt(review as any, [], { g3: true } as any)).toThrow(/machine/);
  });
  it('verify detects tampering and stills drift after the receipt', async () => {
    const d = setup(); const r = await importQcReview(d, review, { receiptDir: join(d, 'receipts') });
    const p = r.receiptPath!; const rc = JSON.parse(readFileSync(p, 'utf8'));
    writeFileSync(p, JSON.stringify({ ...rc, shots: rc.shots.map((s: any) => ({ ...s, verdict: 'HUMAN_PASS' })) }));
    expect((await verifyReviewReceipt(p, d)).problems.join()).toMatch(/receiptSha256/);
    writeFileSync(p, JSON.stringify(rc));
    const q = JSON.parse(readFileSync(join(d, 'S01', 'qc-record.json'), 'utf8')); q.stills[0].contentSha256 = 'f'.repeat(64);
    writeFileSync(join(d, 'S01', 'qc-record.json'), JSON.stringify(q));
    expect((await verifyReviewReceipt(p, d)).problems.join()).toMatch(/S01.*stills/);
  });
});
