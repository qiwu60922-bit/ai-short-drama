/**
 * V12 Mask×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskForeshadowLink } from '@/agents/assembly/mask-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  masks: [{ id: 'M1', wearer: '江少', plantEp: 1, maintainEps: [2, 3], revealEp: 10, revealLabel: '真心崩塌' }],
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', maskId: 'M1', foreshadowId: 'FS1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateMaskForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskForeshadowLink', () => {
  it('mask reveal + foreshadow payoff → PASS', () => {
    const r = evaluateMaskForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_MASK', () => {
    expect(failCodes(evaluateMaskForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMaskForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_MASK');
  });
});
