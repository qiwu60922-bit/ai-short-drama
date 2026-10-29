/**
 * V13 suite fixtures for factory/ep01 rehearsal (default warn, prefer over v12). Offline ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateStoryLedgerSuite } from '@/agents/assembly/story-ledger-suite';
import { evaluateShotSpecSuite } from '@/agents/assembly/shot-spec-suite';

const fx = (name: string) =>
  JSON.parse(readFileSync(resolve(__dirname, `../../fixtures/v13/${name}`), 'utf8'));

describe('v13 suite fixtures', () => {
  it('story-ledger-suite.v13.json → PASS (motifRhythmBridge + qualityCliffLink)', () => {
    const r = evaluateStoryLedgerSuite(fx('story-ledger-suite.v13.json'));
    expect(r.verdict).toBe('PASS');
    expect(r.results.qualityMaskLink.status).toBe('PASS');
    expect(r.results.motifRhythmBridge.status).toBe('PASS');
    expect(r.results.qualityCliffLink.status).toBe('PASS');
    expect(r.results.amnesiaHandoffLink.status).toBe('PASS');
    expect(r.results.bondMaskLink.status).toBe('PASS');
    expect(r.results.foreshadowPeakLink.status).toBe('PASS');
    expect(r.results.motifForeshadowRhythmBridge.status).toBe('PASS');
    expect(r.results.qualityMaskPeakBridge.status).toBe('PASS');
    expect(r.metrics.ran).toBeGreaterThanOrEqual(8);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('shot-spec-suite.v13.json → PASS (detailHookKind + tailColdClose)', () => {
    const r = evaluateShotSpecSuite(fx('shot-spec-suite.v13.json'));
    expect(r.verdict).toBe('PASS');
    expect(r.results.coldOpenHook.status).toBe('PASS');
    expect(r.results.mvBeatMap.status).toBe('PASS');
    expect(r.results.detailHookKind.status).toBe('PASS');
    expect(r.results.tailColdClose.status).toBe('PASS');
    expect(r.results.midHookEarly.status).toBe('PASS');
    expect(r.results.setupAfterHookBan.status).toBe('PASS');
    expect(r.results.reactionBeforeCliff.status).toBe('PASS');
    expect(r.results.coldOpenMidHook.status).toBe('PASS');
    expect(r.results.dialogueBeforeCliffBan.status).toBe('PASS');
    expect(r.results.setupMidCap.status).toBe('PASS');
    expect(r.metrics.ran).toBeGreaterThanOrEqual(11);
  });


  it('dual-gate-enforce-fail.v13.json → both EMPTY_SUITE FAIL payloads', () => {
    const dual = fx('dual-gate-enforce-fail.v13.json');
    const story = evaluateStoryLedgerSuite(dual.storyLedger);
    const shot = evaluateShotSpecSuite(dual.shotSpecSuite);
    expect(story.verdict).toBe('FAIL');
    expect(story.findings.some((f) => f.code === 'EMPTY_SUITE')).toBe(true);
    expect(shot.verdict).toBe('FAIL');
    expect(shot.findings.some((f) => f.code === 'EMPTY_SUITE')).toBe(true);
  });

  it('enforce-fail fixture → EMPTY_SUITE FAIL (red path; CLI default still warn)', () => {
    const r = evaluateStoryLedgerSuite(fx('story-ledger-suite.enforce-fail.v13.json'));
    expect(r.verdict).toBe('FAIL');
    expect(r.findings.some((f) => f.code === 'EMPTY_SUITE')).toBe(true);
  });
});
