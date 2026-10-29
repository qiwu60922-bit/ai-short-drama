/**
 * V12 Conflict×Motif Link — 冲突×母题, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictMotifLink } from '@/agents/assembly/conflict-motif-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' as const }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo' as const, visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff' as const, visualState: '盛放' },
  ],
  links: [{ id: 'L1', conflictId: '挑衅反噬', motifId: 'white-rose', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictMotifLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictMotifLink', () => {
  it('payoff @ appearance → PASS', () => {
    const r = evaluateConflictMotifLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_APPEARANCE / PAYOFF_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateConflictMotifLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictMotifLink(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', motifId: 'white-rose', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_APPEARANCE');
    expect(failCodes(evaluateConflictMotifLink(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_MOTIF',
    );
  });
});
