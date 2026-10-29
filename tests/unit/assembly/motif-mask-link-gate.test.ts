/**
 * V12 Motif×Mask Link — 视觉母题 × 伪装揭穿, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifMaskLink } from '@/agents/assembly/motif-mask-link-gate';

const rose = { id: 'white-rose', label: '白玫瑰', kind: 'prop' as const };
const apps = [
  { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
  { motifId: 'white-rose', ep: 4, role: 'echo' as const, visualState: '半开' },
  { motifId: 'white-rose', ep: 8, role: 'payoff' as const, visualState: '盛放揭穿' },
];
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
  motifs: [rose],
  appearances: apps,
  masks: [mask],
  links: [{ id: 'L1', motifId: 'white-rose', maskId: '花心纨绔' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateMotifMaskLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateMotifMaskLink', () => {
  it('reveal with motif appearance → PASS', () => {
    const r = evaluateMotifMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / no appearance / reveal without motif', () => {
    expect(failCodes(evaluateMotifMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifMaskLink(
          pack({
            links: [
              { id: 'd', motifId: 'white-rose', maskId: '花心纨绔' },
              { id: 'd', motifId: 'white-rose', maskId: '花心纨绔' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateMotifMaskLink(
          pack({
            appearances: apps.filter((a) => a.ep !== 8),
          }),
        ),
      ),
    ).toContain('NO_APPEARANCE_AT_REVEAL');
    expect(failCodes(evaluateMotifMaskLink(pack({ links: [] })))).toContain(
      'REVEAL_WITHOUT_MOTIF',
    );
  });

  it('orphan motif → PENDING_MOTIF WARN', () => {
    const r = evaluateMotifMaskLink(
      pack({
        motifs: [rose, { id: 'ring', label: '戒指', kind: 'prop' as const }],
        appearances: [
          ...apps,
          { motifId: 'ring', ep: 1, role: 'seed' as const },
          { motifId: 'ring', ep: 8, role: 'echo' as const },
          { motifId: 'ring', ep: 20, role: 'payoff' as const },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_MOTIF');
    expect(r.verdict).toBe('PASS');
  });
});
