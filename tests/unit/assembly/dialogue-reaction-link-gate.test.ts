/**
 * V12 Dialogue×Reaction Link — 台词带过剧情 × 反应镜, offline, ≠Final ≠G3.
 * Deepened: EXPOSITION_UNLABELED bubble (default FAIL on link).
 */
import { describe, expect, it } from 'vitest';
import { evaluateDialogueReactionLink } from '@/agents/assembly/dialogue-reaction-link-gate';

type S = {
  durSec: number;
  beatRole?: string;
  action?: string;
  dialogue?: string | string[] | null;
};
const spec = (shots: S[]) => ({
  episode: 'T',
  shots: shots.map((s, i) => ({ shotId: `S${i}`, cast: [], ...s })),
});

const good = spec([
  { durSec: 4, beatRole: 'hook', action: '黑羽使徒破窗闯入，剑尖指向齐耶', dialogue: '你归我带' },
  { durSec: 4, beatRole: 'setup', dialogue: '走廊里只剩喘息' },
  { durSec: 6, beatRole: 'reversal', action: '齐耶抬腕，刻印亮起，反手格开一剑', dialogue: '怎么会？' },
  { durSec: 3, beatRole: 'reaction', action: '齐耶瞳孔收缩，后退半步' },
  { durSec: 5, beatRole: 'cliffhanger', action: '门外更多脚步逼近', dialogue: '来不及了' },
  { durSec: 2, beatRole: 'reaction', action: '众人面面相觑' },
]);

const dialogueOnly = spec([
  {
    durSec: 6,
    beatRole: 'increment',
    dialogue: '然后她穿越时空救下了女主，一切都变了',
  },
]);

const noReaction = spec([
  { durSec: 4, beatRole: 'hook', action: '黑衣人破门而入举枪', dialogue: '站住' },
  { durSec: 8, beatRole: 'reversal', action: '身份牌翻开露出伪人纹路', dialogue: '你是伪人' },
  { durSec: 6, beatRole: 'setup', action: '走廊空镜缓慢推进' },
]);

const unlabeledMid = spec([
  { durSec: 2, beatRole: 'hook', action: '门被撞开，黑影扑入' },
  {
    durSec: 8,
    dialogue: '后来她穿越回十八岁，把一切都改写了，包括那场车祸',
  },
  { durSec: 6, beatRole: 'reversal', action: '齐耶抬腕刻印亮起格开一剑' },
  { durSec: 2, beatRole: 'reaction', action: '齐耶瞳孔收缩' },
]);

const pack = (links: Array<Record<string, unknown>>, latestEp = 10) => ({
  series: '不候',
  latestEp,
  links,
});

const failCodes = (r: ReturnType<typeof evaluateDialogueReactionLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateDialogueReactionLink', () => {
  it('visual plot + reaction → PASS', () => {
    const r = evaluateDialogueReactionLink(
      pack([{ id: 'L1', ep: 3, shotSpec: good }]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.metrics.unlabeledExposition).toBe(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / FUTURE_EP', () => {
    expect(failCodes(evaluateDialogueReactionLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateDialogueReactionLink(
          pack([
            { id: 'd', ep: 1, shotSpec: good },
            { id: 'd', ep: 1, shotSpec: good },
          ]),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateDialogueReactionLink(pack([{ id: 'L1', ep: 9, shotSpec: good }], 3)),
      ),
    ).toContain('FUTURE_EP');
  });

  it('dialogue-only plot → CHILD_DIALOGUE_FAIL', () => {
    expect(
      failCodes(
        evaluateDialogueReactionLink(pack([{ id: 'L1', ep: 1, shotSpec: dialogueOnly }])),
      ),
    ).toContain('CHILD_DIALOGUE_FAIL');
  });

  it('missing reaction → CHILD_REACTION_FAIL', () => {
    expect(
      failCodes(
        evaluateDialogueReactionLink(pack([{ id: 'L1', ep: 1, shotSpec: noReaction }])),
      ),
    ).toContain('CHILD_REACTION_FAIL');
  });

  it('mid unlabeled exposition → EXPOSITION_UNLABELED FAIL by default', () => {
    const r = evaluateDialogueReactionLink(pack([{ id: 'L1', ep: 1, shotSpec: unlabeledMid }]));
    expect(failCodes(r)).toContain('EXPOSITION_UNLABELED');
    expect(r.metrics.unlabeledExposition).toBeGreaterThan(0);
  });

  it('requireLabeledExposition=false → WARN then PASS when reaction ok', () => {
    const r = evaluateDialogueReactionLink({
      series: '不候',
      latestEp: 10,
      requireLabeledExposition: false,
      links: [{ id: 'L1', ep: 1, shotSpec: unlabeledMid }],
    });
    expect(r.findings.filter((f) => f.code === 'EXPOSITION_UNLABELED').map((f) => f.severity)).toEqual([
      'WARN',
    ]);
    expect(r.verdict).toBe('PASS');
  });
});
