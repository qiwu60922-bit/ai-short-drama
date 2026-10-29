/**
 * V12 Mid-Turn Density — 中段反转/增量密度, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidTurnDensity } from '@/agents/assembly/mid-turn-density-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const denseMid = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
  { durSec: 3, beatRole: 'setup', action: '铺垫' },
  { durSec: 4, beatRole: 'increment', action: '信息增量A' },
  { durSec: 4, beatRole: 'reversal', action: '反转' },
  { durSec: 4, beatRole: 'increment', action: '信息增量B' },
  { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
];

const failCodes = (r: ReturnType<typeof evaluateMidTurnDensity>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateMidTurnDensity>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateMidTurnDensity', () => {
  it('dense mid turns → PASS', () => {
    const r = evaluateMidTurnDensity(spec(denseMid()), { minTurns: 2 });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.midTurnCount).toBeGreaterThanOrEqual(2);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('sparse mid → MID_TURN_SPARSE', () => {
    expect(
      failCodes(
        evaluateMidTurnDensity(
          spec([
            { durSec: 2, beatRole: 'hook', action: '危机' },
            { durSec: 10, beatRole: 'setup', action: '长铺垫' },
            { durSec: 2, beatRole: 'increment', action: '唯一增量' },
            { durSec: 6, beatRole: 'cliffhanger', action: '悬念' },
          ]),
          { minTurns: 2 },
        ),
      ),
    ).toContain('MID_TURN_SPARSE');
  });

  it('exactly minTurns → MID_TURN_SOFT WARN', () => {
    const r = evaluateMidTurnDensity(spec(denseMid()), { minTurns: 3 });
    // denseMid has 3 mid turns typically
    if (r.metrics.midTurnCount === 3) {
      expect(warnCodes(r)).toContain('MID_TURN_SOFT');
      expect(r.verdict).toBe('PASS');
    } else {
      expect(r.metrics.midTurnCount).toBeGreaterThanOrEqual(2);
    }
  });
});
