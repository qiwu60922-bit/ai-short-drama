/**
 * V12 Frequency×Amnesia×Peak Ternary — 第N次×失忆×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyAmnesiaPeakBridge } from '@/agents/assembly/frequency-amnesia-peak-bridge-gate';

const frequency = {
  id: '离婚99',
  actor: '叶楚',
  motif: '离婚要挟',
  unit: 'count' as const,
  threshold: 3,
  plantEp: 1,
  plantAtSec: 0,
  tipEp: 10,
  tipAtSec: 10,
  tipLabel: '第3次离婚签字',
  ticks: [
    { ep: 2, n: 1 },
    { ep: 5, n: 2 },
    { ep: 10, n: 3 },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '叶楚出狱',
  latestEp: 20,
  frequencies: [frequency],
  amnesias: [{
    id: '祁南失忆',
    actor: '祁南',
    plantEp: 1,
    plantCause: '爆炸',
    companionEps: [2, 4, 6],
    recoverEp: 10,
    recoverLabel: '摩天轮唤回',
    recoverTrigger: '圣诞摩天轮',
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', frequencyId: '离婚99', amnesiaId: '祁南失忆', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateFrequencyAmnesiaPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyAmnesiaPeakBridge', () => {
  it('tip + recover + peak @ep → PASS', () => {
    const r = evaluateFrequencyAmnesiaPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateFrequencyAmnesiaPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateFrequencyAmnesiaPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
