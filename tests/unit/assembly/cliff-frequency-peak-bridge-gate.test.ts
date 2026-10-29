/**
 * V12 Cliff×Frequency×Peak Ternary — 悬念叠钩×频率×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffFrequencyPeakBridge } from '@/agents/assembly/cliff-frequency-peak-bridge-gate';

const cliffPrev = {
  episode: 'EP08',
  shots: [
    { shotId: 'EP08-S0', cast: [], durSec: 4, beatRole: 'hook', action: '危机开场' },
    { shotId: 'EP08-S1', cast: [], durSec: 8, beatRole: 'increment', action: '追查线索' },
    { shotId: 'EP08-S2', cast: [], durSec: 8, beatRole: 'reversal', action: '身份暴露' },
    { shotId: 'EP08-S3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
  ],
};
const cliffNext = {
  episode: 'EP09',
  shots: [
    { shotId: 'EP09-S0', cast: [], durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
    { shotId: 'EP09-S1', cast: [], durSec: 2, beatRole: 'increment', action: '追兵逼近' },
    { shotId: 'EP09-S2', cast: [], durSec: 10, beatRole: 'reversal', action: '旧友现身' },
    { shotId: 'EP09-S3', cast: [], durSec: 8, beatRole: 'cliffhanger', action: '下一场更大危机' },
  ],
};
const cliffLink = {
  id: 'C8-9',
  prevEp: 8,
  nextEp: 9,
  prev: cliffPrev,
  next: cliffNext,
};

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
    ticks: [{ ep: 3, n: 10 }, { ep: 5, n: 50 }, { ep: 8, n: 99, label: '第99次' }],
    tipEp: 8,
    tipLabel: '接受第99次离婚彻底离开',
  }],
  cliffLinks: [cliffLink],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 8, peakLabel: '公开对峙', payoffEp: 9 }],
  links: [{ id: 'L1', cliffLinkId: 'C8-9', frequencyId: '离婚要挟', peakId: '对峙峰值', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCliffFrequencyPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffFrequencyPeakBridge', () => {
  it('cliff + tip + peak @ep → PASS', () => {
    const r = evaluateCliffFrequencyPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateCliffFrequencyPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCliffFrequencyPeakBridge(
          pack({
            links: [{ id: 'L1', cliffLinkId: 'C8-9', frequencyId: '离婚要挟', peakId: '对峙峰值', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateCliffFrequencyPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
