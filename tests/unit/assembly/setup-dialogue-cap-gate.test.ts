/**
 * V12 SetupMidCap×DialogueExposition — 中段铺垫+台词动作双闸, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateSetupDialogueCap } from '@/agents/assembly/setup-dialogue-cap-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string; dialogue?: string };
const spec = (shots: S[]) => ({
  episode: 'EP01',
  shots: shots.map((s, i) => ({ shotId: `EP01-S${i}`, cast: [], ...s })),
});

describe('evaluateSetupDialogueCap', () => {
  it('low mid setup + visible action → PASS', () => {
    const r = evaluateSetupDialogueCap(
      spec([
        { durSec: 2, beatRole: 'hook', action: '黑衣人破窗闯入举枪', hookKind: 'situation' },
        { durSec: 2, beatRole: 'setup', action: '走廊空镜缓慢推进' },
        { durSec: 4, beatRole: 'increment', action: '齐耶抬腕刻印亮起格开一剑' },
        { durSec: 4, beatRole: 'reversal', action: '齐耶瞳孔收缩后退闪避' },
        { durSec: 4, beatRole: 'cliffhanger', action: '门外更多脚步逼近' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('heavy mid setup → FAIL', () => {
    const r = evaluateSetupDialogueCap(
      spec([
        { durSec: 2, beatRole: 'hook', action: '危机', hookKind: 'situation' },
        { durSec: 8, beatRole: 'setup', action: '超长铺垫温吞解说' },
        { durSec: 2, beatRole: 'reversal', action: '反转' },
        { durSec: 2, beatRole: 'cliffhanger', action: '悬念' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
  });
});
