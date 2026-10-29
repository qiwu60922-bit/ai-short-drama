/**
 * V12 Quality×Rhythm Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityRhythmLink } from '@/agents/assembly/quality-rhythm-link-gate';
import fixture from '../../fixtures/v13/story-ledger-suite.v13.json';

const pack = (extra: Record<string, unknown> = {}) => {
  const base = (fixture as any).rhythmQualityLink;
  return { series: '密爽节奏', latestEp: 20, ...base, ...extra };
};
const failCodes = (r: ReturnType<typeof evaluateQualityRhythmLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityRhythmLink', () => {
  it('quality + rhythm → PASS', () => {
    const r = evaluateQualityRhythmLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBeGreaterThanOrEqual(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / RHYTHM_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityRhythmLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityRhythmLink(pack({ links: [] })))).toContain('RHYTHM_WITHOUT_QUALITY');
  });
});
