/**
 * V12 Cliff×Mask Link — 悬念叠钩 × 伪装揭穿, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffMaskLink } from '@/agents/assembly/cliff-mask-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '危机开场' },
  { durSec: 8, beatRole: 'increment', action: '追查线索' },
  { durSec: 8, beatRole: 'reversal', action: '身份暴露' },
  { durSec: 10, beatRole: 'cliffhanger', action: '持械闯入被围' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '被围承接' },
  { durSec: 2, beatRole: 'increment', action: '追问' },
  { durSec: 10, beatRole: 'reversal', action: '新证' },
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

const cliff = {
  id: 'C8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};
const mask = {
  id: '预言家伪装',
  wearer: 'linyang',
  plantEp: 1,
  maintainEps: [2, 3],
  revealEp: 8,
  revealLabel: '揭伪人',
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  cliffLinks: [cliff],
  masks: [mask],
  links: [{ id: 'L1', cliffLinkId: 'C8-9', maskId: '预言家伪装' }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateCliffMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffMaskLink', () => {
  it('reveal at cliff.prevEp → PASS', () => {
    const r = evaluateCliffMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / REVEAL_NOT_AT_CLIFF / CLIFF_WITHOUT_MASK', () => {
    expect(failCodes(evaluateCliffMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCliffMaskLink(
          pack({ masks: [{ ...mask, revealEp: 5, revealLabel: '提前揭穿' }] }),
        ),
      ),
    ).toContain('REVEAL_NOT_AT_CLIFF');
    expect(failCodes(evaluateCliffMaskLink(pack({ links: [] })))).toContain('CLIFF_WITHOUT_MASK');
  });
});
