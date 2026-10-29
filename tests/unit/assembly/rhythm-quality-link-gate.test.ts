/**
 * V12 Rhythm×Quality Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateRhythmQualityLink } from '@/agents/assembly/rhythm-quality-link-gate';

const rhythmSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-b142r-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机·抛钩", "hookKind": "situation"}, {"shotId": "EP10-b142r-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转·加压"}, {"shotId": "EP10-b142r-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压·推进"}, {"shotId": "EP10-b142r-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念·收束"}]};
const ql = {"style": "live_action", "shots": [{"id": "S01", "scriptBeat": "表演兑现。", "durationSec": 4, "dramaPurpose": "可见表演", "characterIntent": "撕开伪装", "performance": {"emotion": "anger", "intensity": 5, "face": "眉峰拧紧", "gaze": "钉住对方", "posture": "前倾"}, "camera": {"shotSize": "中近景", "primaryMove": "固定", "moveDetail": "机位固定"}, "dialogue": null, "mouthResting": "嘴唇自然闭合", "fullPrompt": "中近景固定，眉峰拧紧，嘴部闭合。"}, {"id": "S02", "scriptBeat": "表演兑现。", "durationSec": 4, "dramaPurpose": "可见表演", "characterIntent": "撕开伪装", "performance": {"emotion": "anger", "intensity": 5, "face": "眉峰拧紧", "gaze": "钉住对方", "posture": "前倾"}, "camera": {"shotSize": "中近景", "primaryMove": "固定", "moveDetail": "机位固定"}, "dialogue": null, "mouthResting": "嘴唇自然闭合", "fullPrompt": "中近景固定，眉峰拧紧，嘴部闭合。"}, {"id": "S03", "scriptBeat": "表演兑现。", "durationSec": 4, "dramaPurpose": "可见表演", "characterIntent": "撕开伪装", "performance": {"emotion": "doubt", "intensity": 2, "face": "眉峰拧紧", "gaze": "钉住对方", "posture": "前倾"}, "camera": {"shotSize": "中近景", "primaryMove": "固定", "moveDetail": "机位固定"}, "dialogue": null, "mouthResting": "嘴唇自然闭合", "fullPrompt": "中近景固定，眉峰拧紧，嘴部闭合。"}]};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉', latestEp: 20,
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec: rhythmSpec }],
  links: [{ id: 'L1', rhythmId: 'EP10-rhythm', ep: 10, qualityLeap: ql }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateRhythmQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateRhythmQualityLink', () => {
  it('rhythm + quality → PASS', () => {
    const r = evaluateRhythmQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / RHYTHM_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateRhythmQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateRhythmQualityLink(pack({ links: [] })))).toContain('RHYTHM_WITHOUT_QUALITY');
  });
});
