/**
 * V12 Alliance×Vest Link — 同盟×马甲, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceVestLink } from '@/agents/assembly/alliance-vest-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '当众护短' },
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
  links: [{ id: 'L1', allianceId: 'oni-fang', vestId: '机长马甲', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAllianceVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceVestLink', () => {
  it('payoff = drop → PASS', () => {
    const r = evaluateAllianceVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_DROP / DROP_WITHOUT_ALLIANCE', () => {
    expect(failCodes(evaluateAllianceVestLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAllianceVestLink(
          pack({
            links: [{ id: 'L1', allianceId: 'oni-fang', vestId: '机长马甲', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_DROP');
    expect(failCodes(evaluateAllianceVestLink(pack({ links: [] })))).toContain(
      'DROP_WITHOUT_ALLIANCE',
    );
  });
});
