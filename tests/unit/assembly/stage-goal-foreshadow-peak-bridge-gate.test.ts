/**
 * V12 StageGoal×Foreshadow×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateStageGoalForeshadowPeakBridge } from '@/agents/assembly/stage-goal-foreshadow-peak-bridge-gate';

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
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', goalId: 'G1', foreshadowId: 'FS1', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateStageGoalForeshadowPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateStageGoalForeshadowPeakBridge', () => {
  it('goal + foreshadow + peak → PASS', () => {
    const r = evaluateStageGoalForeshadowPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateStageGoalForeshadowPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateStageGoalForeshadowPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
