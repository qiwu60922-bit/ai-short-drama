/**
 * V12 QualityLeap×CliffCascade Link — 表演门 × 跨集叠钩, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffQualityLink } from '@/agents/assembly/cliff-quality-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '危机开场' },
  { durSec: 8, beatRole: 'increment', action: '追查线索' },
  { durSec: 8, beatRole: 'reversal', action: '身份暴露' },
  { durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
  { durSec: 2, beatRole: 'increment', action: '追兵逼近' },
  { durSec: 10, beatRole: 'reversal', action: '旧友现身' },
  { durSec: 8, beatRole: 'cliffhanger', action: '下一场更大危机' },
];

const cliff = {
  id: 'C9-10',
  prevEp: 9,
  nextEp: 10,
  prev: spec('EP09', prevGood()),
  next: spec('EP10', nextGood()),
};

const qlShot = (id: string, intensity: number) => ({
  id,
  scriptBeat: '承接对峙。',
  durationSec: 4,
  dramaPurpose: '下集开场可见表演',
  characterIntent: '压住危机',
  performance: {
    emotion: intensity >= 4 ? 'anger' : 'doubt',
    intensity,
    face: '眉峰拧紧',
    gaze: '钉住门口',
    posture: '前倾',
  },
  camera: { shotSize: '中近景', primaryMove: '固定', moveDetail: '机位固定' },
  dialogue: null,
  mouthResting: '嘴唇自然闭合',
  fullPrompt: '中近景固定，眉峰拧紧。',
});
const ql = (intensity = 5) => ({
  style: 'live_action' as const,
  shots: [qlShot('S01', intensity), qlShot('S02', intensity), qlShot('S03', 2)],
});

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '持械入宋',
  latestEp: 10,
  cliffLinks: [cliff],
  links: [{ id: 'L1', cliffLinkId: 'C9-10', ep: 10, qualityLeap: ql(5) }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCliffQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateCliffQualityLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateCliffQualityLink', () => {
  it('quality at nextEp → PASS', () => {
    const r = evaluateCliffQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / EP_NOT_NEXT', () => {
    expect(failCodes(evaluateCliffQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCliffQualityLink(
          pack({
            links: [
              { id: 'd', cliffLinkId: 'C9-10', ep: 10, qualityLeap: ql() },
              { id: 'd', cliffLinkId: 'C9-10', ep: 10, qualityLeap: ql() },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateCliffQualityLink(
          pack({ links: [{ id: 'L1', cliffLinkId: 'ghost', ep: 10, qualityLeap: ql() }] }),
        ),
      ),
    ).toContain('UNKNOWN_CLIFF');
    expect(
      failCodes(
        evaluateCliffQualityLink(
          pack({ links: [{ id: 'L1', cliffLinkId: 'C9-10', ep: 9, qualityLeap: ql() }] }),
        ),
      ),
    ).toContain('EP_NOT_NEXT');
  });

  it('missing quality → CLIFF_WITHOUT_QUALITY', () => {
    expect(failCodes(evaluateCliffQualityLink(pack({ links: [] })))).toContain(
      'CLIFF_WITHOUT_QUALITY',
    );
  });

  it('soft intensity → LOW_INTENSITY_AT_HANDOFF WARN', () => {
    const r = evaluateCliffQualityLink(
      pack({ links: [{ id: 'L1', cliffLinkId: 'C9-10', ep: 10, qualityLeap: ql(2) }] }),
    );
    expect(warnCodes(r)).toContain('LOW_INTENSITY_AT_HANDOFF');
    expect(r.verdict).toBe('PASS');
  });
});
