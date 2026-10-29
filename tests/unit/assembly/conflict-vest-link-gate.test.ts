/**
 * V12 Conflict×Vest Link — 冲突×马甲, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictVestLink } from '@/agents/assembly/conflict-vest-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 10,
    dropLabel: '公开机长身份反击',
  }],
  links: [{ id: 'L1', conflictId: '挑衅反噬', vestId: '机长马甲', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictVestLink', () => {
  it('payoff = drop → PASS', () => {
    const r = evaluateConflictVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_DROP / PAYOFF_WITHOUT_VEST', () => {
    expect(failCodes(evaluateConflictVestLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictVestLink(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', vestId: '机长马甲', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_DROP');
    expect(failCodes(evaluateConflictVestLink(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_VEST',
    );
  });
});
