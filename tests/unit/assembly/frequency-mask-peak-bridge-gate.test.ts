/**
 * V12 Frequency×Mask×Peak Ternary — tipping×伪装揭穿×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyMaskPeakBridge } from '@/agents/assembly/frequency-mask-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '轻烟染日暮',
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
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 10,
    revealLabel: '真心崩塌',
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', frequencyId: '离婚要挟', maskId: '花心纨绔', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyMaskPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyMaskPeakBridge', () => {
  it('tip + reveal + peak @ep → PASS', () => {
    const r = evaluateFrequencyMaskPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TIP_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateFrequencyMaskPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateFrequencyMaskPeakBridge(pack({ links: [] })))).toContain('TIP_WITHOUT_BRIDGE');
  });
});
