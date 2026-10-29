/**
 * V12 Foreshadow×Amnesia Link — 伏笔×失忆, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowAmnesiaLink } from '@/agents/assembly/foreshadow-amnesia-link-gate';

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
  amnesias: [{
    id: '祁南失忆',
    actor: '祁南',
    plantEp: 1,
    plantCause: '爆炸',
    companionEps: [2, 4, 6],
    recoverEp: 10,
    recoverLabel: '摩天轮唤回',
    recoverTrigger: '圣诞摩天轮',
  }],
  links: [{ id: 'L1', foreshadowId: '机长身份', amnesiaId: '祁南失忆', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowAmnesiaLink', () => {
  it('payoff @ recover → PASS', () => {
    const r = evaluateForeshadowAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_RECOVER / FORESHADOW_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateForeshadowAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowAmnesiaLink(
          pack({
            links: [{ id: 'L1', foreshadowId: '机长身份', amnesiaId: '祁南失忆', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_RECOVER');
    expect(failCodes(evaluateForeshadowAmnesiaLink(pack({ links: [] })))).toContain(
      'FORESHADOW_WITHOUT_AMNESIA',
    );
  });
});
