/**
 * V12 Motif×Countdown Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifCountdownLink } from '@/agents/assembly/motif-countdown-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff', visualState: '盛放' },
  ],
  countdowns: [{ id: '直播时限', label: '终局倒计时', startEp: 1, deadlineEp: 10, status: 'open' as const }],
  links: [{ id: 'L1', motifId: 'white-rose', countdownId: '直播时限' }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateMotifCountdownLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifCountdownLink', () => {
  it('motif + countdown → PASS', () => {
    const r = evaluateMotifCountdownLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / DEADLINE_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateMotifCountdownLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifCountdownLink(pack({ links: [] })))).toContain('DEADLINE_WITHOUT_MOTIF');
  });
});
