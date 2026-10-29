/**
 * V12 Foreshadow×SeriesRhythm Bridge — 伏笔 × 系列节奏跨 suite, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowRhythmBridge } from '@/agents/assembly/foreshadow-rhythm-bridge-gate';

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
  series: '伪人降临',
  latestEp: 20,
  profile: 'dense' as const,
  items: [item],
  links: [
    {
      id: 'L-payoff',
      foreshadowId: '伪人身份',
      ep: 8,
      shotSpec: denseSpec('EP08'),
      profile: 'dense' as const,
    },
  ],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateForeshadowRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateForeshadowRhythmBridge', () => {
  it('payoff ep + dense rhythm → PASS', () => {
    const r = evaluateForeshadowRhythmBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / no event', () => {
    expect(failCodes(evaluateForeshadowRhythmBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowRhythmBridge(
          pack({
            links: [
              { id: 'd', foreshadowId: '伪人身份', ep: 8, shotSpec: denseSpec('EP08') },
              { id: 'd', foreshadowId: '伪人身份', ep: 8, shotSpec: denseSpec('EP08') },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateForeshadowRhythmBridge(
          pack({
            links: [{ id: 'L1', foreshadowId: 'ghost', ep: 8, shotSpec: denseSpec('EP08') }],
          }),
        ),
      ),
    ).toContain('UNKNOWN_FORESHADOW');
    expect(
      failCodes(
        evaluateForeshadowRhythmBridge(
          pack({
            links: [{ id: 'L1', foreshadowId: '伪人身份', ep: 5, shotSpec: denseSpec('EP05') }],
          }),
        ),
      ),
    ).toContain('NO_EVENT_AT_EP');
  });

  it('profile mismatch → WARN still PASS', () => {
    const r = evaluateForeshadowRhythmBridge(
      pack({
        profile: 'dense',
        links: [
          {
            id: 'L1',
            foreshadowId: '伪人身份',
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
});
