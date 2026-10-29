/**
 * V12 Conflict×Amnesia Link — 冲突×失忆, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictAmnesiaLink } from '@/agents/assembly/conflict-amnesia-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
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
  links: [{ id: 'L1', conflictId: '挑衅反噬', amnesiaId: '祁南失忆', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictAmnesiaLink', () => {
  it('payoff @ recover → PASS', () => {
    const r = evaluateConflictAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_RECOVER / CONFLICT_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateConflictAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictAmnesiaLink(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', amnesiaId: '祁南失忆', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_RECOVER');
    expect(failCodes(evaluateConflictAmnesiaLink(pack({ links: [] })))).toContain(
      'CONFLICT_WITHOUT_AMNESIA',
    );
  });
});
