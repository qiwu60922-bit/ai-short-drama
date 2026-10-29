/**
 * V12 Quality×EclogiteLink — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityEclogiteLink } from '@/agents/assembly/quality-eclogite-link-gate';

const qualityLeap = {"style": "live_action", "shots": [{"id": "S01", "scriptBeat": "表演兑现。", "durationSec": 4, "dramaPurpose": "可见表演", "characterIntent": "撕开伪装", "performance": {"emotion": "anger", "intensity": 5, "face": "眉峰拧紧", "gaze": "钉住对方", "posture": "前倾"}, "camera": {"shotSize": "中近景", "primaryMove": "固定", "moveDetail": "机位固定"}, "dialogue": null, "mouthResting": "嘴唇自然闭合", "fullPrompt": "中近景固定，眉峰拧紧，嘴部闭合。"}]};
const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-B176-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-B176-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-B176-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-B176-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '榴辉岩节奏',
  latestEp: 20,
  eclogites: [{ id: 'EP10-eclogite-b176', ep: 10, shotSpec }],
  links: [{ id: 'L1', eclogiteId: 'EP10-eclogite-b176', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityEclogiteLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityEclogiteLink', () => {
  it('quality + eclogite → PASS', () => {
    const r = evaluateQualityEclogiteLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / ECLOGITE_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityEclogiteLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityEclogiteLink(pack({ links: [] })))).toContain('ECLOGITE_WITHOUT_QUALITY');
  });
});
