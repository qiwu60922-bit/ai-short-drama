/**
 * V12 Quality×Bond Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityBondLink } from '@/agents/assembly/quality-bond-link-gate';

const ql = {
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
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉', latestEp: 20,
  bonds: [{
    id: 'B1', partyA: '苏见晴', partyB: '傅司宴', contractEp: 1, contractLabel: '契约联姻',
    companionEps: [2, 3, 5], upgradeEp: 10, upgradeLabel: '真心升级',
  }],
  links: [{ id: 'L1', bondId: 'B1', ep: 10, qualityLeap: ql }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityBondLink', () => {
  it('quality + bond → PASS', () => {
    const r = evaluateQualityBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / TERMINAL_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityBondLink(pack({ links: [] })))).toContain('TERMINAL_WITHOUT_QUALITY');
  });
});
