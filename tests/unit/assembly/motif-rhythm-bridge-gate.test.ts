/**
 * V12 Motif×SeriesRhythm Bridge — 母题 × 系列节奏跨 suite, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifRhythmBridge } from '@/agents/assembly/motif-rhythm-bridge-gate';

const rose = { id: 'white-rose', label: '白玫瑰', kind: 'prop' as const };
const apps = [
  { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
  { motifId: 'white-rose', ep: 8, role: 'echo' as const, visualState: '半开' },
  { motifId: 'white-rose', ep: 20, role: 'payoff' as const, visualState: '盛放' },
];

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
  links: [
    {
      id: 'L-echo',
      motifId: 'white-rose',
      ep: 8,
      shotSpec: denseSpec('EP08'),
      profile: 'dense' as const,
    },
  ],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateMotifRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateMotifRhythmBridge', () => {
  it('motif appearance + dense rhythm → PASS', () => {
    const r = evaluateMotifRhythmBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / no appearance', () => {
    expect(failCodes(evaluateMotifRhythmBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifRhythmBridge(
          pack({
            links: [
              { id: 'd', motifId: 'white-rose', ep: 8, shotSpec: denseSpec('EP08') },
              { id: 'd', motifId: 'white-rose', ep: 8, shotSpec: denseSpec('EP08') },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateMotifRhythmBridge(
          pack({
            links: [{ id: 'L1', motifId: 'ghost', ep: 8, shotSpec: denseSpec('EP08') }],
          }),
        ),
      ),
    ).toContain('UNKNOWN_MOTIF');
    expect(
      failCodes(
        evaluateMotifRhythmBridge(
          pack({
            links: [{ id: 'L1', motifId: 'white-rose', ep: 5, shotSpec: denseSpec('EP05') }],
          }),
        ),
      ),
    ).toContain('NO_APPEARANCE_AT_EP');
  });

  it('profile mismatch → WARN still PASS', () => {
    const r = evaluateMotifRhythmBridge(
      pack({
        profile: 'dense',
        links: [
          {
            id: 'L1',
            motifId: 'white-rose',
            ep: 8,
            shotSpec: denseSpec('EP08'),
            profile: 'intrigue',
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PROFILE_MISMATCH');
    expect(r.verdict).toBe('PASS');
  });

  it('sparse shots under dense → CHILD_RHYTHM_FAIL', () => {
    expect(
      failCodes(
        evaluateMotifRhythmBridge(
          pack({
            links: [
              {
                id: 'L1',
                motifId: 'white-rose',
                ep: 8,
                shotSpec: {
                  episode: 'EP08',
                  shots: [{ shotId: 'S0', cast: [], durSec: 40, action: '长镜头发呆' }],
                },
                profile: 'dense',
              },
            ],
          }),
        ),
      ),
    ).toContain('CHILD_RHYTHM_FAIL');
  });
});
