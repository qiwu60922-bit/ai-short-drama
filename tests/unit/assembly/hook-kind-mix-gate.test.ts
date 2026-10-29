/**
 * V12 Hook-Kind Mix — 开场钩种类多样性, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHookKindMix } from '@/agents/assembly/hook-kind-mix-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const mixed = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '双手交叠', hookKind: 'detail_cu' },
  { durSec: 2, beatRole: 'hook', action: '危机局面', hookKind: 'situation' },
  { durSec: 4, beatRole: 'increment', action: '追问' },
  { durSec: 6, beatRole: 'reversal', action: '反转' },
  { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
];

const failCodes = (r: ReturnType<typeof evaluateHookKindMix>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateHookKindMix>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateHookKindMix', () => {
  it('mixed early hooks → PASS', () => {
    const r = evaluateHookKindMix(spec(mixed()), { hookWindowSec: 8 });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.distinctKinds).toBeGreaterThanOrEqual(2);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('single kind → HOOK_KIND_MONOTONE', () => {
    expect(
      failCodes(
        evaluateHookKindMix(
          spec([
            { durSec: 2, beatRole: 'hook', action: '正脸', hookKind: 'face' },
            { durSec: 2, beatRole: 'hook', action: '再正脸', hookKind: 'face' },
            { durSec: 4, beatRole: 'increment', action: '追问' },
            { durSec: 6, beatRole: 'reversal', action: '反转' },
            { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
          ]),
          { hookWindowSec: 8, minDistinctKinds: 2 },
        ),
      ),
    ).toContain('HOOK_KIND_MONOTONE');
  });

  it('face heavy → HOOK_KIND_FACE_HEAVY WARN', () => {
    const r = evaluateHookKindMix(
      spec([
        { durSec: 2, beatRole: 'hook', action: '正脸1', hookKind: 'face' },
        { durSec: 2, beatRole: 'hook', action: '正脸2', hookKind: 'face' },
        { durSec: 2, beatRole: 'hook', action: '局部', hookKind: 'detail_cu' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 6, beatRole: 'reversal', action: '反转' },
        { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { hookWindowSec: 8, maxFaceRatio: 0.5 },
    );
    expect(warnCodes(r)).toContain('HOOK_KIND_FACE_HEAVY');
    expect(r.verdict).toBe('PASS');
  });
});
