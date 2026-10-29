/**
 * V12 Countdown×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCountdownRhythmPeakBridge } from '@/agents/assembly/countdown-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-r0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机·抛钩", "hookKind": "situation"}, {"shotId": "EP10-r1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转·加压"}, {"shotId": "EP10-r2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压·推进"}, {"shotId": "EP10-r3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念·收束"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  countdowns: [{ id: '直播时限', label: '天幕直播 24h', startEp: 1, deadlineEp: 10, status: 'met' as const }],
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', countdownId: '直播时限', rhythmId: 'EP10-rhythm', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateCountdownRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCountdownRhythmPeakBridge', () => {
  it('countdown + rhythm + peak → PASS', () => {
    const r = evaluateCountdownRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateCountdownRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateCountdownRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
