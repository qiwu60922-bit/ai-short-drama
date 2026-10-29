/**
 * V12 Countdown×Foreshadow Link — 倒计时×伏笔联表, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCountdownForeshadowLink } from '@/agents/assembly/countdown-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  countdowns: [{ id: '直播终局', label: '终局倒计时', startEp: 1, deadlineEp: 10, status: 'open' }],
  items: [{ id: '伪人身份', name: '预言家真伪', priority: 'S', plantEp: 1, status: 'closed', payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', countdownId: '直播终局', foreshadowId: '伪人身份', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateCountdownForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCountdownForeshadowLink', () => {
  it('deadline + foreshadow payoff @ep → PASS', () => {
    const r = evaluateCountdownForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_COUNTDOWN', () => {
    expect(failCodes(evaluateCountdownForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateCountdownForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_COUNTDOWN');
  });
});
