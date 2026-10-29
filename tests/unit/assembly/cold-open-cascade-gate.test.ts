/**
 * V12 Cold-Open Cascade — 冷开 × 叠钩复合闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdOpenCascade } from '@/agents/assembly/cold-open-cascade-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const good = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '危机冷开', hookKind: 'situation' },
  { durSec: 2, beatRole: 'increment', action: '身份扭转' },
  { durSec: 4, beatRole: 'reversal', action: '反转' },
  { durSec: 6, beatRole: 'increment', action: '追问' },
  { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
];

const failCodes = (r: ReturnType<typeof evaluateColdOpenCascade>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateColdOpenCascade', () => {
  it('cold open + cascade → PASS', () => {
    const r = evaluateColdOpenCascade(spec(good()), {
      coldOpenWindowSec: 2,
      cascadeWindowSec: 8,
      minCascadeBeats: 2,
    });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.coldOpenVerdict).toBe('PASS');
    expect(r.metrics.cascadeVerdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('setup before hook → FAIL', () => {
    expect(
      failCodes(
        evaluateColdOpenCascade(
          spec([
            { durSec: 4, beatRole: 'setup', action: '先铺垫' },
            { durSec: 2, beatRole: 'hook', action: '晚钩' },
            { durSec: 4, beatRole: 'increment', action: '增量' },
            { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
          ]),
        ),
      ),
    ).toEqual(expect.arrayContaining(['SETUP_BEFORE_HOOK']));
  });

  it('thin cascade → CASCADE_THIN', () => {
    expect(
      failCodes(
        evaluateColdOpenCascade(
          spec([
            { durSec: 2, beatRole: 'hook', action: '唯一钩' },
            { durSec: 10, beatRole: 'setup', action: '长铺垫' },
            { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
          ]),
          { minCascadeBeats: 2, cascadeWindowSec: 8 },
        ),
      ),
    ).toContain('CASCADE_THIN');
  });
});
