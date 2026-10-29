/**
 * V12 Countdown×Bond Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCountdownBondLink } from '@/agents/assembly/countdown-bond-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉', latestEp: 20,
  countdowns: [{ id: 'CD1', label: '终局倒计时', startEp: 1, deadlineEp: 10, status: 'open' }],
  bonds: [{
    id: 'B1', partyA: '苏见晴', partyB: '傅司宴', contractEp: 1, contractLabel: '契约联姻',
    companionEps: [2, 3, 5], upgradeEp: 10, upgradeLabel: '真心升级',
  }],
  links: [{ id: 'L1', countdownId: 'CD1', bondId: 'B1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateCountdownBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCountdownBondLink', () => {
  it('countdown + bond → PASS', () => {
    const r = evaluateCountdownBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / TERMINAL_WITHOUT_COUNTDOWN', () => {
    expect(failCodes(evaluateCountdownBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateCountdownBondLink(pack({ links: [] })))).toContain('TERMINAL_WITHOUT_COUNTDOWN');
  });
});
