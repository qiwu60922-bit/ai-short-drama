/**
 * V12 Cliff×Bond×Peak Ternary — 悬念叠钩×契约×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffBondPeakBridge } from '@/agents/assembly/cliff-bond-peak-bridge-gate';

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
  series: '逃婚三年',
  latestEp: 20,
  bonds: [{
    id: '机长契约',
    partyA: '苏见晴',
    partyB: '傅司宴',
    contractEp: 1,
    contractLabel: '契约联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 8,
    upgradeLabel: '真心升级',
  }],
  cliffLinks: [cliffLink],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 8, peakLabel: '公开对峙', payoffEp: 9 }],
  links: [{ id: 'L1', bondId: '机长契约', cliffLinkId: 'C8-9', peakId: '对峙峰值', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCliffBondPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffBondPeakBridge', () => {
  it('cliff + terminal + peak @ep → PASS', () => {
    const r = evaluateCliffBondPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateCliffBondPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCliffBondPeakBridge(
          pack({
            links: [{ id: 'L1', bondId: '机长契约', cliffLinkId: 'C8-9', peakId: '对峙峰值', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateCliffBondPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
