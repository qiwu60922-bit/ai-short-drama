/**
 * V12 Motif×Vest Link — 母题×马甲, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifVestLink } from '@/agents/assembly/motif-vest-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' as const }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo' as const, visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff' as const, visualState: '盛放' },
  ],
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 10,
    dropLabel: '公开机长身份反击',
  }],
  links: [{ id: 'L1', motifId: 'white-rose', vestId: '机长马甲', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifVestLink', () => {
  it('appearance @ drop → PASS', () => {
    const r = evaluateMotifVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_DROP / DROP_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateMotifVestLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifVestLink(
          pack({
            links: [{ id: 'L1', motifId: 'white-rose', vestId: '机长马甲', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_DROP');
    expect(failCodes(evaluateMotifVestLink(pack({ links: [] })))).toContain(
      'DROP_WITHOUT_MOTIF',
    );
  });
});
