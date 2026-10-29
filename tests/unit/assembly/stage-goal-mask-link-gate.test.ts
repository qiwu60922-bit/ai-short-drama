/**
 * V12 StageGoal×Mask Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateStageGoalMaskLink } from '@/agents/assembly/stage-goal-mask-link-gate';

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
  links: [{ id: 'L1', goalId: 'G1', maskId: 'M1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateStageGoalMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateStageGoalMaskLink', () => {
  it('goal + mask → PASS', () => {
    const r = evaluateStageGoalMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / REVEAL_WITHOUT_GOAL', () => {
    expect(failCodes(evaluateStageGoalMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateStageGoalMaskLink(pack({ links: [] })))).toContain('REVEAL_WITHOUT_GOAL');
  });
});
