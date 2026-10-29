/**
 * V12 Countdown×Mask Link — 倒计时 deadline × 伪装揭穿, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCountdownMaskLink } from '@/agents/assembly/countdown-mask-link-gate';

const countdown = {
  id: '直播时限',
  label: '天幕直播 24h',
  startEp: 1,
  deadlineEp: 8,
  status: 'met' as const,
};

const mask = {
  id: '花心纨绔',
  wearer: '江少',
  plantEp: 1,
  maintainEps: [2, 3],
  revealEp: 8,
  revealLabel: '真心崩塌',
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  countdowns: [countdown],
  masks: [mask],
  links: [{ id: 'L1', countdownId: '直播时限', maskId: '花心纨绔' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCountdownMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateCountdownMaskLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateCountdownMaskLink', () => {
  it('reveal at deadline → PASS', () => {
    const r = evaluateCountdownMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / not at deadline', () => {
    expect(failCodes(evaluateCountdownMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCountdownMaskLink(
          pack({
            links: [
              { id: 'd', countdownId: '直播时限', maskId: '花心纨绔' },
              { id: 'd', countdownId: '直播时限', maskId: '花心纨绔' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateCountdownMaskLink(
          pack({
            masks: [{ ...mask, revealEp: 5, revealLabel: '提前揭穿' }],
          }),
        ),
      ),
    ).toContain('REVEAL_NOT_AT_DEADLINE');
  });

  it('deadline without link → DEADLINE_WITHOUT_MASK', () => {
    expect(failCodes(evaluateCountdownMaskLink(pack({ links: [] })))).toContain(
      'DEADLINE_WITHOUT_MASK',
    );
  });

  it('orphan mask → PENDING_MASK WARN', () => {
    const r = evaluateCountdownMaskLink(
      pack({
        masks: [
          mask,
          {
            id: '旁路面具',
            wearer: 'X',
            plantEp: 2,
            revealEp: 9,
            revealLabel: '旁路揭穿',
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_MASK');
    expect(r.verdict).toBe('PASS');
  });
});
