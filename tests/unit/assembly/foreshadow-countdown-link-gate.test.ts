/**
 * V12 Foreshadow×Countdown Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowCountdownLink } from '@/agents/assembly/foreshadow-countdown-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S', plantEp: 1, status: 'closed', payoffEp: 10, lastAdvancedEp: 4 }],
  countdowns: [{ id: '直播时限', label: '终局倒计时', startEp: 1, deadlineEp: 10, status: 'open' as const }],
  links: [{ id: 'L1', foreshadowId: 'FS1', countdownId: '直播时限', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateForeshadowCountdownLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowCountdownLink', () => {
  it('foreshadow + countdown → PASS', () => {
    const r = evaluateForeshadowCountdownLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / DEADLINE_WITHOUT_FORESHADOW', () => {
    expect(failCodes(evaluateForeshadowCountdownLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateForeshadowCountdownLink(pack({ links: [] })))).toContain('DEADLINE_WITHOUT_FORESHADOW');
  });
});
