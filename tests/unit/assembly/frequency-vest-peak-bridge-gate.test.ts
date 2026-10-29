/**
 * V12 Frequency×Vest×Peak Ternary — 频率×马甲×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyVestPeakBridge } from '@/agents/assembly/frequency-vest-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  frequencies: [{
    id: '离婚要挟',
    actor: '丈夫',
    motif: '离婚要挟',
    unit: 'count' as const,
    threshold: 99,
    plantEp: 1,
    ticks: [{ ep: 3, n: 10 }, { ep: 5, n: 50 }, { ep: 10, n: 99, label: '第99次' }],
    tipEp: 10,
    tipLabel: '接受第99次离婚彻底离开',
  }],
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 10,
    dropLabel: '公开机长身份反击',
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', frequencyId: '离婚要挟', vestId: '机长马甲', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyVestPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyVestPeakBridge', () => {
  it('tip + drop + peak @ep → PASS', () => {
    const r = evaluateFrequencyVestPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateFrequencyVestPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateFrequencyVestPeakBridge(
          pack({
            links: [{ id: 'L1', frequencyId: '离婚要挟', vestId: '机长马甲', peakId: '对峙峰值', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateFrequencyVestPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
