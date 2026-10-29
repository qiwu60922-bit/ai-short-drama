/**
 * V12 StageGoal×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateStageGoalForeshadowLink } from '@/agents/assembly/stage-goal-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  seasonId: 'S1',
  latestEp: 10,
  goals: [
    { id: 'G1', label: '夺回机长席', destination: '对峙胜利', startEp: 1, dueEp: 10, status: 'met' as const },
    { id: 'G2', label: '下一关', destination: '晋级', startEp: 10, dueEp: 20, status: 'open' as const },
  ],
  progress: [
    { goalId: 'G1', ep: 10, advances: true },
    { goalId: 'G2', ep: 10, advances: true },
  ],
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', goalId: 'G1', foreshadowId: 'FS1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateStageGoalForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateStageGoalForeshadowLink', () => {
  it('goal due + foreshadow payoff → PASS', () => {
    const r = evaluateStageGoalForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_GOAL', () => {
    expect(failCodes(evaluateStageGoalForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateStageGoalForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_GOAL');
  });
});
