/**
 * V12 Reveal×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateRevealForeshadowLink } from '@/agents/assembly/reveal-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 10,
  reveals: [{ id: '花心纨绔', wearer: '江少', plantEp: 1, maintainEps: [2, 3], revealEp: 10, revealLabel: '真心崩塌' }],
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', revealId: '花心纨绔', foreshadowId: 'FS1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateRevealForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateRevealForeshadowLink', () => {
  it('reveal + foreshadow payoff → PASS', () => {
    const r = evaluateRevealForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_REVEAL', () => {
    expect(failCodes(evaluateRevealForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateRevealForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_REVEAL');
  });
});
