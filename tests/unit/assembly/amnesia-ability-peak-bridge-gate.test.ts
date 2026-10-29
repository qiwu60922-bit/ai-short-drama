/**
 * V12 Amnesia×Ability×Peak Ternary — 失忆唤回×金手指×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaAbilityPeakBridge } from '@/agents/assembly/amnesia-ability-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  abilities: [{
    id: 'seer',
    holder: 'linyang',
    acquiredEp: 1,
    exclusive: true,
    rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
  }],
  uses: [
    { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
    { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
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
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', abilityId: 'seer', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAmnesiaAbilityPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaAbilityPeakBridge', () => {
  it('use + recover + peak @ep → PASS', () => {
    const r = evaluateAmnesiaAbilityPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / RECOVER_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAmnesiaAbilityPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAmnesiaAbilityPeakBridge(pack({ links: [] })))).toContain('RECOVER_WITHOUT_BRIDGE');
  });
});
