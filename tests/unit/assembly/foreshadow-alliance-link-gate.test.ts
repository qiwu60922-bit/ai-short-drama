/**
 * V12 Foreshadow×Alliance Link — 伏笔×同盟(伏笔优先), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowAllianceLink } from '@/agents/assembly/foreshadow-alliance-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
  items: [{
    id: '机长身份',
    name: '机长马甲伏笔',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 5,
  }],
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  links: [{ id: 'L1', foreshadowId: '机长身份', allianceId: 'oni-fang', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowAllianceLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowAllianceLink', () => {
  it('dual payoff @ep → PASS', () => {
    const r = evaluateForeshadowAllianceLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_DUAL_PAYOFF / FORESHADOW_WITHOUT_ALLIANCE', () => {
    expect(failCodes(evaluateForeshadowAllianceLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowAllianceLink(
          pack({
            links: [{ id: 'L1', foreshadowId: '机长身份', allianceId: 'oni-fang', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_DUAL_PAYOFF');
    expect(failCodes(evaluateForeshadowAllianceLink(pack({ links: [] })))).toContain(
      'FORESHADOW_WITHOUT_ALLIANCE',
    );
  });
});
