/** V15 · publish gate: canPublish only with a named-human G3 sign-off receipt. No publish action exists. */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { importQcReview } from '@/agents/assembly/qc-human-review';
import { createG3Signoff, writeG3Signoff, evaluateCanPublish, G3_CONFIRM_PHRASE } from '@/agents/v15/publish-gate';
import * as gate from '@/agents/v15/publish-gate';
const S = (i: number) => String(i).repeat(64);
function setup(verdicts: ('HUMAN_PASS' | 'HUMAN_FAIL')[] = ['HUMAN_PASS', 'HUMAN_PASS'], overall = 'INCOMPLETE') {
  const w = mkdtempSync(join(tmpdir(), 'pub-')); const qc = join(w, 'qc'); const ids = verdicts.map((_, i) => `S0${i + 1}`);
  for (const id of ids) { mkdirSync(join(qc, id), { recursive: true }); writeFileSync(join(qc, id, 'qc-record.json'), JSON.stringify({ schemaVersion: 1, shotId: id, takePath: 't', takeSha256: S(9),
    probe: { width: 1, height: 1, fps: 24, durationSeconds: 1 }, stills: [1, 2, 3].map(n => ({ role: 'x', timeSeconds: n, path: 'p', contentSha256: S(n) })),
    identity: { status: 'PENDING_REVIEW', reviewer: null, reviewedAt: null, note: '' }, gates: { V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' }, createdAt: 'x' })); }
  const mp4 = join(w, 'episode.mp4'); writeFileSync(mp4, 'video-bytes');
  const det = join(w, 'detectors-report.json'); writeFileSync(det, JSON.stringify({ summary: { overall, g3: overall === 'FAIL' ? 'BLOCKED' : 'NOT_EVALUATED', incomplete: overall === 'INCOMPLETE' ? ['identity'] : [] } }));
  return { w, qc, ids, mp4, det, verdicts };
}
const review = (ids: string[], v: string[]) => ({ schemaVersion: 1, reviewer: '吴琦', reviewedAt: 't', verdicts: ids.map((id, i) => ({ shotId: id, verdict: v[i], note: v[i] === 'HUMAN_FAIL' ? 'x' : '', stillsSha256: [S(1), S(2), S(3)] })) });
const attest = { isTTY: true, typedPhrase: `${G3_CONFIRM_PHRASE} ep01`, env: {} };
async function signed(x = setup(), o: Record<string, unknown> = {}) {
  await importQcReview(x.qc, review(x.ids, x.verdicts), { receiptDir: join(x.qc, 'receipts') });
  const r = createG3Signoff({ episodeId: 'ep01', signer: '吴琦', decision: 'G3_PASS', episodeMp4: x.mp4, detectorsReport: x.det, acknowledgedIncomplete: ['identity'], ...o }, attest);
  const p = writeG3Signoff(join(x.w, 'g3'), r); return { ...x, receipt: p };
}
const ev = (x: any) => evaluateCanPublish({ episodeId: 'ep01', episodeMp4: x.mp4, qcDir: x.qc, detectorsReport: x.det, g3ReceiptPath: x.receipt });
describe('G3 sign-off creation (human only)', () => {
  it('refuses non-TTY, missing/wrong phrase, bot signer, agent env', () => {
    const base = { episodeId: 'ep01', signer: '吴琦', decision: 'G3_PASS' as const, episodeMp4: '/x', detectorsReport: '/y' };
    expect(() => createG3Signoff(base, { ...attest, isTTY: false })).toThrow(/interactive/);
    expect(() => createG3Signoff(base, { ...attest, typedPhrase: 'yes' })).toThrow(/phrase/);
    expect(() => createG3Signoff({ ...base, signer: 'grok' }, attest)).toThrow(/human/);
    expect(() => createG3Signoff(base, { ...attest, env: { GROK_BOT_AGENT: '1' } })).toThrow(/agent/);
    expect(() => createG3Signoff(base, { ...attest, env: { CI: 'true' } })).toThrow(/agent/);
  });
  it('no publish action is implemented anywhere in the module', () => {
    expect(Object.keys(gate).filter(k => /^(publish|upload|post)/i.test(k))).toEqual([]);
  });
});
describe('evaluateCanPublish', () => {
  it('no G3 receipt → canPublish false', async () => {
    const x = setup(); await importQcReview(x.qc, review(x.ids, x.verdicts), { receiptDir: join(x.qc, 'receipts') });
    const r = await ev({ ...x, receipt: join(x.w, 'none.json') });
    expect(r.canPublish).toBe(false); expect(r.reasons.join()).toMatch(/G3 sign-off/); expect(r.publishAction).toBe('NOT_IMPLEMENTED');
  });
  it('all human PASS + valid G3 receipt matching mp4 sha → canPublish true (still no publish action)', async () => {
    const r = await ev(await signed()); expect(r.reasons).toEqual([]); expect(r.canPublish).toBe(true); expect(r.publishAction).toBe('NOT_IMPLEMENTED');
  });
  it('mp4 changed after sign-off → false', async () => {
    const x = await signed(); writeFileSync(x.mp4, 'other'); expect((await ev(x)).reasons.join()).toMatch(/mp4 sha/);
  });
  it('receipt edited → false', async () => {
    const x = await signed(); const j = JSON.parse(readFileSync(x.receipt, 'utf8')); writeFileSync(x.receipt, JSON.stringify({ ...j, signer: '张三' }));
    expect((await ev(x)).reasons.join()).toMatch(/receiptSha256/);
  });
  it('any shot HUMAN_FAIL or unreviewed → false', async () => {
    expect((await ev(await signed(setup(['HUMAN_PASS', 'HUMAN_FAIL'])))).reasons.join()).toMatch(/S02/);
    const x = setup(['HUMAN_PASS', 'HUMAN_PASS']); await importQcReview(x.qc, review([x.ids[0]], ['HUMAN_PASS']), { receiptDir: join(x.qc, 'receipts') });
    const p = writeG3Signoff(join(x.w, 'g3'), createG3Signoff({ episodeId: 'ep01', signer: '吴琦', decision: 'G3_PASS', episodeMp4: x.mp4, detectorsReport: x.det, acknowledgedIncomplete: ['identity'] }, attest));
    expect((await ev({ ...x, receipt: p })).reasons.join()).toMatch(/S02.*PENDING/);
  });
  it('detector FAIL (G3 BLOCKED) → false even with human sign-off', async () => {
    expect((await ev(await signed(setup(['HUMAN_PASS'], 'FAIL'))) ).reasons.join()).toMatch(/BLOCKED/);
  });
  it('INCOMPLETE detectors not acknowledged by signer → false', async () => {
    expect((await ev(await signed(setup(), { acknowledgedIncomplete: [] }))).reasons.join()).toMatch(/acknowledged/);
  });
  it('G3_FAIL decision → false', async () => {
    expect((await ev(await signed(setup(), { decision: 'G3_FAIL' }))).canPublish).toBe(false);
  });
});
