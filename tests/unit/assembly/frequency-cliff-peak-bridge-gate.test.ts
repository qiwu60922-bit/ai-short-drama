/**
 * V12 Frequency×Cliff×Peak Ternary — tipping×悬念叠钩×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyCliffPeakBridge } from '@/agents/assembly/frequency-cliff-peak-bridge-gate';

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
      { ep: 9, n: 99, label: '第99次' },
    ],
    tipEp: 9,
    tipLabel: '第99次',
  }],
  cliffLinks: [{
    id: 'C9-10',
    prevEp: 9,
    nextEp: 10,
    prev: {
      episode: 'EP09',
      shots: [
        { shotId: 'EP09-S0', cast: [], durSec: 4, beatRole: 'hook', action: '危机开场' },
        { shotId: 'EP09-S1', cast: [], durSec: 8, beatRole: 'increment', action: '追查线索' },
        { shotId: 'EP09-S2', cast: [], durSec: 8, beatRole: 'reversal', action: '身份暴露' },
        { shotId: 'EP09-S3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
      ],
    },
    next: {
      episode: 'EP10',
      shots: [
        { shotId: 'EP10-S0', cast: [], durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
        { shotId: 'EP10-S1', cast: [], durSec: 8, beatRole: 'increment', action: '加压' },
        { shotId: 'EP10-S2', cast: [], durSec: 8, beatRole: 'reversal', action: '反转' },
        { shotId: 'EP10-S3', cast: [], durSec: 2, beatRole: 'cliffhanger', action: '再悬' },
      ],
    },
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 9, peakLabel: '公开身份对峙', payoffEp: 9 }],
  links: [{ id: 'L1', frequencyId: '离婚要挟', cliffLinkId: 'C9-10', peakId: '对峙峰值', ep: 9 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyCliffPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyCliffPeakBridge', () => {
  it('tip + cliff prev + peak @ep → PASS', () => {
    const r = evaluateFrequencyCliffPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TIP_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateFrequencyCliffPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateFrequencyCliffPeakBridge(pack({ links: [] })))).toContain('TIP_WITHOUT_BRIDGE');
  });
});
