/**
 * V12 Mid-Turn Setup Cap — 中段反转密度+铺垫上限, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidTurnSetupCap } from '@/agents/assembly/mid-turn-setup-cap-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const failCodes = (r: ReturnType<typeof evaluateMidTurnSetupCap>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMidTurnSetupCap', () => {
  it('dense mid turns + light setup → PASS', () => {
    const r = evaluateMidTurnSetupCap(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 2, beatRole: 'setup', action: '短铺垫' },
        { durSec: 4, beatRole: 'increment', action: '增量' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.midTurnCount).toBeGreaterThanOrEqual(2);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('heavy mid setup → SETUP_MID_CAP', () => {
    expect(
      failCodes(
        evaluateMidTurnSetupCap(
          spec([
            { durSec: 2, beatRole: 'hook', action: '危机' },
            { durSec: 8, beatRole: 'setup', action: '长铺垫A' },
            { durSec: 6, beatRole: 'setup', action: '长铺垫B' },
            { durSec: 2, beatRole: 'increment', action: '增量' },
            { durSec: 2, beatRole: 'reversal', action: '反转' },
            { durSec: 2, beatRole: 'cliffhanger', action: '悬念' },
          ]),
          { maxMidSetupRatio: 0.4 },
        ),
      ),
    ).toContain('SETUP_MID_CAP');
  });

  it('sparse mid turns → MID_TURN_SPARSE', () => {
    expect(
      failCodes(
        evaluateMidTurnSetupCap(
          spec([
            { durSec: 2, beatRole: 'hook', action: '危机' },
            { durSec: 8, beatRole: 'setup', action: '长铺垫' },
            { durSec: 2, beatRole: 'increment', action: '仅一转' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
          ]),
          { minTurns: 2 },
        ),
      ),
    ).toContain('MID_TURN_SPARSE');
  });
});
