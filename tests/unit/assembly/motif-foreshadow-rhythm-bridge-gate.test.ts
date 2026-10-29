/**
 * V12 Motif×Foreshadow×Rhythm Ternary — 母题×伏笔×节奏, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifForeshadowRhythmBridge } from '@/agents/assembly/motif-foreshadow-rhythm-bridge-gate';

const rose = { id: 'white-rose', label: '白玫瑰', kind: 'prop' as const };
const apps = [
  { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
  { motifId: 'white-rose', ep: 8, role: 'echo' as const, visualState: '半开' },
  { motifId: 'white-rose', ep: 20, role: 'payoff' as const, visualState: '盛放' },
];
const item = {
  id: '伪人身份',
  name: '预言家真伪',
  priority: 'S' as const,
  plantEp: 1,
  status: 'closed' as const,
  payoffEp: 8,
  lastAdvancedEp: 4,
};

const denseSpec = (episode: string) => ({
  episode,
  shots: Array.from({ length: 18 }, (_, i) => ({
    shotId: `${episode}-S${i}`,
    cast: [],
    durSec: 2,
    action: 'x·y',
  })),
});

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  profile: 'dense' as const,
  motifs: [rose],
  appearances: apps,
  items: [item],
  links: [
    {
      id: 'L1',
      motifId: 'white-rose',
      foreshadowId: '伪人身份',
      ep: 8,
      shotSpec: denseSpec('EP08'),
      profile: 'dense' as const,
    },
  ],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifForeshadowRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifForeshadowRhythmBridge', () => {
  it('motif + foreshadow @ep + dense rhythm → PASS', () => {
    const r = evaluateMotifForeshadowRhythmBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / NO_MOTIF / NO_FORESHADOW', () => {
    expect(failCodes(evaluateMotifForeshadowRhythmBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifForeshadowRhythmBridge(
          pack({
            links: [
              {
                id: 'd',
                motifId: 'white-rose',
                foreshadowId: '伪人身份',
                ep: 8,
                shotSpec: denseSpec('EP08'),
              },
              {
                id: 'd',
                motifId: 'white-rose',
                foreshadowId: '伪人身份',
                ep: 8,
                shotSpec: denseSpec('EP08'),
              },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateMotifForeshadowRhythmBridge(
          pack({
            links: [
              {
                id: 'L1',
                motifId: 'white-rose',
                foreshadowId: '伪人身份',
                ep: 5,
                shotSpec: denseSpec('EP05'),
              },
            ],
          }),
        ),
      ),
    ).toContain('NO_MOTIF_AT_EP');
    expect(
      failCodes(
        evaluateMotifForeshadowRhythmBridge(
          pack({
            appearances: [
              ...apps,
              { motifId: 'white-rose', ep: 5, role: 'echo' as const, visualState: '旁路' },
            ],
            links: [
              {
                id: 'L1',
                motifId: 'white-rose',
                foreshadowId: '伪人身份',
                ep: 5,
                shotSpec: denseSpec('EP05'),
              },
            ],
          }),
        ),
      ),
    ).toContain('NO_FORESHADOW_AT_EP');
  });
});
