/**
 * V12 MidHook×Reaction — 中段早钩+反转后反应双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidHookReaction } from '@/agents/assembly/mid-hook-reaction-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateMidHookReaction', () => {
  it('mid hook + reaction after reversal → PASS', () => {
    const r = evaluateMidHookReaction(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'setup', action: '铺垫' },
        { durSec: 3, beatRole: 'hook', action: '中段钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '反应' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('no mid hook → FAIL', () => {
    const r = evaluateMidHookReaction(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场钩', hookKind: 'situation' },
        { durSec: 8, beatRole: 'setup', action: '长铺垫' },
        { durSec: 8, beatRole: 'setup', action: '继续铺' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
  });
});
