/**
 * V12 Bond×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondForeshadowLink } from '@/agents/assembly/bond-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  bonds: [{
    id: 'B1', partyA: '苏见晴', partyB: '傅司宴',
    contractEp: 1, contractLabel: '契约联姻', companionEps: [2, 3, 5],
    upgradeEp: 10, upgradeLabel: '真心升级',
  }],
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', bondId: 'B1', foreshadowId: 'FS1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateBondForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateBondForeshadowLink', () => {
  it('bond upgrade + foreshadow payoff → PASS', () => {
    const r = evaluateBondForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_BOND', () => {
    expect(failCodes(evaluateBondForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateBondForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_BOND');
  });
});
