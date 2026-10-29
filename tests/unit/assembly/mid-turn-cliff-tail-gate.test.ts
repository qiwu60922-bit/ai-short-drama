/**
 * V12 MidTurn×CliffTail — dual shot gate, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidTurnCliffTail } from '@/agents/assembly/mid-turn-cliff-tail-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateMidTurnCliffTail', () => {
  it('good shape → PASS', () => {
    const r = evaluateMidTurnCliffTail(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'increment', action: '信息增量A' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'increment', action: '信息增量B' },
        { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { minTurns: 2, hardTailToleranceSec: 1.5 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('sparse mid → FAIL', () => {
    const r = evaluateMidTurnCliffTail(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 8, beatRole: 'setup', action: '长铺垫' },
        { durSec: 8, beatRole: 'setup', action: '再铺' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { minTurns: 2, hardTailToleranceSec: 1.5 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
