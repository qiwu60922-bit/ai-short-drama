/**
 * V12 Alliance×Foreshadow Link — 同盟×伏笔, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceForeshadowLink } from '@/agents/assembly/alliance-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  items: [{
    id: '机长身份',
    name: '机长马甲伏笔',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 5,
  }],
  links: [{ id: 'L1', allianceId: 'oni-fang', foreshadowId: '机长身份', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAllianceForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceForeshadowLink', () => {
  it('payoff @ foreshadow payoff → PASS', () => {
    const r = evaluateAllianceForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_DUAL_PAYOFF / PAYOFF_WITHOUT_FORESHADOW', () => {
    expect(failCodes(evaluateAllianceForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAllianceForeshadowLink(
          pack({
            links: [{ id: 'L1', allianceId: 'oni-fang', foreshadowId: '机长身份', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_DUAL_PAYOFF');
    expect(failCodes(evaluateAllianceForeshadowLink(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_FORESHADOW',
    );
  });
});
