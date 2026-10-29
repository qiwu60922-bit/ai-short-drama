/**
 * V12 Frequency×Quality Link — 表演门×第N次 tipping, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyQualityLink } from '@/agents/assembly/frequency-quality-link-gate';

const qlShot = (id: string, intensity: number) => ({
  id,
  scriptBeat: '承接对峙。',
  durationSec: 4,
  dramaPurpose: '可见表演',
  characterIntent: '压住危机',
  performance: {
    emotion: intensity >= 4 ? 'anger' : 'doubt',
    intensity,
    face: '眉峰拧紧',
    gaze: '钉住门口',
    posture: '前倾',
  },
  camera: { shotSize: '中近景', primaryMove: '固定' as const, moveDetail: '机位固定' },
  dialogue: null,
  mouthResting: '嘴唇自然闭合',
  fullPrompt: '中近景固定，眉峰拧紧。',
});
const ql = (intensity = 5) => ({
  style: 'live_action' as const,
  shots: [qlShot('S01', intensity), qlShot('S02', intensity), qlShot('S03', 2)],
});

const freq = {
  id: '离婚要挟',
  actor: '丈夫',
  motif: '离婚要挟',
  unit: 'count' as const,
  threshold: 99,
  plantEp: 1,
  ticks: [
    { ep: 3, n: 10 },
    { ep: 10, n: 50 },
    { ep: 20, n: 99, label: '第99次' },
  ],
  tipEp: 20,
  tipLabel: '接受第99次离婚彻底离开',
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '轻烟染日暮',
  latestEp: 51,
  frequencies: [freq],
  links: [{ id: 'L1', frequencyId: '离婚要挟', ep: 20, qualityLeap: ql(5) }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateFrequencyQualityLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateFrequencyQualityLink', () => {
  it('quality at tipEp → PASS', () => {
    const r = evaluateFrequencyQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TIP / TIP_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateFrequencyQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateFrequencyQualityLink(
          pack({ links: [{ id: 'L1', frequencyId: '离婚要挟', ep: 10, qualityLeap: ql() }] }),
        ),
      ),
    ).toContain('EP_NOT_TIP');
    expect(failCodes(evaluateFrequencyQualityLink(pack({ links: [] })))).toContain(
      'TIP_WITHOUT_QUALITY',
    );
  });

  it('soft intensity → LOW_INTENSITY_AT_TIP WARN', () => {
    const r = evaluateFrequencyQualityLink(
      pack({ links: [{ id: 'L1', frequencyId: '离婚要挟', ep: 20, qualityLeap: ql(2) }] }),
    );
    expect(warnCodes(r)).toContain('LOW_INTENSITY_AT_TIP');
    expect(r.verdict).toBe('PASS');
  });
});
