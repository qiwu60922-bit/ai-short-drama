/**
 * V12 TailColdClose×CliffTailTight — 冷收尾+紧悬念双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdCloseCliffTail } from '@/agents/assembly/cold-close-cliff-tail-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateColdCloseCliffTail', () => {
  it('cold close cliff tail → PASS', () => {
    const r = evaluateColdCloseCliffTail(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 1, beatRole: 'cliffhanger', action: '门外脚步' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('tail not cliff → FAIL', () => {
    const r = evaluateColdCloseCliffTail(
      spec([
        { durSec: 2, beatRole: 'hook', action: '开场' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
        { durSec: 4, beatRole: 'setup', action: '收尾铺垫' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
  });
});
