/**
 * V12 MidHook×SetupBan — 中段再钩+钩后禁铺垫双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMidHookSetupBan } from '@/agents/assembly/mid-hook-setup-ban-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateMidHookSetupBan', () => {
  it('mid hook + no setup after first hook → PASS', () => {
    const r = evaluateMidHookSetupBan(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'increment', action: '追问' },
        { durSec: 2, beatRole: 'hook', action: '中段再钩', hookKind: 'action' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('setup after hook → FAIL', () => {
    const r = evaluateMidHookSetupBan(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 3, beatRole: 'setup', action: '回铺垫' },
        { durSec: 2, beatRole: 'hook', action: '中段再钩', hookKind: 'action' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(r.findings.some((f) => f.code === 'SETUP_AFTER_HOOK')).toBe(true);
  });
});
