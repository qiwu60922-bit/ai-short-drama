/**
 * V12 Amnesia×Foreshadow Link — 失忆×伏笔, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaForeshadowLink } from '@/agents/assembly/amnesia-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
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
  items: [{
    id: '机长身份',
    name: '机长马甲伏笔',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 5,
  }],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', foreshadowId: '机长身份', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAmnesiaForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaForeshadowLink', () => {
  it('payoff @ recover → PASS', () => {
    const r = evaluateAmnesiaForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_RECOVER / RECOVER_WITHOUT_FORESHADOW', () => {
    expect(failCodes(evaluateAmnesiaForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAmnesiaForeshadowLink(
          pack({
            links: [{ id: 'L1', amnesiaId: '祁南失忆', foreshadowId: '机长身份', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_RECOVER');
    expect(failCodes(evaluateAmnesiaForeshadowLink(pack({ links: [] })))).toContain(
      'RECOVER_WITHOUT_FORESHADOW',
    );
  });
});
