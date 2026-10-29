/**
 * V12 Handoff×Quality Link — 表演门 × 集间悬念承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffQualityLink } from '@/agents/assembly/handoff-quality-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '危机开场' },
  { durSec: 8, beatRole: 'increment', action: '对峙' },
  { durSec: 8, beatRole: 'reversal', action: '证据' },
  { durSec: 10, beatRole: 'cliffhanger', action: '门外有人未解' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '门外脚步未解' },
  { durSec: 2, beatRole: 'increment', action: '追问' },
  { durSec: 10, beatRole: 'reversal', action: '新证' },
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

const qlShot = (id: string, intensity: number) => ({
  id,
  scriptBeat: '承接开场对峙。',
  durationSec: 4,
  dramaPurpose: '承接可见表演',
  characterIntent: '咬住悬念',
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

const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '持械入宋',
  latestEp: 20,
  handoffs: [handoff],
  links: [{ id: 'L1', handoffId: 'H8-9', ep: 9, qualityLeap: ql(5) }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateHandoffQualityLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateHandoffQualityLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateHandoffQualityLink', () => {
  it('nextEp quality → PASS', () => {
    const r = evaluateHandoffQualityLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / EP mismatch / without quality', () => {
    expect(failCodes(evaluateHandoffQualityLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateHandoffQualityLink(
          pack({
            links: [
              { id: 'd', handoffId: 'H8-9', ep: 9, qualityLeap: ql() },
              { id: 'd', handoffId: 'H8-9', ep: 9, qualityLeap: ql() },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateHandoffQualityLink(
          pack({ links: [{ id: 'L1', handoffId: 'H8-9', ep: 8, qualityLeap: ql() }] }),
        ),
      ),
    ).toContain('EP_NOT_NEXT');
    expect(failCodes(evaluateHandoffQualityLink(pack({ links: [] })))).toContain(
      'HANDOFF_WITHOUT_QUALITY',
    );
  });

  it('low intensity → WARN still PASS', () => {
    const r = evaluateHandoffQualityLink(
      pack({
        minHandoffIntense: 4,
        links: [{ id: 'L1', handoffId: 'H8-9', ep: 9, qualityLeap: ql(2) }],
      }),
    );
    expect(warnCodes(r)).toContain('LOW_INTENSITY_AT_HANDOFF');
    expect(r.verdict).toBe('PASS');
  });
});
