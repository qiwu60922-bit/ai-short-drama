/**
 * V12 Ability×Vest×Peak Ternary — 金手指×马甲×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityVestPeakBridge } from '@/agents/assembly/ability-vest-peak-bridge-gate';

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
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 10,
    dropLabel: '公开机长身份反击',
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', abilityId: 'seer', vestId: '机长马甲', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityVestPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityVestPeakBridge', () => {
  it('use + drop + peak @ep → PASS', () => {
    const r = evaluateAbilityVestPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAbilityVestPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAbilityVestPeakBridge(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', vestId: '机长马甲', peakId: '对峙峰值', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateAbilityVestPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
