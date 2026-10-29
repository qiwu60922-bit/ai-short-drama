/**
 * V12 Bond×Motif Link — 契约×母题, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondMotifLink } from '@/agents/assembly/bond-motif-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  bonds: [{
    id: '江少契约',
    partyA: '江少',
    partyB: '女主',
    contractEp: 1,
    contractLabel: '假面联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 10,
    upgradeLabel: '真心升级',
  }],
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff', visualState: '盛放' },
  ],
  links: [{ id: 'L1', bondId: '江少契约', motifId: 'white-rose' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateBondMotifLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateBondMotifLink', () => {
  it('appearance at upgrade → PASS', () => {
    const r = evaluateBondMotifLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / NO_MOTIF_AT_TERMINAL / TERMINAL_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateBondMotifLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateBondMotifLink(
          pack({
            appearances: [
              { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
              { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
              { motifId: 'white-rose', ep: 8, role: 'payoff', visualState: '盛放' },
            ],
          }),
        ),
      ),
    ).toContain('NO_MOTIF_AT_TERMINAL');
    expect(failCodes(evaluateBondMotifLink(pack({ links: [] })))).toContain('TERMINAL_WITHOUT_MOTIF');
  });
});
