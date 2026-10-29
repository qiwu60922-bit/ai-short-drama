/**
 * V12 Mask×Handoff×Peak Ternary — 伪装×承接×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskHandoffPeakBridge } from '@/agents/assembly/mask-handoff-peak-bridge-gate';

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
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

const mask = {
  id: '预言家伪装',
  wearer: 'linyang',
  plantEp: 1,
  maintainEps: [2, 3],
  revealEp: 8,
  revealLabel: '全场唯一揭穿',
};
const peak = { id: '预言家对峙', openEp: 1, peakEp: 8, peakLabel: '全场唯一对决', payoffEp: 8 };
const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  masks: [mask],
  handoffs: [handoff],
  peaks: [peak],
  links: [{ id: 'L1', maskId: '预言家伪装', handoffId: 'H8-9', peakId: '预言家对峙', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskHandoffPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskHandoffPeakBridge', () => {
  it('reveal=prev=peak → PASS', () => {
    const r = evaluateMaskHandoffPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / EP_NOT_TERNARY', () => {
    expect(failCodes(evaluateMaskHandoffPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMaskHandoffPeakBridge(
          pack({
            links: [
              { id: 'L1', maskId: '预言家伪装', handoffId: 'H8-9', peakId: '预言家对峙', ep: 8 },
              { id: 'L1', maskId: '预言家伪装', handoffId: 'H8-9', peakId: '预言家对峙', ep: 8 },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateMaskHandoffPeakBridge(
          pack({
            links: [{ id: 'L1', maskId: '预言家伪装', handoffId: 'H8-9', peakId: '预言家对峙', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
  });
});
