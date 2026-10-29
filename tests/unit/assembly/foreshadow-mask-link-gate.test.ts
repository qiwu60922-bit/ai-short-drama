/**
 * V12 Foreshadow×Mask Link — 伏笔×伪装, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowMaskLink } from '@/agents/assembly/foreshadow-mask-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
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
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 10,
    revealLabel: '真心崩塌',
  }],
  links: [{ id: 'L1', foreshadowId: '机长身份', maskId: '花心纨绔' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowMaskLink', () => {
  it('payoff = reveal → PASS', () => {
    const r = evaluateForeshadowMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / PAYOFF_NOT_AT_REVEAL / REVEAL_WITHOUT_FORESHADOW', () => {
    expect(failCodes(evaluateForeshadowMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowMaskLink(
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
    ).toContain('PAYOFF_NOT_AT_REVEAL');
    expect(failCodes(evaluateForeshadowMaskLink(pack({ links: [] })))).toContain(
      'REVEAL_WITHOUT_FORESHADOW',
    );
  });
});
