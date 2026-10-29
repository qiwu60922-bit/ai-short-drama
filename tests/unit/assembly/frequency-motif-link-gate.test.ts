/**
 * V12 Frequency×Motif Link — 第N次×母题, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyMotifLink } from '@/agents/assembly/frequency-motif-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  frequencies: [{
    id: '离婚要挟',
    actor: '丈夫',
    motif: '离婚要挟',
    unit: 'count',
    threshold: 99,
    plantEp: 1,
    ticks: [
      { ep: 3, n: 10 },
      { ep: 5, n: 50 },
      { ep: 10, n: 99, label: '第99次' },
    ],
    tipEp: 10,
    tipLabel: '接受第99次离婚彻底离开',
    tipAtSec: 10,
    plantAtSec: 0,
  }],
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff', visualState: '盛放' },
  ],
  links: [{ id: 'L1', frequencyId: '离婚要挟', motifId: 'white-rose', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyMotifLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyMotifLink', () => {
  it('tip ↔ motif @ep → PASS', () => {
    const r = evaluateFrequencyMotifLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TIP_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateFrequencyMotifLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateFrequencyMotifLink(pack({ links: [] })))).toContain(
      'TIP_WITHOUT_MOTIF',
    );
  });
});
