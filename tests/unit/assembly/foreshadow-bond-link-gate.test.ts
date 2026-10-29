/**
 * V12 Foreshadow×Bond Link — 伏笔×契约, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowBondLink } from '@/agents/assembly/foreshadow-bond-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  items: [{
    id: '机长身份',
    name: '机长马甲伏笔',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 5,
  }],
  bonds: [{
    id: '机长契约',
    partyA: '苏见晴',
    partyB: '傅司宴',
    contractEp: 1,
    contractLabel: '契约联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 10,
    upgradeLabel: '真心升级',
  }],
  links: [{ id: 'L1', foreshadowId: '机长身份', bondId: '机长契约' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowBondLink', () => {
  it('payoff @ terminal → PASS', () => {
    const r = evaluateForeshadowBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / PAYOFF_NOT_AT_TERMINAL / TERMINAL_WITHOUT_FORESHADOW', () => {
    expect(failCodes(evaluateForeshadowBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowBondLink(
          pack({
            items: [{
              id: '机长身份',
              name: '机长马甲伏笔',
              priority: 'S' as const,
              plantEp: 1,
              status: 'closed' as const,
              payoffEp: 9,
              lastAdvancedEp: 5,
            }],
          }),
        ),
      ),
    ).toContain('PAYOFF_NOT_AT_TERMINAL');
    expect(failCodes(evaluateForeshadowBondLink(pack({ links: [] })))).toContain(
      'TERMINAL_WITHOUT_FORESHADOW',
    );
  });
});
