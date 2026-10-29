/**
 * V12 Mask×Motif Link — 伪装×母题, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskMotifLink } from '@/agents/assembly/mask-motif-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 8,
    revealLabel: '真心崩塌',
  }],
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 4, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 8, role: 'payoff', visualState: '盛放揭穿' },
  ],
  links: [{ id: 'L1', maskId: '花心纨绔', motifId: 'white-rose' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskMotifLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskMotifLink', () => {
  it('reveal ↔ motif → PASS', () => {
    const r = evaluateMaskMotifLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / REVEAL_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateMaskMotifLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMaskMotifLink(pack({ links: [] })))).toContain(
      'REVEAL_WITHOUT_MOTIF',
    );
  });
});
