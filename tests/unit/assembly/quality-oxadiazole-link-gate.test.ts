/**
 * V12 Quality×OxadiazoleLink — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityOxadiazoleLink } from '@/agents/assembly/quality-oxadiazole-link-gate';

const qualityLeap = {"style": "live_action", "shots": [{"id": "S01", "scriptBeat": "表演兑现。", "durationSec": 4, "dramaPurpose": "可见表演", "characterIntent": "撕开伪装", "performance": {"emotion": "anger", "intensity": 5, "face": "眉峰拧紧", "gaze": "钉住对方", "posture": "前倾"}, "camera": {"shotSize": "中近景", "primaryMove": "固定", "moveDetail": "机位固定"}, "dialogue": null, "mouthResting": "嘴唇自然闭合", "fullPrompt": "中近景固定，眉峰拧紧，嘴部闭合。"}]};
const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-B187-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-B187-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-B187-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-B187-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '噁二唑',
  latestEp: 20,
  oxadiazoles: [{ id: 'EP10-oxadiazole-b187-oxadiazole', ep: 10, shotSpec }],
  links: [{ id: 'L1', oxadiazoleId: 'EP10-oxadiazole-b187-oxadiazole', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityOxadiazoleLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityOxadiazoleLink', () => {
  it('quality + oxadiazole → PASS', () => {
    const r = evaluateQualityOxadiazoleLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / OXADIAZOLE_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityOxadiazoleLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityOxadiazoleLink(pack({ links: [] })))).toContain('OXADIAZOLE_WITHOUT_QUALITY');
  });
});
