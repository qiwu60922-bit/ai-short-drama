/**
 * V12 Motif×Bond Link — 母题×契约, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifBondLink } from '@/agents/assembly/motif-bond-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff', visualState: '盛放' },
  ],
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
  links: [{ id: 'L1', motifId: 'white-rose', bondId: '江少契约' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifBondLink', () => {
  it('appearance at upgrade → PASS', () => {
    const r = evaluateMotifBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / MOTIF_WITHOUT_TERMINAL', () => {
    expect(failCodes(evaluateMotifBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifBondLink(pack({ links: [] })))).toContain(
      'MOTIF_WITHOUT_TERMINAL',
    );
  });
});
