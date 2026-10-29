/**
 * V12 Foreshadow×Vest Link — 伏笔兑现×马甲掉落, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowVestLink } from '@/agents/assembly/foreshadow-vest-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  items: [{
    id: '伪人身份',
    name: '预言家真伪',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 4,
  }],
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 10,
    dropLabel: '公开机长身份反击',
  }],
  links: [{ id: 'L1', foreshadowId: '伪人身份', vestId: '机长马甲' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowVestLink', () => {
  it('payoff = drop → PASS', () => {
    const r = evaluateForeshadowVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / PAYOFF_NOT_AT_DROP / DROP_WITHOUT_FORESHADOW', () => {
    expect(failCodes(evaluateForeshadowVestLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowVestLink(
          pack({
            items: [{
              id: '伪人身份',
              name: '预言家真伪',
              priority: 'S' as const,
              plantEp: 1,
              status: 'closed' as const,
              payoffEp: 9,
              lastAdvancedEp: 4,
            }],
          }),
        ),
      ),
    ).toContain('PAYOFF_NOT_AT_DROP');
    expect(failCodes(evaluateForeshadowVestLink(pack({ links: [] })))).toContain(
      'DROP_WITHOUT_FORESHADOW',
    );
  });
});
