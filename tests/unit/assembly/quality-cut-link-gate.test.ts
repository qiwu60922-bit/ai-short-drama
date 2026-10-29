/**
 * V12 Quality×Cut Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityCutLink } from '@/agents/assembly/quality-cut-link-gate';

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
const cutTimeline = {"version": 1, "meta": {"title": "样本", "style": "线稿分镜", "fps": 24, "width": 1280, "height": 720, "target_frames": 120, "characters": {"hero": "短发夹克旅人"}}, "cuts": [{"id": "C001", "duration_frames": 72, "scene": "广场", "action": "主角停步抬头", "camera": {"framing": "WS", "angle": "eye", "movement": "FIX"}, "characters": ["hero"], "dialogue": "", "sound": "", "on_screen_text": "", "notes": "", "cues": []}, {"id": "C002", "duration_frames": 48, "scene": "广场", "action": "对峙前压", "camera": {"framing": "MS", "angle": "eye", "movement": "FIX"}, "characters": ["hero"], "dialogue": "", "sound": "", "on_screen_text": "", "notes": "", "cues": []}]};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '分镜时间轴',
  latestEp: 20,
  cuts: [{ id: 'cut-b150', ep: 10, cutTimeline }],
  links: [{ id: 'L1', cutId: 'cut-b150', ep: 10, qualityLeap }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateQualityCutLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateQualityCutLink', () => {
  it('quality + cut → PASS', () => {
    const r = evaluateQualityCutLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / CUT_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityCutLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateQualityCutLink(pack({ links: [] })))).toContain('CUT_WITHOUT_QUALITY');
  });
});
