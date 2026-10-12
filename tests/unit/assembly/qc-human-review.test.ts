/** QC human review: page form + exported review file + import CLI core. Never auto-pass; G3 untouched. */
import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { QcReviewFileSchema, importQcReview } from '@/agents/assembly/qc-human-review';
import { renderQcHtml } from '@/agents/assembly/qc-summary-page';
import type { ShotQcRecord } from '@/agents/assembly/shot-qc-record';

const tmp = () => mkdtempSync(join(tmpdir(), 'qcr-'));
const rec = (dir: string, id: string): ShotQcRecord => ({
  schemaVersion: 1, shotId: id, takePath: `/t/${id}.mp4`, takeSha256: 'a'.repeat(64),
  probe: { width: 1344, height: 768, fps: 24, durationSeconds: 6 },
  stills: (['first', 'mid', 'last'] as const).map((role, i) => ({ role, timeSeconds: i * 3, path: join(dir, id, `${role}.png`), contentSha256: String(i + 1).repeat(64) })),
  identity: { status: 'PENDING_REVIEW', reviewer: null, reviewedAt: null, note: '' },
  gates: { V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' }, createdAt: 'x',
});
function setup(ids = ['S01', 'S02', 'S03']) {
  const d = tmp();
  for (const id of ids) { mkdirSync(join(d, id)); writeFileSync(join(d, id, 'qc-record.json'), JSON.stringify(rec(d, id))); }
  return d;
}
const read = (d: string, id: string) => JSON.parse(readFileSync(join(d, id, 'qc-record.json'), 'utf8')) as ShotQcRecord;
const stillsSha = (id: string) => rec('/x', id).stills.map((s) => s.contentSha256);
const review = (over: Record<string, unknown> = {}) => ({
  schemaVersion: 1, reviewer: '吴琦', reviewedAt: '2026-10-12T15:00:00+08:00',
  verdicts: [
    { shotId: 'S01', verdict: 'HUMAN_PASS', note: '脸型一致', stillsSha256: stillsSha('S01') },
    { shotId: 'S02', verdict: 'HUMAN_FAIL', note: '发色偏红', stillsSha256: stillsSha('S02') },
  ],
  ...over,
});

describe('review file schema', () => {
  it('accepts valid; rejects auto verdicts / blank or bot reviewer / PENDING verdict / dup shot', () => {
    expect(QcReviewFileSchema.safeParse(review()).success).toBe(true);
    for (const reviewer of ['', '  ', 'auto', 'Bot', 'agent', 'system', 'CI', 'grok']) expect(QcReviewFileSchema.safeParse(review({ reviewer })).success).toBe(false);
    expect(QcReviewFileSchema.safeParse(review({ verdicts: [{ shotId: 'S01', verdict: 'AUTO_PASS', stillsSha256: stillsSha('S01') }] })).success).toBe(false);
    expect(QcReviewFileSchema.safeParse(review({ verdicts: [{ shotId: 'S01', verdict: 'PENDING_REVIEW', stillsSha256: stillsSha('S01') }] })).success).toBe(false);
    const v = review().verdicts; expect(QcReviewFileSchema.safeParse(review({ verdicts: [v[0], v[0]] })).success).toBe(false);
  });
  it('fail verdict requires a note', () => {
    expect(QcReviewFileSchema.safeParse(review({ verdicts: [{ shotId: 'S02', verdict: 'HUMAN_FAIL', note: '', stillsSha256: stillsSha('S02') }] })).success).toBe(false);
  });
});

describe('importQcReview', () => {
  it('applies pass/fail with reviewer; untouched shots stay PENDING; G3 stays NOT_EVALUATED', async () => {
    const d = setup();
    const r = await importQcReview(d, review());
    expect(r.ok).toBe(true);
    expect(r.applied.map((a) => a.shotId)).toEqual(['S01', 'S02']);
    expect(read(d, 'S01').identity).toMatchObject({ status: 'HUMAN_PASS', reviewer: '吴琦', note: '脸型一致' });
    expect(read(d, 'S02').identity.status).toBe('HUMAN_FAIL');
    expect(read(d, 'S03').identity.status).toBe('PENDING_REVIEW');
    for (const id of ['S01', 'S02', 'S03']) expect(read(d, id).gates).toEqual({ V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN', autoPass: 'FORBIDDEN' });
  });
  it('stale review (stills sha changed after regeneration) → rejected, nothing written', async () => {
    const d = setup();
    const bad = review(); bad.verdicts[1].stillsSha256 = ['f'.repeat(64), 'f'.repeat(64), 'f'.repeat(64)];
    const r = await importQcReview(d, bad);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/S02.*stale/);
    expect(read(d, 'S01').identity.status).toBe('PENDING_REVIEW');
  });
  it('unknown shot → rejected atomically', async () => {
    const d = setup();
    const r = await importQcReview(d, review({ verdicts: [...review().verdicts, { shotId: 'S99', verdict: 'HUMAN_PASS', stillsSha256: stillsSha('S01') }] }));
    expect(r.ok).toBe(false);
    expect(read(d, 'S01').identity.status).toBe('PENDING_REVIEW');
  });
  it('invalid file → ok=false with schema errors', async () => {
    const r = await importQcReview(setup(), { schemaVersion: 1, reviewer: 'auto', verdicts: [] });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
  it('keeps review history on record (re-review appends)', async () => {
    const d = setup();
    await importQcReview(d, review());
    await importQcReview(d, review({ reviewer: '黄美媛', verdicts: [{ shotId: 'S02', verdict: 'HUMAN_PASS', note: '复看可接受', stillsSha256: stillsSha('S02') }] }));
    const s2 = read(d, 'S02') as ShotQcRecord & { reviewHistory?: { reviewer: string; status: string }[] };
    expect(s2.identity).toMatchObject({ status: 'HUMAN_PASS', reviewer: '黄美媛' });
    expect(s2.reviewHistory?.map((h) => h.status)).toEqual(['HUMAN_FAIL', 'HUMAN_PASS']);
  });
});

describe('QC page review form', () => {
  it('has reviewer input, per-shot pass/fail/note controls, export button, no network calls', () => {
    const d = '/q';
    const html = renderQcHtml([rec(d, 'S01')], d, { title: 't', review: true });
    expect(html).toContain('id="reviewer"');
    expect(html).toContain('name="verdict-S01"');
    expect(html).toContain('value="HUMAN_PASS"');
    expect(html).toContain('value="HUMAN_FAIL"');
    expect(html).toContain('id="note-S01"');
    expect(html).toContain('id="export-review"');
    expect(html).toContain(stillsSha('S01')[0]);
    expect(html).not.toMatch(/fetch\(|XMLHttpRequest|https?:\/\//);
    expect(html).not.toMatch(/<input[^>]*\schecked/); // no pre-selected verdicts
  });
});
