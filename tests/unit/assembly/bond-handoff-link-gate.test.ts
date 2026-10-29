/**
 * V12 Bond×Handoff Link — 契约×集间承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondHandoffLink } from '@/agents/assembly/bond-handoff-link-gate';

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

const bond = {
  id: '江少契约',
  partyA: '江少',
  partyB: '女主',
  contractEp: 1,
  contractLabel: '假面联姻',
  companionEps: [2, 3, 5],
  upgradeEp: 8,
  upgradeLabel: '真心崩塌后真情',
};
const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  bonds: [bond],
  handoffs: [handoff],
  links: [{ id: 'L1', bondId: '江少契约', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateBondHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateBondHandoffLink', () => {
  it('terminal at handoff.prevEp → PASS', () => {
    const r = evaluateBondHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TERMINAL_NOT_AT_HANDOFF / HANDOFF_WITHOUT_BOND', () => {
    expect(failCodes(evaluateBondHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateBondHandoffLink(
          pack({
            handoffs: [{ ...handoff, prevEp: 7, nextEp: 8 }],
          }),
        ),
      ),
    ).toContain('TERMINAL_NOT_AT_HANDOFF');
    expect(failCodes(evaluateBondHandoffLink(pack({ links: [] })))).toContain(
      'HANDOFF_WITHOUT_BOND',
    );
  });
});
