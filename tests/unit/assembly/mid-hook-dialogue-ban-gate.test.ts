/**
 * V12 MidHook×DialogueAfterHook — 中段再钩+钩后对白双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidHookDialogueBan } from '@/agents/assembly/mid-hook-dialogue-ban-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateMidHookDialogueBan', () => {
  it('mid hook + no early dialogue → PASS', () => {
    const r = evaluateMidHookDialogueBan(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'increment', action: '追问' },
        { durSec: 2, beatRole: 'hook', action: '中段再钩', hookKind: 'action' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('missing mid hook → FAIL', () => {
    const r = evaluateMidHookDialogueBan(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 6, beatRole: 'setup', action: '长铺垫温吞' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
  });
});
