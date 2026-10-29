/**
 * V12 Mask×Cliff×Peak Ternary — 伪装×叠钩×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskCliffPeakBridge } from '@/agents/assembly/mask-cliff-peak-bridge-gate';

const cliffPrev = {
  episode: 'EP08',
  shots: [
    { shotId: 'EP08-S0', cast: [], durSec: 4, beatRole: 'hook', action: '危机开场' },
    { shotId: 'EP08-S1', cast: [], durSec: 8, beatRole: 'increment', action: '追查线索' },
    { shotId: 'EP08-S2', cast: [], durSec: 8, beatRole: 'reversal', action: '身份暴露' },
    { shotId: 'EP08-S3', cast: [], durSec: 10, beatRole: 'cliffhanger', action: '持械闯入被围' },
  ],
};
const cliffNext = {
  episode: 'EP09',
  shots: [
    { shotId: 'EP09-S0', cast: [], durSec: 2, beatRole: 'hook', action: '被围承接' },
    { shotId: 'EP09-S1', cast: [], durSec: 2, beatRole: 'increment', action: '追问' },
    { shotId: 'EP09-S2', cast: [], durSec: 10, beatRole: 'reversal', action: '新证' },
    { shotId: 'EP09-S3', cast: [], durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 8,
    revealLabel: '真心崩塌',
  }],
  cliffLinks: [{ id: 'C8-9', prevEp: 8, nextEp: 9, prev: cliffPrev, next: cliffNext }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 8, peakLabel: '公开身份对峙', payoffEp: 9 }],
  links: [{ id: 'L1', maskId: '花心纨绔', cliffLinkId: 'C8-9', peakId: '对峙峰值', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskCliffPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskCliffPeakBridge', () => {
  it('reveal + cliff + peak @ep → PASS', () => {
    const r = evaluateMaskCliffPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateMaskCliffPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMaskCliffPeakBridge(
          pack({
            links: [{ id: 'L1', maskId: '花心纨绔', cliffLinkId: 'C8-9', peakId: '对峙峰值', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateMaskCliffPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
