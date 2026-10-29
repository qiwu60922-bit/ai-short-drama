/**
 * V12 MidTurn×HookWindowHard — 中段密度+硬钩窗双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidTurnHookWindow } from '@/agents/assembly/mid-turn-hook-window-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateMidTurnHookWindow', () => {
  it('dense mid + hard hook → PASS', () => {
    const r = evaluateMidTurnHookWindow(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'increment', action: '信息增量A' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'increment', action: '信息增量B' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { minTurns: 2, hardHookWindowSec: 2 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.hardHookWindowSec).toBe(2);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('late hook → FAIL', () => {
    const r = evaluateMidTurnHookWindow(
      spec([
        { durSec: 4, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'hook', action: '晚钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'increment', action: '增量' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { hardHookWindowSec: 2 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
