/**
 * V12 Dialogue Exposition Gate — mid-episode plot must be a visible event, not dialogue gloss.
 * From 红果 hit 《不候，过期离婚》 anti-pattern: "几句台词带过时空穿梭救女主". ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateDialogueExposition, PLOT_ROLES } from '@/agents/assembly/dialogue-exposition-gate';

type S = {
  durSec: number;
  beatRole?: string;
  action?: string;
  dialogue?: string | string[] | null;
  vo?: string | null;
};
const spec = (shots: S[]) => ({
  episode: 'T',
  shots: shots.map((s, i) => ({ shotId: `S${i}`, cast: [], ...s })),
});
const failCodes = (r: ReturnType<typeof evaluateDialogueExposition>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateDialogueExposition', () => {
  it('exposes plot-carrying roles that must show a visual event', () => {
    expect(PLOT_ROLES).toEqual(['hook', 'increment', 'reversal']);
  });

  it('plot shot with spoken lines + clear action → PASS, gates untouched', () => {
    const r = evaluateDialogueExposition(
      spec([
        { durSec: 4, beatRole: 'hook', action: '黑羽使徒破窗闯入，剑尖指向齐耶', dialogue: '你归我带' },
        { durSec: 4, beatRole: 'setup', dialogue: '走廊里只剩喘息' },
        { durSec: 5, beatRole: 'reversal', action: '齐耶抬腕，刻印亮起，反手格开一剑', dialogue: '怎么会在你身上？' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.findings.filter((f) => f.severity === 'FAIL')).toHaveLength(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.metrics.plotShots).toBe(2);
    expect(r.metrics.dialogueOnlyPlotShots).toBe(0);
  });

  it('plot beat carried only by dialogue with empty action → DIALOGUE_ONLY_PLOT FAIL', () => {
    const r = evaluateDialogueExposition(
      spec([
        {
          durSec: 6,
          beatRole: 'increment',
          dialogue: '然后她穿越时空救下了女主，一切都变了',
        },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('DIALOGUE_ONLY_PLOT');
    expect(r.findings.find((f) => f.code === 'DIALOGUE_ONLY_PLOT')?.shotIds).toEqual(['S0']);
    expect(r.metrics.dialogueOnlyPlotShots).toBe(1);
  });

  it('plot beat with VO-only gloss and tiny action → DIALOGUE_ONLY_PLOT FAIL', () => {
    const r = evaluateDialogueExposition(
      spec([
        {
          durSec: 5,
          beatRole: 'reversal',
          action: '站着',
          vo: '时空裂缝一闪，三年后的她救回了从前的自己',
        },
      ]),
    );
    expect(failCodes(r)).toContain('DIALOGUE_ONLY_PLOT');
  });

  it('setup / cliffhanger may be dialogue-heavy without FAIL', () => {
    const r = evaluateDialogueExposition(
      spec([
        { durSec: 4, beatRole: 'setup', dialogue: '我们明天再谈离婚的事吧' },
        { durSec: 3, beatRole: 'cliffhanger', dialogue: '你以为你逃得掉？' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toHaveLength(0);
  });

  it('plot shot with strong action and no speech → PASS', () => {
    const r = evaluateDialogueExposition(
      spec([{ durSec: 3, beatRole: 'hook', action: '重卡冲撞三轮，玻璃碎溅，外公倒地' }]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.dialogueOnlyPlotShots).toBe(0);
  });

  it('untagged plot-like dialogue mid-episode is WARN EXPOSITION_UNLABELED, not FAIL', () => {
    const r = evaluateDialogueExposition(
      spec([
        { durSec: 2, beatRole: 'hook', action: '门被撞开，黑影扑入' },
        {
          durSec: 8,
          dialogue: '后来她穿越回十八岁，把一切都改写了，包括那场车祸',
        },
        { durSec: 3, beatRole: 'cliffhanger', action: '镜头定格在未合上的门缝' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.findings.find((f) => f.code === 'EXPOSITION_UNLABELED')).toMatchObject({
      severity: 'WARN',
      shotIds: ['S1'],
    });
  });

  it('SCHEMA FAIL when ShotSpec is invalid', () => {
    const r = evaluateDialogueExposition({ episode: 'T', shots: [] });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('SCHEMA');
  });
});
