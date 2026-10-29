/**
 * V12 Vest×Motif Link — 马甲×母题, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestMotifLink } from '@/agents/assembly/vest-motif-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 10,
    dropLabel: '公开机长身份反击',
  }],
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' as const }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo' as const, visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff' as const, visualState: '盛放' },
  ],
  links: [{ id: 'L1', vestId: '机长马甲', motifId: 'white-rose', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateVestMotifLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestMotifLink', () => {
  it('motif @ dropEp → PASS', () => {
    const r = evaluateVestMotifLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_DROP / DROP_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateVestMotifLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateVestMotifLink(
          pack({
            links: [{ id: 'L1', vestId: '机长马甲', motifId: 'white-rose', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_DROP');
    expect(failCodes(evaluateVestMotifLink(pack({ links: [] })))).toContain('DROP_WITHOUT_MOTIF');
  });
});
