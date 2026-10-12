/** V12 Story Rhythm Gate (wave13 beat-density口径) — offline pre-generation check. ≠Final ≠G3. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateStoryRhythm, countActionBeats } from '@/agents/assembly/story-rhythm-gate';

const fx = (n: string) => JSON.parse(readFileSync(resolve(__dirname, '../../fixtures/wave14-ep01', n), 'utf8'));
const spec = (shots: { durSec: number; action?: string; cutMotive?: string }[]) => ({ episode: 'T', shots: shots.map((s, i) => ({ shotId: `S${i}`, cast: [], ...s })) });

describe('action beats', () => {
  it('splits on · → / ， ; and counts at least 1', () => {
    expect(countActionBeats('灯闪·风压·黑影延伸·停步皱眉')).toBe(4);
    expect(countActionBeats('MS→CU 转身')).toBe(2);
    expect(countActionBeats('')).toBe(1);
    expect(countActionBeats(undefined)).toBe(1);
  });
});

describe('evaluateStoryRhythm', () => {
  it('EP01 v2 (90s, 16 shots) passes density with metrics', () => {
    const r = evaluateStoryRhythm(fx('SHOT_SPEC.json'));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.totalSeconds).toBe(90);
    expect(r.metrics.cutEvents).toBe(16);
    expect(r.metrics.effectiveEvents).toBeGreaterThanOrEqual(16);
    expect(r.metrics.eventsPer90s).toBeGreaterThanOrEqual(10);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('wave13 failure mode: one action stretched over 90s → FAIL density + stretch', () => {
    const r = evaluateStoryRhythm(spec([{ durSec: 90, action: '持球站立' }]));
    expect(r.verdict).toBe('FAIL');
    const codes = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
    expect(codes).toEqual(expect.arrayContaining(['DENSITY_LOW', 'SHOT_TOO_LONG', 'EVENT_STRETCH']));
  });
  it('density normalised to 90s window (36s dense re-edit with 18 cuts passes)', () => {
    const r = evaluateStoryRhythm(spec(Array.from({ length: 18 }, () => ({ durSec: 2, action: 'x' }))));
    expect(r.metrics.eventsPer90s).toBe(45);
    expect(r.verdict).toBe('PASS');
  });
  it('identical consecutive actions flagged as REPEATED_ACTION (warn)', () => {
    const r = evaluateStoryRhythm(spec([{ durSec: 5, action: 'a' }, { durSec: 5, action: 'a' }, { durSec: 5, action: 'b' }, ...Array.from({ length: 10 }, (_, i) => ({ durSec: 2, action: `c${i}` }))]));
    expect(r.findings.find((f) => f.code === 'REPEATED_ACTION')).toMatchObject({ severity: 'WARN', shotIds: ['S0', 'S1'] });
  });
  it('cut motive: WARN by default, FAIL when required', () => {
    const s = spec(Array.from({ length: 12 }, () => ({ durSec: 5, action: 'x·y' })));
    expect(evaluateStoryRhythm(s).findings.find((f) => f.code === 'CUT_MOTIVE_MISSING')?.severity).toBe('WARN');
    expect(evaluateStoryRhythm(s).verdict).toBe('PASS');
    const req = evaluateStoryRhythm(s, { requireCutMotive: true });
    expect(req.verdict).toBe('FAIL');
  });
  it('thresholds configurable', () => {
    const s = spec(Array.from({ length: 12 }, () => ({ durSec: 7.5, action: 'x' })));
    expect(evaluateStoryRhythm(s).verdict).toBe('PASS');
    expect(evaluateStoryRhythm(s, { minEventsPer90s: 20 }).verdict).toBe('FAIL');
    expect(evaluateStoryRhythm(s, { maxShotSeconds: 6 }).verdict).toBe('FAIL');
  });
  it('bad input → FAIL with SCHEMA finding', () => {
    expect(evaluateStoryRhythm({ shots: [] }).findings[0].code).toBe('SCHEMA');
  });
});

import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runEp01Rehearsal } from '@/agents/assembly/ep01-rehearsal';
describe('rehearsal integration', () => {
  it('enforce: stretched spec stops at rhythm stage (27) before any generation', async () => {
    const w = mkdtempSync(join(tmpdir(), 'rg-'));
    const r = await runEp01Rehearsal({ shotSpec: spec([{ durSec: 90, action: '持球站立' }]), refIndex: {}, workDir: w, rhythmGate: 'enforce' });
    expect(r.exitCode).toBe(27);
    expect(r.stage).toBe('rhythm');
    expect(r.rhythm?.verdict).toBe('FAIL');
  });
  it('warn (default): rhythm attached to report, flow continues', async () => {
    const w = mkdtempSync(join(tmpdir(), 'rg-'));
    const r = await runEp01Rehearsal({ shotSpec: spec([{ durSec: 90, action: '持球站立' }]), refIndex: {}, workDir: w, sceneRefPath: undefined });
    expect(r.rhythm?.verdict).toBe('FAIL');
    expect(r.stage).not.toBe('rhythm');
  });
});
