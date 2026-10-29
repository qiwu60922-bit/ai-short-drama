/**
 * V12 ColdOpen×MidTurn — 冷开场+中段密度双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdOpenMidTurn } from '@/agents/assembly/cold-open-mid-turn-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateColdOpenMidTurn', () => {
  it('cold open + mid turns → PASS', () => {
    const r = evaluateColdOpenMidTurn(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转1' },
        { durSec: 4, beatRole: 'increment', action: '加压' },
        { durSec: 4, beatRole: 'reversal', action: '反转2' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { coldOpenWindowSec: 2, minTurns: 1 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('setup before hook → FAIL', () => {
    const r = evaluateColdOpenMidTurn(
      spec([
        { durSec: 4, beatRole: 'setup', action: '铺垫' },
        { durSec: 2, beatRole: 'hook', action: '晚钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { coldOpenWindowSec: 2 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
