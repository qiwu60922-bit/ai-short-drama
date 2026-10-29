/**
 * V12 Alliance×Amnesia×Bond Ternary — 同盟×失忆×契约, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceAmnesiaBondBridge } from '@/agents/assembly/alliance-amnesia-bond-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 8, role: 'payoff' as const, note: '当众护短' },
  ],
  amnesias: [{
    id: '祁南失忆',
    actor: '祁南',
    plantEp: 1,
    plantCause: '爆炸',
    companionEps: [2, 4, 6],
    recoverEp: 8,
    recoverLabel: '摩天轮唤回',
    recoverTrigger: '圣诞摩天轮',
  }],
  bonds: [{
    id: '江少契约',
    partyA: '江少',
    partyB: '女主',
    contractEp: 1,
    contractLabel: '假面联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 8,
    upgradeLabel: '真心崩塌后真情',
  }],
  links: [{ id: 'L1', allianceId: 'oni-fang', amnesiaId: '祁南失忆', bondId: '江少契约', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAllianceAmnesiaBondBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceAmnesiaBondBridge', () => {
  it('recover + upgrade + payoff @ep → PASS', () => {
    const r = evaluateAllianceAmnesiaBondBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / TERMINAL_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAllianceAmnesiaBondBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAllianceAmnesiaBondBridge(
          pack({
            links: [{ id: 'L1', allianceId: 'oni-fang', amnesiaId: '祁南失忆', bondId: '江少契约', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateAllianceAmnesiaBondBridge(pack({ links: [] })))).toContain(
      'TERMINAL_WITHOUT_BRIDGE',
    );
  });
});
