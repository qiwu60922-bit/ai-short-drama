/**
 * V12 Amnesia×Frequency Link — 失忆唤回×tipping, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaFrequencyLink } from '@/agents/assembly/amnesia-frequency-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  amnesias: [{
  id: '祁南失忆',
  actor: '祁南',
  plantEp: 1,
  plantCause: '爆炸',
  companionEps: [2, 4, 6],
  recoverEp: 10,
  recoverLabel: '圣诞摩天轮对视唤回',
  recoverTrigger: '圣诞摩天轮',
}],
  frequencies: [{
  id: '离婚要挟',
  actor: '丈夫',
  motif: '离婚要挟',
  unit: 'count' as const,
  threshold: 99,
  plantEp: 1,
  ticks: [
    { ep: 3, n: 10 },
    { ep: 5, n: 50 },
    { ep: 10, n: 99, label: '第99次' },
  ],
  tipEp: 10,
  tipLabel: '接受第99次离婚彻底离开',
}],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', frequencyId: '离婚要挟' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAmnesiaFrequencyLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaFrequencyLink', () => {
  it('recover ↔ tip → PASS', () => {
    const r = evaluateAmnesiaFrequencyLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / RECOVER_WITHOUT_FREQUENCY', () => {
    expect(failCodes(evaluateAmnesiaFrequencyLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAmnesiaFrequencyLink(pack({ links: [] })))).toContain('RECOVER_WITHOUT_FREQUENCY');
  });
});
