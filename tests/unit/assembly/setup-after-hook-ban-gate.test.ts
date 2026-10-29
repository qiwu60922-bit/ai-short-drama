/**
 * V12 Setup-After-Hook Ban — 钩后禁铺垫闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateSetupAfterHookBan } from '@/agents/assembly/setup-after-hook-ban-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const failCodes = (r: ReturnType<typeof evaluateSetupAfterHookBan>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateSetupAfterHookBan', () => {
  it('setup only before hook → PASS', () => {
    const r = evaluateSetupAfterHookBan(
      spec([
        { durSec: 1, beatRole: 'setup', action: '环境一瞥' },
        { durSec: 2, beatRole: 'hook', action: '危机开场' },
        { durSec: 4, beatRole: 'increment', action: '追问' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.setupAfterHookShots).toBe(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('setup after hook → SETUP_AFTER_HOOK', () => {
    expect(
      failCodes(
        evaluateSetupAfterHookBan(
          spec([
            { durSec: 2, beatRole: 'hook', action: '危机' },
            { durSec: 4, beatRole: 'setup', action: '又开始介绍人物背景' },
            { durSec: 4, beatRole: 'increment', action: '追问' },
            { durSec: 4, beatRole: 'reversal', action: '反转' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
          ]),
        ),
      ),
    ).toContain('SETUP_AFTER_HOOK');
  });
});
