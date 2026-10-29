/**
 * V12 Detail Hook-Kind — 局部特写钩子, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateDetailHookKind } from '@/agents/assembly/detail-hook-kind-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const detailGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '双手交叠特写', hookKind: 'detail_cu' },
  { durSec: 4, beatRole: 'increment', action: '追问' },
  { durSec: 6, beatRole: 'reversal', action: '身份反转' },
  { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
];

const failCodes = (r: ReturnType<typeof evaluateDetailHookKind>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateDetailHookKind>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateDetailHookKind', () => {
  it('early detail_cu hook → PASS', () => {
    const r = evaluateDetailHookKind(spec(detailGood()));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.detailHookCount).toBeGreaterThanOrEqual(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('face-only hook → DETAIL_HOOK_MISSING', () => {
    expect(
      failCodes(
        evaluateDetailHookKind(
          spec([
            { durSec: 2, beatRole: 'hook', action: '正脸', hookKind: 'face' },
            { durSec: 4, beatRole: 'increment', action: '追问' },
            { durSec: 6, beatRole: 'reversal', action: '反转' },
            { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
          ]),
        ),
      ),
    ).toContain('DETAIL_HOOK_MISSING');
  });

  it('late detail_cu → DETAIL_HOOK_LATE WARN', () => {
    const r = evaluateDetailHookKind(
      spec([
        { durSec: 2, beatRole: 'hook', action: '正脸开场', hookKind: 'face' },
        { durSec: 4, beatRole: 'setup', action: '铺垫' },
        { durSec: 2, beatRole: 'hook', action: '迟来的掌掴CU', hookKind: 'detail_cu' },
        { durSec: 6, beatRole: 'reversal', action: '反转' },
        { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { hookWindowSec: 3 },
    );
    expect(warnCodes(r)).toContain('DETAIL_HOOK_LATE');
  });
});
