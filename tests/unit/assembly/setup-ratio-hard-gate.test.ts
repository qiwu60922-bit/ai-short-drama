/**
 * V12 Setup-Ratio Hard — 铺垫占比硬闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateSetupRatioHard } from '@/agents/assembly/setup-ratio-hard-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const lean = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
  { durSec: 3, beatRole: 'setup', action: '短铺垫' },
  { durSec: 4, beatRole: 'increment', action: '增量' },
  { durSec: 4, beatRole: 'reversal', action: '反转' },
  { durSec: 4, beatRole: 'increment', action: '再增量' },
  { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
];

const failCodes = (r: ReturnType<typeof evaluateSetupRatioHard>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateSetupRatioHard', () => {
  it('lean setup → PASS', () => {
    const r = evaluateSetupRatioHard(spec(lean()), { hardMaxSetupRatio: 0.35 });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.setupRatio).toBeLessThanOrEqual(0.35);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('heavy setup → SETUP_RATIO_HARD FAIL', () => {
    expect(
      failCodes(
        evaluateSetupRatioHard(
          spec([
            { durSec: 2, beatRole: 'hook', action: '危机' },
            { durSec: 12, beatRole: 'setup', action: '长铺垫A' },
            { durSec: 10, beatRole: 'setup', action: '长铺垫B' },
            { durSec: 2, beatRole: 'increment', action: '一点增量' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
          ]),
          { hardMaxSetupRatio: 0.35 },
        ),
      ),
    ).toContain('SETUP_RATIO_HARD');
  });
});
