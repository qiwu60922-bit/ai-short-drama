/**
 * V12 Ability×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityRhythmPeakBridge } from '@/agents/assembly/ability-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  abilities: [{ id: 'seer-b153', holder: 'linyang', acquiredEp: 1, exclusive: true, rule: { cycle: 'day', maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] } }],
  uses: [
    { abilityId: 'seer-b153', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
    { abilityId: 'seer-b153', by: 'linyang', ep: 10, day: 10, option: '查验身份' },
  ],
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', abilityId: 'seer-b153', rhythmId: 'EP10-rhythm', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateAbilityRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityRhythmPeakBridge', () => {
  it('ability + rhythm + peak → PASS', () => {
    const r = evaluateAbilityRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAbilityRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAbilityRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
