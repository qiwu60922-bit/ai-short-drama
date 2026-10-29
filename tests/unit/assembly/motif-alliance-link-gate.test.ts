/**
 * V12 Motif×Alliance Link — 母题×同盟, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifAllianceLink } from '@/agents/assembly/motif-alliance-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' as const }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo' as const, visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff' as const, visualState: '盛放' },
  ],
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  links: [{ id: 'L1', motifId: 'white-rose', allianceId: 'oni-fang', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifAllianceLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifAllianceLink', () => {
  it('payoff @ appearance → PASS', () => {
    const r = evaluateMotifAllianceLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / MOTIF_WITHOUT_ALLIANCE', () => {
    expect(failCodes(evaluateMotifAllianceLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifAllianceLink(pack({ links: [] })))).toContain(
      'MOTIF_WITHOUT_ALLIANCE',
    );
  });
});
