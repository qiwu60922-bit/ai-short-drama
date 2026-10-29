/**
 * V12 Alliance×Motif Link — 同盟×母题, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceMotifLink } from '@/agents/assembly/alliance-motif-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' as const }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo' as const, visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff' as const, visualState: '盛放' },
  ],
  links: [{ id: 'L1', allianceId: 'oni-fang', motifId: 'white-rose', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAllianceMotifLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceMotifLink', () => {
  it('payoff @ appearance → PASS', () => {
    const r = evaluateAllianceMotifLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_APPEARANCE / PAYOFF_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateAllianceMotifLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAllianceMotifLink(
          pack({
            links: [{ id: 'L1', allianceId: 'oni-fang', motifId: 'white-rose', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_APPEARANCE');
    expect(failCodes(evaluateAllianceMotifLink(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_MOTIF',
    );
  });
});
