/**
 * V12 Conflict×Alliance Link — 冲突×同盟, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictAllianceLink } from '@/agents/assembly/conflict-alliance-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  links: [{ id: 'L1', conflictId: '挑衅反噬', allianceId: 'oni-fang', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictAllianceLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictAllianceLink', () => {
  it('payoff @ alliance payoff → PASS', () => {
    const r = evaluateConflictAllianceLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_DUAL_PAYOFF / CONFLICT_WITHOUT_ALLIANCE', () => {
    expect(failCodes(evaluateConflictAllianceLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictAllianceLink(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', allianceId: 'oni-fang', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_DUAL_PAYOFF');
    expect(failCodes(evaluateConflictAllianceLink(pack({ links: [] })))).toContain(
      'CONFLICT_WITHOUT_ALLIANCE',
    );
  });
});
