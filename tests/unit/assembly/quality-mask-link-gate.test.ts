/**
 * V12 QualityLeap×PersonaMask Link — 表演门 × 伪装揭穿, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateQualityMaskLink } from '@/agents/assembly/quality-mask-link-gate';

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

const ql = (intensity = 4) => ({
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

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  masks: [mask],
  links: [{ id: 'L1', maskId: '花心纨绔', ep: 8, qualityLeap: ql(5) }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateQualityMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateQualityMaskLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateQualityMaskLink', () => {
  it('reveal with quality → PASS', () => {
    const r = evaluateQualityMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / EP mismatch', () => {
    expect(failCodes(evaluateQualityMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateQualityMaskLink(
          pack({
            links: [
              { id: 'd', maskId: '花心纨绔', ep: 8, qualityLeap: ql() },
              { id: 'd', maskId: '花心纨绔', ep: 8, qualityLeap: ql() },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateQualityMaskLink(
          pack({ links: [{ id: 'L1', maskId: 'ghost', ep: 8, qualityLeap: ql() }] }),
        ),
      ),
    ).toContain('UNKNOWN_MASK');
    expect(
      failCodes(
        evaluateQualityMaskLink(
          pack({ links: [{ id: 'L1', maskId: '花心纨绔', ep: 3, qualityLeap: ql() }] }),
        ),
      ),
    ).toContain('EP_NOT_REVEAL');
  });

  it('missing quality at reveal → REVEAL_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateQualityMaskLink(pack({ links: [] })))).toContain(
      'REVEAL_WITHOUT_QUALITY',
    );
  });

  it('soft intensity → LOW_INTENSITY_AT_REVEAL WARN', () => {
    const r = evaluateQualityMaskLink(
      pack({ links: [{ id: 'L1', maskId: '花心纨绔', ep: 8, qualityLeap: ql(2) }] }),
    );
    expect(warnCodes(r)).toContain('LOW_INTENSITY_AT_REVEAL');
    expect(r.verdict).toBe('PASS');
  });

  it('bad qualityLeap → CHILD_QUALITY_FAIL', () => {
    expect(
      failCodes(
        evaluateQualityMaskLink(
          pack({
            links: [
              {
                id: 'L1',
                maskId: '花心纨绔',
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
