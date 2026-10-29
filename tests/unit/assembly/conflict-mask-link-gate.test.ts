/**
 * V12 Conflict×Mask Link — 冲突×伪装, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictMaskLink } from '@/agents/assembly/conflict-mask-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 10,
    revealLabel: '真心崩塌',
  }],
  links: [{ id: 'L1', conflictId: '挑衅反噬', maskId: '花心纨绔', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictMaskLink', () => {
  it('payoff = reveal → PASS', () => {
    const r = evaluateConflictMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_REVEAL / PAYOFF_WITHOUT_MASK', () => {
    expect(failCodes(evaluateConflictMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictMaskLink(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', maskId: '花心纨绔', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_REVEAL');
    expect(failCodes(evaluateConflictMaskLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_MASK');
  });
});
