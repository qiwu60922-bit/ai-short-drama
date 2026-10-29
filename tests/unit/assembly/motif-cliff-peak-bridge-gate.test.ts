/**
 * V12 Motif×Cliff×Peak Ternary — 母题×悬念×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifCliffPeakBridge } from '@/agents/assembly/motif-cliff-peak-bridge-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '危机开场' },
  { durSec: 8, beatRole: 'increment', action: '追查线索' },
  { durSec: 8, beatRole: 'reversal', action: '身份暴露' },
  { durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
  { durSec: 2, beatRole: 'increment', action: '追兵逼近' },
  { durSec: 10, beatRole: 'reversal', action: '旧友现身' },
  { durSec: 8, beatRole: 'cliffhanger', action: '下一场更大危机' },
];

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 10, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 20, role: 'payoff', visualState: '盛放' },
  ],
  cliffLinks: [{
    id: 'C9-10',
    prevEp: 9,
    nextEp: 10,
    prev: spec('EP09', prevGood()),
    next: spec('EP10', nextGood()),
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', motifId: 'white-rose', cliffLinkId: 'C9-10', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifCliffPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifCliffPeakBridge', () => {
  it('motif + nextEp + peak @ep → PASS', () => {
    const r = evaluateMotifCliffPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateMotifCliffPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifCliffPeakBridge(
          pack({
            links: [{ id: 'L1', motifId: 'white-rose', cliffLinkId: 'C9-10', peakId: '对峙峰值', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateMotifCliffPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
