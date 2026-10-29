/**
 * V12 Frequency×Foreshadow Link — tipping×伏笔联表, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyForeshadowLink } from '@/agents/assembly/frequency-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '一块钱硬币',
  latestEp: 20,
  frequencies: [{
    id: '离婚99', actor: '叶楚', motif: '离婚要挟', unit: 'count', threshold: 3,
    plantEp: 1, plantAtSec: 0, tipEp: 10, tipAtSec: 10, tipLabel: '第3次离婚签字',
    ticks: [{ ep: 2, n: 1 }, { ep: 5, n: 2 }, { ep: 10, n: 3 }],
  }],
  items: [{ id: '伪人身份', name: '预言家真伪', priority: 'S', plantEp: 1, status: 'closed', payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', frequencyId: '离婚99', foreshadowId: '伪人身份', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateFrequencyForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyForeshadowLink', () => {
  it('tip + foreshadow payoff @ep → PASS', () => {
    const r = evaluateFrequencyForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_FREQUENCY', () => {
    expect(failCodes(evaluateFrequencyForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateFrequencyForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_FREQUENCY');
  });
});
