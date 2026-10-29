/**
 * V12 Alliance×Amnesia Link — 同盟×失忆, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceAmnesiaLink } from '@/agents/assembly/alliance-amnesia-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  amnesias: [{
    id: '祁南失忆',
    actor: '祁南',
    plantEp: 1,
    plantCause: '爆炸',
    companionEps: [2, 4, 6],
    recoverEp: 10,
    recoverLabel: '摩天轮唤回',
    recoverTrigger: '圣诞摩天轮',
  }],
  links: [{ id: 'L1', allianceId: 'oni-fang', amnesiaId: '祁南失忆', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAllianceAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceAmnesiaLink', () => {
  it('payoff = recover @ep → PASS', () => {
    const r = evaluateAllianceAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_RECOVER / RECOVER_WITHOUT_ALLIANCE', () => {
    expect(failCodes(evaluateAllianceAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAllianceAmnesiaLink(
          pack({
            links: [{ id: 'L1', allianceId: 'oni-fang', amnesiaId: '祁南失忆', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_RECOVER');
    expect(failCodes(evaluateAllianceAmnesiaLink(pack({ links: [] })))).toContain(
      'RECOVER_WITHOUT_ALLIANCE',
    );
  });
});
