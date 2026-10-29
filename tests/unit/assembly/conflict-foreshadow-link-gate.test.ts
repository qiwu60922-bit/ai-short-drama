/**
 * V12 Conflict×Foreshadow Link — 冲突×伏笔, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictForeshadowLink } from '@/agents/assembly/conflict-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  items: [{
    id: '机长身份',
    name: '机长马甲伏笔',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 5,
  }],
  links: [{ id: 'L1', conflictId: '挑衅反噬', foreshadowId: '机长身份', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictForeshadowLink', () => {
  it('dual payoff @ep → PASS', () => {
    const r = evaluateConflictForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_DUAL_PAYOFF / CONFLICT_WITHOUT_FORESHADOW', () => {
    expect(failCodes(evaluateConflictForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictForeshadowLink(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', foreshadowId: '机长身份', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_DUAL_PAYOFF');
    expect(failCodes(evaluateConflictForeshadowLink(pack({ links: [] })))).toContain(
      'CONFLICT_WITHOUT_FORESHADOW',
    );
  });
});
