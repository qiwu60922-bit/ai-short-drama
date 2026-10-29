/**
 * V12 Peak×Handoff Link — 巅峰兑现 × 集间悬念承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePeakHandoffLink } from '@/agents/assembly/peak-handoff-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '订婚宴嫌弃峰值' },
  { durSec: 8, beatRole: 'increment', action: '对峙升级' },
  { durSec: 8, beatRole: 'reversal', action: '甩出证据' },
  { durSec: 10, beatRole: 'cliffhanger', action: '清算未完门外有人' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '门外脚步未解' },
  { durSec: 2, beatRole: 'increment', action: '对峙延续' },
  { durSec: 10, beatRole: 'reversal', action: '新证人现身' },
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const peak = {
  id: '养老房清算',
  openEp: 1,
  peakEp: 8,
  peakLabel: '订婚宴嫌弃',
  payoffEp: 8,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '卖掉养老房',
  latestEp: 20,
  peaks: [peak],
  handoffs: [handoff],
  links: [{ id: 'L1', peakId: '养老房清算', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluatePeakHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluatePeakHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluatePeakHandoffLink', () => {
  it('handoff at peak/payoff → PASS', () => {
    const r = evaluatePeakHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN', () => {
    expect(failCodes(evaluatePeakHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluatePeakHandoffLink(
          pack({
            links: [
              { id: 'd', peakId: '养老房清算', handoffId: 'H8-9' },
              { id: 'd', peakId: '养老房清算', handoffId: 'H8-9' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    const r = evaluatePeakHandoffLink(
      pack({
        links: [
          { id: 'a', peakId: 'ghost', handoffId: 'H8-9' },
          { id: 'b', peakId: '养老房清算', handoffId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_PEAK', 'UNKNOWN_HANDOFF']));
  });

  it('prevEp not peak/payoff → HANDOFF_NOT_AT_PEAK_OR_PAYOFF', () => {
    expect(
      failCodes(
        evaluatePeakHandoffLink(
          pack({
            handoffs: [{ ...handoff, id: 'H3-4', prevEp: 3, nextEp: 4 }],
            links: [{ id: 'L1', peakId: '养老房清算', handoffId: 'H3-4' }],
          }),
        ),
      ),
    ).toContain('HANDOFF_NOT_AT_PEAK_OR_PAYOFF');
  });

  it('peak without link → PEAK_WITHOUT_HANDOFF', () => {
    expect(failCodes(evaluatePeakHandoffLink(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_HANDOFF',
    );
  });

  it('orphan handoff → PENDING_HANDOFF WARN', () => {
    const r = evaluatePeakHandoffLink(
      pack({
        handoffs: [
          handoff,
          {
            id: 'Horphan',
            prevEp: 8,
            nextEp: 9,
            prev: spec('EP08b', prevGood()),
            next: spec('EP09b', nextGood()),
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_HANDOFF');
    expect(r.verdict).toBe('PASS');
  });
});
