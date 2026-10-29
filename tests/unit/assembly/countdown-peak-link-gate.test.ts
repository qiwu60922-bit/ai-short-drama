/**
 * V12 Countdown×Peak Link — 倒计时 deadline × 巅峰, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCountdownPeakLink } from '@/agents/assembly/countdown-peak-link-gate';

const countdown = {
  id: '直播时限',
  label: '天幕直播截止',
  startEp: 1,
  deadlineEp: 8,
  status: 'met' as const,
};
const peak = {
  id: '揭穿对峙',
  openEp: 1,
  peakEp: 8,
  peakLabel: '直播揭穿峰值',
  payoffEp: 8,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  countdowns: [countdown],
  peaks: [peak],
  links: [{ id: 'L1', countdownId: '直播时限', peakId: '揭穿对峙' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCountdownPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCountdownPeakLink', () => {
  it('deadline at peak → PASS', () => {
    const r = evaluateCountdownPeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DEADLINE_NOT_AT_PEAK / PEAK_WITHOUT_COUNTDOWN', () => {
    expect(failCodes(evaluateCountdownPeakLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCountdownPeakLink(
          pack({
            countdowns: [{ ...countdown, deadlineEp: 3 }],
          }),
        ),
      ),
    ).toContain('DEADLINE_NOT_AT_PEAK');
    expect(failCodes(evaluateCountdownPeakLink(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_COUNTDOWN',
    );
  });
});
