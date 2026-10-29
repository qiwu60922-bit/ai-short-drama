/**
 * V12 Quality×Dialogue Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityDialogueLink } from '@/agents/assembly/quality-dialogue-link-gate';

const qualityLeap = {
  style: 'live_action' as const,
  shots: [{
    id: 'S01', scriptBeat: '表演兑现。', durationSec: 4, dramaPurpose: '可见表演',
    characterIntent: '撕开伪装',
    performance: { emotion: 'anger', intensity: 5, face: '眉峰拧紧', gaze: '钉住对方', posture: '前倾' },
    camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
    dialogue: null, mouthResting: '嘴唇自然闭合',
    fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
  }],
};
const shotSpec = {
  episode: 'EP01',
  shots: [
    { shotId: 'EP01-S0', cast: [], durSec: 4, beatRole: 'hook', action: '黑衣人破窗闯入举枪' },
    { shotId: 'EP01-S1', cast: [], durSec: 4, beatRole: 'setup', action: '走廊空镜缓慢推进' },
    { shotId: 'EP01-S2', cast: [], durSec: 6, beatRole: 'reversal', action: '齐耶抬腕刻印亮起格开一剑' },
    { shotId: 'EP01-S3', cast: [], durSec: 3, beatRole: 'reaction', action: '齐耶瞳孔收缩后退' },
    { shotId: 'EP01-S4', cast: [], durSec: 5, beatRole: 'cliffhanger', action: '门外更多脚步逼近' },
  ],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '台词禁令',
  latestEp: 20,
  dialogues: [{ id: 'EP01-dlg', ep: 10, shotSpec }],
  links: [{ id: 'L1', dialogueId: 'EP01-dlg', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityDialogueLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityDialogueLink', () => {
  it('quality + dialogue → PASS', () => {
    const r = evaluateQualityDialogueLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / DIALOGUE_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityDialogueLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityDialogueLink(pack({ links: [] })))).toContain('DIALOGUE_WITHOUT_QUALITY');
  });
});
