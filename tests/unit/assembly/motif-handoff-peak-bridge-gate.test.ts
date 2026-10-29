/**
 * V12 Motif×Handoff×Peak Ternary — 母题×承接×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifHandoffPeakBridge } from '@/agents/assembly/motif-handoff-peak-bridge-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '开场' },
  { durSec: 8, beatRole: 'increment', action: '追问' },
  { durSec: 8, beatRole: 'reversal', action: '反转' },
  { durSec: 10, beatRole: 'cliffhanger', action: '悬念' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '承接' },
  { durSec: 2, beatRole: 'increment', action: '追问' },
  { durSec: 10, beatRole: 'reversal', action: '新证' },
  { durSec: 8, beatRole: 'cliffhanger', action: '悬念' },
];

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 8, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 20, role: 'payoff', visualState: '盛放' },
  ],
  handoffs: [{
    id: 'H8-9',
    prevEp: 8,
    nextEp: 9,
    prev: spec('EP08', prevGood()),
    next: spec('EP09', nextGood()),
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 8, peakLabel: '公开身份对峙', payoffEp: 8 }],
  links: [{ id: 'L1', motifId: 'white-rose', handoffId: 'H8-9', peakId: '对峙峰值', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifHandoffPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifHandoffPeakBridge', () => {
  it('motif + prevEp + peak @ep → PASS', () => {
    const r = evaluateMotifHandoffPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateMotifHandoffPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifHandoffPeakBridge(
          pack({
            links: [{ id: 'L1', motifId: 'white-rose', handoffId: 'H8-9', peakId: '对峙峰值', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateMotifHandoffPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
