/**
 * V12 Ability×Conflict×Peak Ternary — 金手指×冲突×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityConflictPeakBridge } from '@/agents/assembly/ability-conflict-peak-bridge-gate';

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
    { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
    { abilityId: 'seer', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
  ],
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', abilityId: 'seer', conflictId: '挑衅反噬', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityConflictPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityConflictPeakBridge', () => {
  it('use + payoff + peak @ep → PASS', () => {
    const r = evaluateAbilityConflictPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAbilityConflictPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityConflictPeakBridge(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', conflictId: '挑衅反噬', peakId: '对峙峰值', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateAbilityConflictPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
