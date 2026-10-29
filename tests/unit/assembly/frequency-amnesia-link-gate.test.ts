/**
 * V12 Frequency×Amnesia Link — tipping×失忆唤回, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyAmnesiaLink } from '@/agents/assembly/frequency-amnesia-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
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
  links: [{ id: 'L1', frequencyId: '离婚要挟', amnesiaId: '祁南失忆' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyAmnesiaLink', () => {
  it('tip ↔ recover → PASS', () => {
    const r = evaluateFrequencyAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TIP_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateFrequencyAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateFrequencyAmnesiaLink(pack({ links: [] })))).toContain('TIP_WITHOUT_AMNESIA');
  });
});
