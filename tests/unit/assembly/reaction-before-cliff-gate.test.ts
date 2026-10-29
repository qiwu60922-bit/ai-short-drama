/**
 * V12 Reaction-Before-Cliff — 悬念前反应镜闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateReactionBeforeCliff } from '@/agents/assembly/reaction-before-cliff-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const failCodes = (r: ReturnType<typeof evaluateReactionBeforeCliff>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateReactionBeforeCliff', () => {
  it('reaction immediately before cliff → PASS', () => {
    const r = evaluateReactionBeforeCliff(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 3, beatRole: 'reaction', action: '脸色煞白' },
        { durSec: 4, beatRole: 'cliffhanger', action: '门外脚步' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.cliffMissingPrior).toBe(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('cliff without prior reaction → CLIFF_NO_PRIOR_REACTION', () => {
    expect(
      failCodes(
        evaluateReactionBeforeCliff(
          spec([
            { durSec: 2, beatRole: 'hook', action: '开场' },
            { durSec: 4, beatRole: 'increment', action: '追问' },
            { durSec: 6, beatRole: 'reversal', action: '反转' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念空飘' },
          ]),
        ),
      ),
    ).toContain('CLIFF_NO_PRIOR_REACTION');
  });
});
