/**
 * V12 Quality×Alliance Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityAllianceLink } from '@/agents/assembly/quality-alliance-link-gate';
import fixture from '../../fixtures/v13/story-ledger-suite.v13.json';

const pack = (extra: Record<string, unknown> = {}) => {
  const base = (fixture as any).allianceQualityLink;
  return { series: '反派拿捏', latestEp: 20, ...base, ...extra };
};
const failCodes = (r: ReturnType<typeof evaluateQualityAllianceLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityAllianceLink', () => {
  it('quality + alliance → PASS', () => {
    const r = evaluateQualityAllianceLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBeGreaterThanOrEqual(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityAllianceLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityAllianceLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_QUALITY');
  });
});
