/**
 * V12 Hook-Window Hard — 钩子窗口硬闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHookWindowHard } from '@/agents/assembly/hook-window-hard-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

const early = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
  { durSec: 4, beatRole: 'increment', action: '增量' },
  { durSec: 4, beatRole: 'reversal', action: '反转' },
  { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
];

const failCodes = (r: ReturnType<typeof evaluateHookWindowHard>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHookWindowHard', () => {
  it('hook in 2s → PASS', () => {
    const r = evaluateHookWindowHard(spec(early()), { hardHookWindowSec: 2 });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.hardHookWindowSec).toBe(2);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('late hook → HOOK_WINDOW_HARD FAIL', () => {
    expect(
      failCodes(
        evaluateHookWindowHard(
          spec([
            { durSec: 3, beatRole: 'setup', action: '铺垫过长' },
            { durSec: 2, beatRole: 'hook', action: '迟钩' },
            { durSec: 4, beatRole: 'increment', action: '增量' },
            { durSec: 4, beatRole: 'reversal', action: '反转' },
            { durSec: 4, beatRole: 'cliffhanger', action: '悬念' },
          ]),
          { hardHookWindowSec: 2 },
        ),
      ),
    ).toContain('HOOK_WINDOW_HARD');
  });
});
