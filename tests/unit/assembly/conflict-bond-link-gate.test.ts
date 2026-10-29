/**
 * V12 Conflict×Bond Link — 冲突×契约, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictBondLink } from '@/agents/assembly/conflict-bond-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '叶楚出狱',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  bonds: [{
    id: '江少契约',
    partyA: '江少',
    partyB: '女主',
    contractEp: 1,
    contractLabel: '假面联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 10,
    upgradeLabel: '真心升级',
  }],
  links: [{ id: 'L1', conflictId: '挑衅反噬', bondId: '江少契约', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictBondLink', () => {
  it('payoff = terminal → PASS', () => {
    const r = evaluateConflictBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_TERMINAL / PAYOFF_WITHOUT_BOND', () => {
    expect(failCodes(evaluateConflictBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictBondLink(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', bondId: '江少契约', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_TERMINAL');
    expect(failCodes(evaluateConflictBondLink(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_BOND',
    );
  });
});
