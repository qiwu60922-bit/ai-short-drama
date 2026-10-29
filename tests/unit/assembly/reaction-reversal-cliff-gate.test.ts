/**
 * V12 ReactionAfterReversal×BeforeCliff — 反转后/悬念前反应双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateReactionReversalCliff } from '@/agents/assembly/reaction-reversal-cliff-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateReactionReversalCliff', () => {
  it('reaction after reversal and before cliff → PASS', () => {
    const r = evaluateReactionReversalCliff(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '脸色煞白' },
        { durSec: 1, beatRole: 'cliffhanger', action: '门外脚步' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('no reaction → FAIL', () => {
    const r = evaluateReactionReversalCliff(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
  });
});
