/**
 * V12 MidTurn×ReactionBeforeCliff — 中段密度+悬念前反应双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidTurnReaction } from '@/agents/assembly/mid-turn-reaction-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateMidTurnReaction', () => {
  it('dense mid + prior reaction → PASS', () => {
    const r = evaluateMidTurnReaction(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'increment', action: '信息增量A' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'increment', action: '信息增量B' },
        { durSec: 3, beatRole: 'reaction', action: '脸色煞白' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { minTurns: 2 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.cliffMissingPrior).toBe(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('cliff without prior reaction → FAIL', () => {
    const r = evaluateMidTurnReaction(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'increment', action: '信息增量A' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'increment', action: '信息增量B' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { minTurns: 2 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
