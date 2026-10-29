/**
 * V12 MidTurn×ColdClose — dual shot gate, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidTurnColdClose } from '@/agents/assembly/mid-turn-cold-close-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateMidTurnColdClose', () => {
  it('good shape → PASS', () => {
    const r = evaluateMidTurnColdClose(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'increment', action: '信息增量A' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'increment', action: '信息增量B' },
        { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { minTurns: 2, coldTailSec: 2 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('sparse mid → FAIL', () => {
    const r = evaluateMidTurnColdClose(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 8, beatRole: 'setup', action: '长铺垫' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { minTurns: 2, coldTailSec: 2 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
