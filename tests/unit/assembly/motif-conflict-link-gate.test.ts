/**
 * V12 Motif×Conflict Link — 母题×冲突, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifConflictLink } from '@/agents/assembly/motif-conflict-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' as const }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo' as const, visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff' as const, visualState: '盛放' },
  ],
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  links: [{ id: 'L1', motifId: 'white-rose', conflictId: '挑衅反噬', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifConflictLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifConflictLink', () => {
  it('payoff @ appearance → PASS', () => {
    const r = evaluateMotifConflictLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / MOTIF_WITHOUT_CONFLICT', () => {
    expect(failCodes(evaluateMotifConflictLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifConflictLink(pack({ links: [] })))).toContain(
      'MOTIF_WITHOUT_CONFLICT',
    );
  });
});
