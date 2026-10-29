/**
 * V12 HookKindMix×ColdOpen — 钩种多样+冷开, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHookKindMixColdOpen } from '@/agents/assembly/hook-kind-mix-cold-open-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const good = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '冷开危机', hookKind: 'situation' },
  { durSec: 2, beatRole: 'hook', action: '细节钩', hookKind: 'detail_cu' },
  { durSec: 4, beatRole: 'increment', action: '追问' },
  { durSec: 4, beatRole: 'reversal', action: '反转' },
  { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
];

const failCodes = (r: ReturnType<typeof evaluateHookKindMixColdOpen>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHookKindMixColdOpen', () => {
  it('cold open + mixed hook kinds → PASS', () => {
    const r = evaluateHookKindMixColdOpen(spec(good()));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.distinctKinds).toBeGreaterThanOrEqual(2);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('monotone hook kinds → HOOK_KIND_MONOTONE', () => {
    expect(
      failCodes(
        evaluateHookKindMixColdOpen(
          spec([
            { durSec: 2, beatRole: 'hook', action: '冷开', hookKind: 'situation' },
            { durSec: 2, beatRole: 'hook', action: '再钩', hookKind: 'situation' },
            { durSec: 4, beatRole: 'increment', action: '追问' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
          ]),
        ),
      ),
    ).toContain('HOOK_KIND_MONOTONE');
  });

  it('setup before hook → SETUP_BEFORE_HOOK', () => {
    expect(
      failCodes(
        evaluateHookKindMixColdOpen(
          spec([
            { durSec: 3, beatRole: 'setup', action: '温吞' },
            { durSec: 2, beatRole: 'hook', action: '晚钩', hookKind: 'situation' },
            { durSec: 2, beatRole: 'hook', action: '细节', hookKind: 'detail_cu' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
          ]),
        ),
      ),
    ).toContain('SETUP_BEFORE_HOOK');
  });
});
