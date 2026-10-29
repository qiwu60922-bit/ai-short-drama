/** V14 · two-episode offline batch (EP01 real spec + EP02 SYNTHETIC rehearsal spec). */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join, resolve } from 'node:path';
import { runFactoryBatch } from '@/agents/factory/factory-batch';
import { fakeHandlers } from '@/agents/factory/factory-run';
import { repoHandlers } from '@/agents/factory/repo-handlers';
const fx = (n: string) => JSON.parse(readFileSync(resolve(__dirname, '../../fixtures/wave14-ep01', n), 'utf8'));
const tmp = () => mkdtempSync(join(tmpdir(), 'fb-'));
describe('factory batch', () => {
  it('per-episode isolation; one blocked episode does not stop others; summary never PASS', async () => {
    const w = tmp();
    const r = await runFactoryBatch(w, [
      { episodeId: 'ep01', providers: { h3: 'fake', dub: 'fake' }, handlers: fakeHandlers() },
      { episodeId: 'ep02', providers: { h3: 'real', dub: 'fake' }, handlers: fakeHandlers() },
      { episodeId: 'ep03', providers: { h3: 'fake', dub: 'fake' }, handlers: fakeHandlers() }]);
    expect(r.episodes.map(e => [e.episodeId, e.status])).toEqual([['ep01', 'DONE_AWAITING_HUMAN_REVIEW'], ['ep02', 'AWAITING_HUMAN_GO'], ['ep03', 'DONE_AWAITING_HUMAN_REVIEW']]);
    expect(r.exitCode).toBe(50); expect(existsSync(join(w, 'ep02', 'FACTORY_QUEUE.json'))).toBe(true);
    expect(r.canPublish).toBe(false); expect(JSON.stringify(r)).not.toMatch(/"PASS"/);
    expect(existsSync(join(w, 'BATCH_SUMMARY.json'))).toBe(true);
  });
  it('rejects duplicate episode ids', async () => {
    await expect(runFactoryBatch(tmp(), [{ episodeId: 'a', providers: { h3: 'fake', dub: 'fake' }, handlers: fakeHandlers() }, { episodeId: 'a', providers: { h3: 'fake', dub: 'fake' }, handlers: fakeHandlers() }])).rejects.toThrow(/duplicate/);
  });
  it('real ffmpeg: EP01 (90s) + EP02 synthetic (62s) with repo modules; ledger cost aggregated $0', async () => {
    const w = tmp(); const REF = fx('REF_INDEX.json'); const small = { width: 160, height: 96, fps: 24 };
    const r = await runFactoryBatch(w, [
      { episodeId: 'ep01', providers: { h3: 'fake', dub: 'fake' }, handlers: repoHandlers({ shotSpec: fx('SHOT_SPEC.json'), beatPlan: fx('WAVE14_EP01_BEATPLAN.json'), refIndex: REF, canvas: small, allowCandidatesForRehearsal: true }) },
      { episodeId: 'ep02', providers: { h3: 'fake', dub: 'fake' }, handlers: repoHandlers({ shotSpec: fx('SHOT_SPEC.ep02-SYNTHETIC.json'), refIndex: REF, canvas: small, allowCandidatesForRehearsal: true }) }]);
    expect(r.exitCode).toBe(0);
    expect(r.episodes.map(e => e.status)).toEqual(['DONE_AWAITING_HUMAN_REVIEW', 'DONE_AWAITING_HUMAN_REVIEW']);
    expect(r.episodes[1].totalSec).toBeCloseTo(62, 0); expect(r.ledger.totalCostUsd).toBe(0); expect(r.ledger.count).toBeGreaterThan(28);
  }, 400_000);
});

describe('factory batch storyLedgerGate', () => {
  it('enforce + EMPTY_SUITE FAIL → exit 36, no episodes run, report dumped', async () => {
    const w = tmp();
    const r = await runFactoryBatch(
      w,
      [{ episodeId: 'ep01', providers: { h3: 'fake', dub: 'fake' }, handlers: fakeHandlers() }],
      { storyLedger: { series: 'T', latestEp: 1 }, storyLedgerGate: 'enforce' },
    );
    expect(r.exitCode).toBe(36);
    expect((r as { stage?: string }).stage).toBe('storyLedger');
    expect(r.storyLedger?.verdict).toBe('FAIL');
    expect(r.episodes).toEqual([]);
    expect(existsSync(join(w, 'story-ledger-suite-report.json'))).toBe(true);
    expect(existsSync(join(w, 'ep01', 'FACTORY_QUEUE.json'))).toBe(false);
    expect(r.canPublish).toBe(false);
    expect(r.g3).toBe('NOT_EVALUATED');
  });

  it('warn + FAIL still runs episodes', async () => {
    const w = tmp();
    const r = await runFactoryBatch(
      w,
      [{ episodeId: 'ep01', providers: { h3: 'fake', dub: 'fake' }, handlers: fakeHandlers() }],
      { storyLedger: { series: 'T', latestEp: 1 }, storyLedgerGate: 'warn' },
    );
    expect(r.exitCode).toBe(0);
    expect(r.episodes).toHaveLength(1);
    expect(r.episodes[0].status).toBe('DONE_AWAITING_HUMAN_REVIEW');
    expect(r.storyLedger?.verdict).toBe('FAIL');
    expect(r.notes.some((n) => n.includes('story-ledger-suite'))).toBe(true);
  });

  it('off (default) ignores storyLedger payload', async () => {
    const w = tmp();
    const r = await runFactoryBatch(
      w,
      [{ episodeId: 'ep01', providers: { h3: 'fake', dub: 'fake' }, handlers: fakeHandlers() }],
      { storyLedger: { series: 'T', latestEp: 1 } },
    );
    expect(r.storyLedger).toBeUndefined();
    expect(existsSync(join(w, 'story-ledger-suite-report.json'))).toBe(false);
    expect(r.exitCode).toBe(0);
  });
});
