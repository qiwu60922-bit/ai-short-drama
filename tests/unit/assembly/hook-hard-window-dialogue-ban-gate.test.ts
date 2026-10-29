/**
 * V12 Shot dual — evaluateHookHardWindowDialogueBan, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHookHardWindowDialogueBan } from '@/agents/assembly/hook-hard-window-dialogue-ban-gate';
type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});
const good = () => [
  { durSec: 1, beatRole: 'hook', action: '冷开危机', hookKind: 'situation' },
  { durSec: 1, beatRole: 'hook', action: '细节钩', hookKind: 'detail_cu' },
  { durSec: 3, beatRole: 'increment', action: '加压推进' },
  { durSec: 3, beatRole: 'hook', action: '中段钩', hookKind: 'situation' },
  { durSec: 4, beatRole: 'increment', action: '加压' },
  { durSec: 4, beatRole: 'reversal', action: '反转' },
  { durSec: 2, beatRole: 'reaction', action: '反应' },
  { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
];

describe('evaluateHookHardWindowDialogueBan', () => {
  it('good shape → PASS', () => {
    const r = evaluateHookHardWindowDialogueBan(spec(good()));
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('bad shape → FAIL', () => {
    const r = evaluateHookHardWindowDialogueBan(
      spec([
        { durSec: 8, beatRole: 'setup', action: '铺垫' },
        { durSec: 8, beatRole: 'increment', action: '加压' },
        { durSec: 1.5, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
  });
});
