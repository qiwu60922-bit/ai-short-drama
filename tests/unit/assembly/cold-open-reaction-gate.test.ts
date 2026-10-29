/**
 * V12 ColdOpen×Reaction — 冷开场+反应镜双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdOpenReaction } from '@/agents/assembly/cold-open-reaction-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateColdOpenReaction', () => {
  it('cold open + reaction after reversal → PASS', () => {
    const r = evaluateColdOpenReaction(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '脸色煞白' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { coldOpenWindowSec: 2 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('setup before hook → FAIL', () => {
    const r = evaluateColdOpenReaction(
      spec([
        { durSec: 4, beatRole: 'setup', action: '铺垫' },
        { durSec: 2, beatRole: 'hook', action: '晚钩', hookKind: 'situation' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '反应' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { coldOpenWindowSec: 2 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
