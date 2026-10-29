/**
 * V12 Peak×QualityLeap Link — 巅峰后再兑现 × 表演门, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePeakQualityLink } from '@/agents/assembly/peak-quality-link-gate';

const qlShot = (id: string, intensity: number) => ({
  id,
  scriptBeat: '她抬眼对峙。',
  durationSec: 4,
  dramaPurpose: '巅峰对峙可见表演',
  characterIntent: '压住怒意确认对方知情',
  performance: {
    emotion: intensity >= 4 ? 'anger' : 'doubt',
    intensity,
    face: '一侧眉微抬',
    gaze: '视线钉在对方脸上',
    posture: '肩膀紧绷',
  },
  camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
  dialogue: null,
  mouthResting: '嘴唇自然闭合',
  fullPrompt: '中近景固定机位，一侧眉微抬，视线钉住；嘴部自然闭合。焦点在眼睛。',
});

const ql = (intensity = 4) => ({
  style: 'live_action' as const,
  shots: [qlShot('S01', intensity), qlShot('S02', intensity), qlShot('S03', 2)],
});

const peak = {
  id: '养老房清算',
  openEp: 1,
  peakEp: 8,
  peakLabel: '订婚宴嫌弃',
  payoffEp: 8,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '卖掉养老房',
  latestEp: 20,
  peaks: [peak],
  links: [
    { id: 'L-peak', peakId: '养老房清算', ep: 8, qualityLeap: ql(5) },
  ],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluatePeakQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluatePeakQualityLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluatePeakQualityLink', () => {
  it('peak+payoff same ep with quality → PASS', () => {
    const r = evaluatePeakQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / EP mismatch', () => {
    expect(failCodes(evaluatePeakQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluatePeakQualityLink(
          pack({
            links: [
              { id: 'd', peakId: '养老房清算', ep: 8, qualityLeap: ql() },
              { id: 'd', peakId: '养老房清算', ep: 8, qualityLeap: ql() },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluatePeakQualityLink(
          pack({ links: [{ id: 'L1', peakId: 'ghost', ep: 8, qualityLeap: ql() }] }),
        ),
      ),
    ).toContain('UNKNOWN_PEAK');
    expect(
      failCodes(
        evaluatePeakQualityLink(
          pack({ links: [{ id: 'L1', peakId: '养老房清算', ep: 3, qualityLeap: ql() }] }),
        ),
      ),
    ).toContain('EP_NOT_PEAK_OR_PAYOFF');
  });

  it('missing quality at peak → PEAK_WITHOUT_QUALITY', () => {
    const r = evaluatePeakQualityLink(pack({ links: [] }));
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['PEAK_WITHOUT_QUALITY', 'PAYOFF_WITHOUT_QUALITY']),
    );
  });

  it('split peak/payoff needs two quality links', () => {
    const r = evaluatePeakQualityLink(
      pack({
        peaks: [
          {
            id: '装瘫清算',
            openEp: 2,
            peakEp: 12,
            peakLabel: '丈夫升副院长',
            payoffEp: 13,
          },
        ],
        links: [
          { id: 'Lp', peakId: '装瘫清算', ep: 12, qualityLeap: ql(5) },
          { id: 'Lo', peakId: '装瘫清算', ep: 13, qualityLeap: ql(4) },
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(2);
  });

  it('soft intensity at peak → LOW_INTENSITY_AT_PEAK WARN', () => {
    const r = evaluatePeakQualityLink(
      pack({ links: [{ id: 'L-peak', peakId: '养老房清算', ep: 8, qualityLeap: ql(2) }] }),
    );
    expect(warnCodes(r)).toContain('LOW_INTENSITY_AT_PEAK');
    expect(r.verdict).toBe('PASS');
  });

  it('bad qualityLeap → CHILD_QUALITY_FAIL', () => {
    expect(
      failCodes(
        evaluatePeakQualityLink(
          pack({
            links: [
              {
                id: 'L1',
                peakId: '养老房清算',
                ep: 8,
                qualityLeap: { style: 'live_action', shots: [] },
              },
            ],
          }),
        ),
      ),
    ).toContain('CHILD_QUALITY_FAIL');
  });
});
