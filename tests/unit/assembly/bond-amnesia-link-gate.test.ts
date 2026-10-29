/**
 * V12 Bond×Amnesia Link — bond主键×失忆唤回, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondAmnesiaLink } from '@/agents/assembly/bond-amnesia-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
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
  links: [{ id: 'L1', bondId: '江少契约', amnesiaId: '祁南失忆' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateBondAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateBondAmnesiaLink', () => {
  it('terminal = recover → PASS', () => {
    const r = evaluateBondAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / BOND_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateBondAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateBondAmnesiaLink(pack({ links: [] })))).toContain('BOND_WITHOUT_AMNESIA');
  });
});
