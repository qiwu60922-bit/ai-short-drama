/**
 * V12 Foreshadow×Quality×Rhythm Ternary — 伏笔×表演×节奏, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowQualityRhythmBridge } from '@/agents/assembly/foreshadow-quality-rhythm-bridge-gate';

const qualityLeap = {
  "style": "live_action",
  "shots": [
    {
      "id": "S01",
      "scriptBeat": "表演兑现。",
      "durationSec": 4,
      "dramaPurpose": "可见表演",
      "characterIntent": "撕开伪装",
      "performance": {
        "emotion": "anger",
        "intensity": 5,
        "face": "眉峰拧紧",
        "gaze": "钉住对方",
        "posture": "前倾"
      },
      "camera": {
        "shotSize": "中近景",
        "primaryMove": "固定",
        "moveDetail": "机位固定"
      },
      "dialogue": null,
      "mouthResting": "嘴唇自然闭合",
      "fullPrompt": "中近景固定，眉峰拧紧，嘴部闭合。"
    },
    {
      "id": "S02",
      "scriptBeat": "表演兑现。",
      "durationSec": 4,
      "dramaPurpose": "可见表演",
      "characterIntent": "撕开伪装",
      "performance": {
        "emotion": "anger",
        "intensity": 5,
        "face": "眉峰拧紧",
        "gaze": "钉住对方",
        "posture": "前倾"
      },
      "camera": {
        "shotSize": "中近景",
        "primaryMove": "固定",
        "moveDetail": "机位固定"
      },
      "dialogue": null,
      "mouthResting": "嘴唇自然闭合",
      "fullPrompt": "中近景固定，眉峰拧紧，嘴部闭合。"
    },
    {
      "id": "S03",
      "scriptBeat": "表演兑现。",
      "durationSec": 4,
      "dramaPurpose": "可见表演",
      "characterIntent": "撕开伪装",
      "performance": {
        "emotion": "doubt",
        "intensity": 2,
        "face": "眉峰拧紧",
        "gaze": "钉住对方",
        "posture": "前倾"
      },
      "camera": {
        "shotSize": "中近景",
        "primaryMove": "固定",
        "moveDetail": "机位固定"
      },
      "dialogue": null,
      "mouthResting": "嘴唇自然闭合",
      "fullPrompt": "中近景固定，眉峰拧紧，嘴部闭合。"
    }
  ]
} as const;
const shotSpec = {
  "episode": "EP08",
  "shots": [
    {
      "shotId": "EP08-BQR0",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR1",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR2",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR3",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR4",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR5",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR6",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR7",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR8",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR9",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR10",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR11",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR12",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR13",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR14",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR15",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR16",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    },
    {
      "shotId": "EP08-BQR17",
      "cast": [],
      "durSec": 2,
      "action": "对峙·兑现"
    }
  ]
} as const;

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  profile: 'dense' as const,
  items: [{
    id: '伪人身份',
    name: '预言家真伪',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 8,
    lastAdvancedEp: 4,
  }],
  links: [{
    id: 'L1',
    foreshadowId: '伪人身份',
    ep: 8,
    qualityLeap,
    shotSpec,
    profile: 'dense' as const,
  }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowQualityRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowQualityRhythmBridge', () => {
  it('payoff + quality + rhythm @ep → PASS', () => {
    const r = evaluateForeshadowQualityRhythmBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF / PAYOFF_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateForeshadowQualityRhythmBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowQualityRhythmBridge(
          pack({
            links: [{
              id: 'L1',
              foreshadowId: '伪人身份',
              ep: 7,
              qualityLeap,
              shotSpec,
            }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF');
    expect(failCodes(evaluateForeshadowQualityRhythmBridge(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_BRIDGE',
    );
  });
});
