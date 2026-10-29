/**
 * V12 Mid-Hook Early — 中段钩子前置闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidHookEarly } from '@/agents/assembly/mid-hook-early-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const good = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '开场危机', hookKind: 'situation' },
  { durSec: 3, beatRole: 'increment', action: '追问' },
  { durSec: 2, beatRole: 'hook', action: '中段再钩', hookKind: 'action' },
  { durSec: 4, beatRole: 'reversal', action: '反转' },
  { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
];

const failCodes = (r: ReturnType<typeof evaluateMidHookEarly>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMidHookEarly', () => {
  it('mid-window hook early enough → PASS', () => {
    const r = evaluateMidHookEarly(spec(good()));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.midHookAtSec).not.toBeNull();
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('no mid hook → MID_HOOK_MISSING', () => {
    expect(
      failCodes(
        evaluateMidHookEarly(
          spec([
            { durSec: 2, beatRole: 'hook', action: '开场' },
            { durSec: 5, beatRole: 'increment', action: '铺陈' },
            { durSec: 5, beatRole: 'reversal', action: '反转' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
          ]),
        ),
      ),
    ).toContain('MID_HOOK_MISSING');
  });

  it('late mid hook → MID_HOOK_LATE', () => {
    expect(
      failCodes(
        evaluateMidHookEarly(
          spec([
            { durSec: 2, beatRole: 'hook', action: '开场' },
            { durSec: 8, beatRole: 'increment', action: '长铺陈' },
            { durSec: 2, beatRole: 'hook', action: '过晚中钩' },
            { durSec: 4, beatRole: 'reversal', action: '反转' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
          ]),
          { midHookByRatio: 0.35 },
        ),
      ),
    ).toContain('MID_HOOK_LATE');
  });
});
