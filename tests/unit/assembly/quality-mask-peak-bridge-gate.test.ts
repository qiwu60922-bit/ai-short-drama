/**
 * V12 Quality×Mask×Peak Ternary — 表演门×伪装×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityMaskPeakBridge } from '@/agents/assembly/quality-mask-peak-bridge-gate';

const qlShot = (id: string, intensity: number) => ({
  id,
  scriptBeat: '面具崩塌对峙。',
  durationSec: 4,
  dramaPurpose: '揭穿可见表演',
  characterIntent: '撕开伪装',
  performance: {
    emotion: intensity >= 4 ? 'anger' : 'doubt',
    intensity,
    face: '眉峰拧紧',
    gaze: '钉住对方',
    posture: '前倾',
  },
  camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
  dialogue: null,
  mouthResting: '嘴唇自然闭合',
  fullPrompt: '中近景固定，眉峰拧紧，嘴部闭合。',
});

const ql = (intensity = 5) => ({
  style: 'live_action' as const,
  shots: [qlShot('S01', intensity), qlShot('S02', intensity), qlShot('S03', 2)],
});

const mask = {
  id: '花心纨绔',
  wearer: '江少',
  plantEp: 1,
  maintainEps: [2, 3],
  revealEp: 8,
  revealLabel: '真心崩塌',
};

const peak = {
  id: '订婚宴嫌弃',
  openEp: 1,
  peakEp: 8,
  peakLabel: '订婚宴嫌弃峰值',
  payoffEp: 8,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  masks: [mask],
  peaks: [peak],
  links: [{ id: 'L1', maskId: '花心纨绔', peakId: '订婚宴嫌弃', ep: 8, qualityLeap: ql() }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateQualityMaskPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateQualityMaskPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateQualityMaskPeakBridge', () => {
  it('reveal=peak=ep + quality → PASS', () => {
    const r = evaluateQualityMaskPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / EP_NOT_TERNARY', () => {
    expect(failCodes(evaluateQualityMaskPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateQualityMaskPeakBridge(
          pack({
            links: [
              { id: 'd', maskId: '花心纨绔', peakId: '订婚宴嫌弃', ep: 8, qualityLeap: ql() },
              { id: 'd', maskId: '花心纨绔', peakId: '订婚宴嫌弃', ep: 8, qualityLeap: ql() },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateQualityMaskPeakBridge(
          pack({
            links: [{ id: 'L1', maskId: 'ghost', peakId: '订婚宴嫌弃', ep: 8, qualityLeap: ql() }],
          }),
        ),
      ),
    ).toContain('UNKNOWN_MASK');
    expect(
      failCodes(
        evaluateQualityMaskPeakBridge(
          pack({
            links: [{ id: 'L1', maskId: '花心纨绔', peakId: 'ghost', ep: 8, qualityLeap: ql() }],
          }),
        ),
      ),
    ).toContain('UNKNOWN_PEAK');
    expect(
      failCodes(
        evaluateQualityMaskPeakBridge(
          pack({
            links: [
              { id: 'L1', maskId: '花心纨绔', peakId: '订婚宴嫌弃', ep: 3, qualityLeap: ql() },
            ],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
  });

  it('missing bridge → REVEAL_WITHOUT_BRIDGE / PEAK_WITHOUT_BRIDGE', () => {
    const codes = failCodes(evaluateQualityMaskPeakBridge(pack({ links: [] })));
    expect(codes).toContain('REVEAL_WITHOUT_BRIDGE');
    expect(codes).toContain('PEAK_WITHOUT_BRIDGE');
  });

  it('soft intensity → LOW_INTENSITY_AT_TERNARY WARN', () => {
    const r = evaluateQualityMaskPeakBridge(
      pack({
        links: [
          { id: 'L1', maskId: '花心纨绔', peakId: '订婚宴嫌弃', ep: 8, qualityLeap: ql(2) },
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('LOW_INTENSITY_AT_TERNARY');
  });
});
