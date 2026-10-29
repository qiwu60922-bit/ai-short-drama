/**
 * V12 Conflict×Cliff Link — 冲突欠账×跨集悬念, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictCliffLink } from '@/agents/assembly/conflict-cliff-link-gate';

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
  series: '帐中香',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  cliffLinks: [{
    id: 'C9-10',
    prevEp: 9,
    nextEp: 10,
    prev: spec('EP09', prevGood()),
    next: spec('EP10', nextGood()),
  }],
  links: [{ id: 'L1', conflictId: '挑衅反噬', cliffLinkId: 'C9-10', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictCliffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictCliffLink', () => {
  it('payoff at nextEp → PASS', () => {
    const r = evaluateConflictCliffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_NEXT / CLIFF_WITHOUT_CONFLICT', () => {
    expect(failCodes(evaluateConflictCliffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictCliffLink(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', cliffLinkId: 'C9-10', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_NEXT');
    expect(failCodes(evaluateConflictCliffLink(pack({ links: [] })))).toContain(
      'CLIFF_WITHOUT_CONFLICT',
    );
  });
});
