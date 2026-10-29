/**
 * V12 DialogueAfterHook×SetupAfterHookBan — 钩后对白+禁铺垫双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateDialogueSetupBan } from '@/agents/assembly/dialogue-setup-ban-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateDialogueSetupBan', () => {
  it('hook then increment, no late setup → PASS', () => {
    const r = evaluateDialogueSetupBan(
      spec([
        { durSec: 1, beatRole: 'setup', action: '环境一瞥' },
        { durSec: 2, beatRole: 'hook', action: '危机开场', hookKind: 'situation' },
        { durSec: 4, beatRole: 'increment', action: '追问推进' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('setup after hook → FAIL', () => {
    const r = evaluateDialogueSetupBan(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机开场', hookKind: 'situation' },
        { durSec: 4, beatRole: 'setup', action: '钩后回铺垫' },
        { durSec: 4, beatRole: 'reversal', action: '反转' },
        { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
  });
});
