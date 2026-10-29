/**
 * V12 CliffTail×Reaction — 紧尾+悬念前反应双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffTailReaction } from '@/agents/assembly/cliff-tail-reaction-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateCliffTailReaction', () => {
  it('tight cliff + prior reaction → PASS', () => {
    const r = evaluateCliffTailReaction(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 6, beatRole: 'increment', action: '追查' },
        { durSec: 6, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '脸色煞白' },
        { durSec: 2, beatRole: 'cliffhanger', action: '门响' },
      ]),
      { hardTailToleranceSec: 3 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('cliff without prior reaction → FAIL', () => {
    const r = evaluateCliffTailReaction(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 8, beatRole: 'increment', action: '追查' },
        { durSec: 8, beatRole: 'reversal', action: '反转' },
        { durSec: 2, beatRole: 'cliffhanger', action: '门响' },
      ]),
      { hardTailToleranceSec: 3, lookbackSec: 4 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
