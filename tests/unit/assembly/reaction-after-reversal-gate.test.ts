/**
 * V12 Reaction-After-Reversal — 反转后反应硬闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateReactionAfterReversal } from '@/agents/assembly/reaction-after-reversal-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const failCodes = (r: ReturnType<typeof evaluateReactionAfterReversal>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateReactionAfterReversal', () => {
  it('reversal then reaction → PASS', () => {
    const r = evaluateReactionAfterReversal(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场' },
        { durSec: 4, beatRole: 'increment', action: '增量' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '脸部冻结' },
        { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { reactionWindowSec: 8 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.reversalMissing).toBe(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('reversal without reaction → REVERSAL_NO_REACTION', () => {
    expect(
      failCodes(
        evaluateReactionAfterReversal(
          spec([
            { durSec: 2, beatRole: 'hook', action: '开场' },
            { durSec: 4, beatRole: 'reversal', action: '反转' },
            { durSec: 8, beatRole: 'increment', action: '直接跳过反应' },
            { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
          ]),
          { reactionWindowSec: 8 },
        ),
      ),
    ).toContain('REVERSAL_NO_REACTION');
  });
});
