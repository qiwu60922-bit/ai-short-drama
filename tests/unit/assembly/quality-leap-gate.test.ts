/**
 * V12 Quality Leap Gate — offline 表演/情绪/自然口型/镜头叙事逐镜门禁.
 * Method rewritten (MIT) from yangjing6213-dev/ai-drama-quality-leap SKILL.md:
 * https://github.com/yangjing6213-dev/ai-drama-quality-leap
 * ≠Final ≠G3. No prompt library / paid API / network.
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateQualityLeap,
  type QualityLeapDoc,
  type QualityLeapReport,
} from '@/agents/assembly/quality-leap-gate';

const failCodes = (r: QualityLeapReport) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: QualityLeapReport) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

function shot(
  id: string,
  overrides: Record<string, unknown> = {},
): QualityLeapDoc['shots'][number] {
  return {
    id,
    scriptBeat: '她看完手机，抬眼说完一句台词。',
    durationSec: 4,
    dramaPurpose: '揭示被隐瞒后的克制反应',
    characterIntent: '压住怒意、确认对方知情',
    performance: {
      emotion: 'anger',
      intensity: 3,
      surfaceVsTrue: '表面平静 / 真实愤怒',
      face: '眉心轻收，嘴唇抿住',
      gaze: '目光短暂发紧看向对面',
      breath: '呼吸略重后稳住',
      posture: '肩膀保持克制紧绷',
      hands: '把手机平稳放在桌上',
      rhythm: '说完停半拍再放下手机',
    },
    camera: {
      shotSize: '中近景',
      primaryMove: '缓慢推进',
      moveDetail: '从中景缓慢推到胸上景，停在眼睛',
      focusTarget: '眼睛',
      depthHint: '背景柔和但仍可辨',
    },
    dialogue: {
      speaker: '她',
      line: '原来你早就知道。',
      lipsyncNote: '按自然中文节奏；句末停发音动作，嘴唇抿住',
      audioProvided: false,
    },
    fullPrompt:
      '中近景，人物坐在桌前看完手机，抬眼看向对面；眉心轻收，目光短暂发紧，嘴唇抿住后说：“原来你早就知道。”说完停顿半拍，再把手机平稳放在桌上。肩膀保持克制紧绷。机位轻微缓慢推进到胸上景，焦点落在眼睛。',
    continuityNotes: ['保持同一服装与光线'],
    ...overrides,
  } as QualityLeapDoc['shots'][number];
}

function golden(overrides: Partial<QualityLeapDoc> = {}): QualityLeapDoc {
  return {
    style: 'live_action',
    shots: [
      shot('S01', {
        performance: {
          emotion: 'doubt',
          intensity: 2,
          face: '一侧眉微抬',
          gaze: '视线在对方脸上停留',
          posture: '身体稍稍后靠',
        },
        camera: {
          shotSize: '中景',
          primaryMove: '固定',
          moveDetail: '机位固定',
        },
        dialogue: null,
        mouthResting: '嘴唇自然闭合，轻启一瞬后回到待机',
        fullPrompt:
          '中景固定机位，人物一侧眉微抬，视线在对方脸上停留，身体稍后靠；嘴部自然闭合。焦点在眼睛。',
      }),
      shot('S02'),
      shot('S03', {
        performance: {
          emotion: 'relief',
          intensity: 2,
          face: '眉间力道减轻',
          gaze: '目光重新落回对方',
          posture: '肩膀落下',
          breath: '吐出一小口气',
        },
        camera: {
          shotSize: '近景',
          primaryMove: '拉远',
          moveDetail: '缓慢拉远露出桌面',
        },
        dialogue: null,
        mouthResting: '嘴角淡淡暖意，自然闭合',
        fullPrompt:
          '近景，人物眉间放松、肩膀落下，吐出一小口气；摄影机缓慢拉远，焦点在眼睛。',
      }),
    ],
    ...overrides,
  };
}

describe('evaluateQualityLeap', () => {
  it('golden PASS with mixed intensity/moves; gates NOT_EVALUATED', () => {
    const r = evaluateQualityLeap(golden());
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.metrics.shotCount).toBe(3);
    expect(r.metrics.style).toBe('live_action');
  });

  it('SCHEMA: null / non-object / empty shots → FAIL', () => {
    expect(failCodes(evaluateQualityLeap(null))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityLeap(42))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityLeap({ shots: [] }))).toContain('SCHEMA');
    expect(evaluateQualityLeap(null).verdict).toBe('FAIL');
    expect(evaluateQualityLeap(null).gates).toEqual({
      Final: 'NOT_EVALUATED',
      V11_G3: 'NOT_EVALUATED',
    });
  });

  it('SHOT_ID: missing or duplicate id → FAIL', () => {
    const bad = {
      style: 'live_action' as const,
      shots: [
        { ...shot('S01'), id: '' },
        shot('S02'),
        shot('S03'),
      ],
    };
    expect(failCodes(evaluateQualityLeap(bad))).toContain('SHOT_ID');

    const dup = golden({
      shots: [shot('S01'), shot('S01'), shot('S03')],
    });
    expect(failCodes(evaluateQualityLeap(dup))).toContain('SHOT_ID');
  });

  it('DRAMA_PURPOSE / CHARACTER_INTENT empty → FAIL', () => {
    const r = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', { dramaPurpose: '  ', characterIntent: '' }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然闭合',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '眉眼放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定，眉眼放松看对方，肩落，嘴部自然。',
          }),
        ],
      }),
    );
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['DRAMA_PURPOSE', 'CHARACTER_INTENT']),
    );
  });

  it('EMOTION missing / unmapped → FAIL; synonym maps to six classes', () => {
    const bad = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            performance: {
              emotion: 'confused_xyz',
              intensity: 2,
              face: '眉微抬',
              gaze: '看对方',
              posture: '稍后靠',
            },
            dialogue: null,
            mouthResting: '自然闭合',
            fullPrompt: '中景，眉微抬看对方稍后靠，嘴自然闭合。',
            camera: { shotSize: '中景', primaryMove: '固定' },
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '拉远' },
            fullPrompt: '近景拉远，放松肩落看对方。',
          }),
        ],
      }),
    );
    expect(failCodes(bad)).toContain('EMOTION');

    const mapped = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            performance: {
              emotion: '恐惧',
              intensity: 2,
              face: '眉心收紧',
              gaze: '看向门口',
              posture: '肩部抬起少许',
            },
            dialogue: null,
            mouthResting: '嘴唇轻合',
            camera: { shotSize: '中景', primaryMove: '固定' },
            fullPrompt: '中景固定，眉心收紧看向门口，肩部抬起，嘴唇轻合。',
          }),
          shot('S02', {
            performance: {
              emotion: 'angry',
              intensity: 3,
              face: '眉心紧锁',
              gaze: '直视对方',
              posture: '肩颈绷起',
              hands: '手掌握紧',
            },
          }),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然闭合',
            performance: {
              emotion: 'joy',
              intensity: 2,
              face: '浅笑',
              gaze: '看对方',
              posture: '肩轻放',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定浅笑看对方肩轻放嘴自然。',
          }),
        ],
      }),
    );
    expect(failCodes(mapped)).not.toContain('EMOTION');
    expect(mapped.verdict).toBe('PASS');
  });

  it('INTENSITY non 1–5 integer → FAIL', () => {
    const r = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            performance: {
              emotion: 'doubt',
              intensity: 6,
              face: '眉微抬',
              gaze: '看对方',
              posture: '稍后靠',
            },
            dialogue: null,
            mouthResting: '自然闭合',
            camera: { shotSize: '中景', primaryMove: '固定' },
            fullPrompt: '中景眉微抬看对方稍后靠嘴自然。',
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2.5 as unknown as number,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景放松肩落看对方。',
          }),
        ],
      }),
    );
    expect(failCodes(r).filter((c) => c === 'INTENSITY').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(r.verdict).toBe('FAIL');
  });

  it('PERFORMANCE_VISIBLE: only emotion noun, no visible acting → FAIL', () => {
    const r = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            performance: {
              emotion: 'anger',
              intensity: 4,
              face: '',
              gaze: '',
              posture: '',
              breath: '',
              hands: '',
              rhythm: '',
            },
            dialogue: null,
            mouthResting: '嘴唇抿住',
            camera: { shotSize: '中近景', primaryMove: '固定' },
            fullPrompt: '中近景固定机位，人物愤怒。',
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '眉眼放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定眉眼放松看对方肩落。',
          }),
        ],
      }),
    );
    expect(failCodes(r)).toContain('PERFORMANCE_VISIBLE');
  });

  it('INFERRED_AS_FACT: inferred emotion appears in scriptBeat without marker → WARN', () => {
    const r = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            scriptBeat: '她感到失望并看向对方。',
            performance: {
              emotion: 'anger',
              intensity: 3,
              inferredEmotions: ['失望', 'disappointment'],
              face: '眉心轻收',
              gaze: '看向对面',
              posture: '肩绷',
            },
            dialogue: null,
            mouthResting: '嘴唇抿住',
            camera: { shotSize: '中近景', primaryMove: '固定' },
            fullPrompt: '中近景固定，眉心轻收看对面肩绷，嘴唇抿住。',
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定放松肩落看对方。',
          }),
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('INFERRED_AS_FACT');
  });

  it('CAMERA_SHOT_SIZE / PRIMARY_MOVE missing → FAIL', () => {
    const r = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            camera: { shotSize: '', primaryMove: '' },
            dialogue: null,
            mouthResting: '自然闭合',
            fullPrompt: '人物眉微抬看对方稍后靠嘴自然闭合。',
            performance: {
              emotion: 'doubt',
              intensity: 2,
              face: '眉微抬',
              gaze: '看对方',
              posture: '稍后靠',
            },
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定放松肩落看对方。',
          }),
        ],
      }),
    );
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['CAMERA_SHOT_SIZE', 'PRIMARY_MOVE']),
    );
  });

  it('MULTI_MOVE: conflicting extraMoves → FAIL', () => {
    const r = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            camera: {
              shotSize: '中景',
              primaryMove: '缓慢推进',
              extraMoves: ['快速拉远', '甩镜'],
            },
            dialogue: null,
            mouthResting: '自然闭合',
            performance: {
              emotion: 'doubt',
              intensity: 2,
              face: '眉微抬',
              gaze: '看对方',
              posture: '稍后靠',
            },
            fullPrompt: '中景缓慢推进，眉微抬看对方稍后靠嘴自然。',
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定放松肩落看对方。',
          }),
        ],
      }),
    );
    expect(failCodes(r)).toContain('MULTI_MOVE');
  });

  it('DIALOGUE_LIPSYNC: has line but missing lipsyncNote → FAIL', () => {
    const r = evaluateQualityLeap(
      golden({
        shots: [
          shot('S02', {
            dialogue: {
              speaker: '她',
              line: '原来你早就知道。',
              lipsyncNote: '',
            },
          }),
        ].length
          ? [
              shot('S01', {
                dialogue: null,
                mouthResting: '自然闭合',
                performance: {
                  emotion: 'doubt',
                  intensity: 2,
                  face: '眉微抬',
                  gaze: '看对方',
                  posture: '稍后靠',
                },
                camera: { shotSize: '中景', primaryMove: '固定' },
                fullPrompt: '中景固定眉微抬看对方稍后靠嘴自然。',
              }),
              shot('S02', {
                dialogue: {
                  speaker: '她',
                  line: '原来你早就知道。',
                  lipsyncNote: '   ',
                },
              }),
              shot('S03', {
                dialogue: null,
                mouthResting: '自然',
                performance: {
                  emotion: 'relief',
                  intensity: 2,
                  face: '放松',
                  gaze: '看对方',
                  posture: '肩落',
                },
                camera: { shotSize: '近景', primaryMove: '固定' },
                fullPrompt: '近景固定放松肩落看对方。',
              }),
            ]
          : [],
      }),
    );
    expect(failCodes(r)).toContain('DIALOGUE_LIPSYNC');
  });

  it('MOUTH_RESTING: no dialogue and missing mouthResting → FAIL', () => {
    const r = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            dialogue: null,
            mouthResting: undefined,
            performance: {
              emotion: 'doubt',
              intensity: 2,
              face: '眉微抬',
              gaze: '看对方',
              posture: '稍后靠',
            },
            camera: { shotSize: '中景', primaryMove: '固定' },
            fullPrompt: '中景固定眉微抬看对方稍后靠。',
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定放松肩落看对方。',
          }),
        ],
      }),
    );
    expect(failCodes(r)).toContain('MOUTH_RESTING');
  });

  it('PROMPT_EMPTY → FAIL; PROMPT_MISSING_PERFORMANCE short prompt → WARN', () => {
    const empty = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            fullPrompt: '  ',
            dialogue: null,
            mouthResting: '自然闭合',
            performance: {
              emotion: 'doubt',
              intensity: 2,
              face: '眉微抬',
              gaze: '看对方',
              posture: '稍后靠',
            },
            camera: { shotSize: '中景', primaryMove: '固定' },
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定放松肩落看对方。',
          }),
        ],
      }),
    );
    expect(failCodes(empty)).toContain('PROMPT_EMPTY');

    const short = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            fullPrompt: '人物在房间。',
            dialogue: null,
            mouthResting: '自然闭合',
            performance: {
              emotion: 'doubt',
              intensity: 2,
              face: '眉微抬',
              gaze: '看对方',
              posture: '稍后靠',
            },
            camera: { shotSize: '中景', primaryMove: '固定' },
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定放松肩落看对方，焦点在眼睛。',
          }),
        ],
      }),
    );
    expect(short.verdict).toBe('PASS');
    expect(warnCodes(short)).toContain('PROMPT_MISSING_PERFORMANCE');
  });

  it('CARTOON_FX in live_action → FAIL; anime style allows', () => {
    const live = evaluateQualityLeap(
      golden({
        style: 'live_action',
        shots: [
          shot('S01', {
            performance: {
              emotion: 'joy',
              intensity: 3,
              face: '浅笑，爱心冒泡',
              gaze: '看对方',
              posture: '肩轻弹',
            },
            dialogue: null,
            mouthResting: '浅笑自然',
            camera: { shotSize: '中景', primaryMove: '固定' },
            fullPrompt: '中景固定浅笑，爱心冒泡环绕，速度线掠过。',
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定放松肩落看对方。',
          }),
        ],
      }),
    );
    expect(failCodes(live)).toContain('CARTOON_FX');

    const anime = evaluateQualityLeap(
      golden({
        style: 'anime',
        shots: [
          shot('S01', {
            performance: {
              emotion: 'joy',
              intensity: 3,
              face: '浅笑，爱心冒泡',
              gaze: '看对方',
              posture: '肩轻弹',
            },
            dialogue: null,
            mouthResting: '浅笑自然',
            camera: { shotSize: '中景', primaryMove: '固定' },
            fullPrompt: '中景固定浅笑，爱心冒泡环绕，速度线掠过。',
          }),
          shot('S02'),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定放松肩落看对方。',
          }),
        ],
      }),
    );
    expect(failCodes(anime)).not.toContain('CARTOON_FX');
    expect(anime.verdict).toBe('PASS');
  });

  it('INTENSITY_FLAT: ≥3 shots all intensity 5 → WARN', () => {
    const r = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            performance: {
              emotion: 'fear',
              intensity: 5,
              face: '眼眶张开眉心紧锁',
              gaze: '在危险与退路间确认',
              posture: '膝部发软',
              breath: '呼吸断续',
            },
            dialogue: null,
            mouthResting: '只在吸气时打开',
            camera: { shotSize: '中景', primaryMove: '固定' },
            fullPrompt: '中景固定，眼眶张开眉心紧锁，膝部发软呼吸断续。',
          }),
          shot('S02', {
            performance: {
              emotion: 'anger',
              intensity: 5,
              face: '眉间深收下颌僵硬',
              gaze: '锁定对方',
              posture: '身体前冲又停住',
              breath: '呼吸急促',
              hands: '握拳',
            },
          }),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'sadness',
              intensity: 5,
              face: '泪水持续',
              gaze: '短暂低头',
              posture: '手扶桌沿',
              breath: '呼吸碎裂',
            },
            camera: { shotSize: '近景', primaryMove: '固定' },
            fullPrompt: '近景固定泪水持续手扶桌沿呼吸碎裂。',
          }),
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('INTENSITY_FLAT');
  });

  it('ALL_PUSH_IN: ≥3 shots all push-in → WARN', () => {
    const r = evaluateQualityLeap(
      golden({
        shots: [
          shot('S01', {
            camera: { shotSize: '中景', primaryMove: '缓慢推进' },
            dialogue: null,
            mouthResting: '自然闭合',
            performance: {
              emotion: 'doubt',
              intensity: 2,
              face: '眉微抬',
              gaze: '看对方',
              posture: '稍后靠',
            },
            fullPrompt: '中景缓慢推进眉微抬看对方稍后靠嘴自然。',
          }),
          shot('S02', {
            camera: {
              shotSize: '中近景',
              primaryMove: 'push-in',
              moveDetail: 'push in to eyes',
            },
          }),
          shot('S03', {
            dialogue: null,
            mouthResting: '自然',
            performance: {
              emotion: 'relief',
              intensity: 2,
              face: '放松',
              gaze: '看对方',
              posture: '肩落',
            },
            camera: { shotSize: '近景', primaryMove: '推进' },
            fullPrompt: '近景推进放松肩落看对方。',
          }),
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('ALL_PUSH_IN');
  });

  it('gates always NOT_EVALUATED even on FAIL', () => {
    const r = evaluateQualityLeap({ shots: [] });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.verdict).toBe('FAIL');
  });
});
