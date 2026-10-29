/**
 * V12 CliffTail×HookWindow — dual shot gate, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffTailHookWindow } from '@/agents/assembly/cliff-tail-hook-window-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateCliffTailHookWindow', () => {
  it('good shape → PASS', () => {
    const r = evaluateCliffTailHookWindow(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'setup', action: '铺垫' },
        { durSec: 4, beatRole: 'increment', action: '加压' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { hardTailToleranceSec: 1.5, hardHookWindowSec: 2 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('late hook → FAIL', () => {
    const r = evaluateCliffTailHookWindow(
      spec([
        { durSec: 5, beatRole: 'setup', action: '长铺垫' },
        { durSec: 2, beatRole: 'hook', action: '晚钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'increment', action: '加压' },
        { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { hardTailToleranceSec: 1.5, hardHookWindowSec: 2 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
