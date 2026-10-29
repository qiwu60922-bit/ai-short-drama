/**
 * V12 SetupMidCap×MidTurnDensity — 中段铺垫上限+反转密度双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateSetupMidTurn } from '@/agents/assembly/setup-mid-turn-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateSetupMidTurn', () => {
  it('mid turns + setup cap → PASS', () => {
    const r = evaluateSetupMidTurn(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'increment', action: '增量1' },
        { durSec: 3, beatRole: 'reversal', action: '反转1' },
        { durSec: 3, beatRole: 'increment', action: '增量2' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { minTurns: 2, maxMidSetupRatio: 0.4 },
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('sparse mid turns → FAIL', () => {
    const r = evaluateSetupMidTurn(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 8, beatRole: 'setup', action: '大段铺垫' },
        { durSec: 8, beatRole: 'setup', action: '继续铺垫' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
      { minTurns: 2, maxMidSetupRatio: 0.4 },
    );
    expect(r.verdict).toBe('FAIL');
  });
});
