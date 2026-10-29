/**
 * V12 StageGoal×Mask×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateStageGoalMaskPeakBridge } from '@/agents/assembly/stage-goal-mask-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  seasonId: 'S1',
  latestEp: 20,
  goals: [
    { id: 'G1', label: '夺回机长席', destination: '公开身份对峙胜利', startEp: 1, dueEp: 10, status: 'met' as const },
    { id: 'G2', label: '下一关', destination: '晋级', startEp: 10, dueEp: 25, status: 'open' as const },
  ],
  progress: [
    { goalId: 'G1', ep: 10, advances: true },
    { goalId: 'G2', ep: 18, advances: true },
  ],
  masks: [{ id: 'M1', wearer: '江少', plantEp: 1, maintainEps: [2, 3], revealEp: 10, revealLabel: '真心崩塌' }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', goalId: 'G1', maskId: 'M1', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateStageGoalMaskPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateStageGoalMaskPeakBridge', () => {
  it('goal + mask + peak → PASS', () => {
    const r = evaluateStageGoalMaskPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateStageGoalMaskPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateStageGoalMaskPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
