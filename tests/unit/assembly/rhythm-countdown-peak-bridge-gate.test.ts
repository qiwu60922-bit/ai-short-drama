/**
 * V12 Rhythm×Countdown×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateRhythmCountdownPeakBridge } from '@/agents/assembly/rhythm-countdown-peak-bridge-gate';

const rhythmSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-S0', durSec: 2, cast: [], beatRole: 'hook', action: '冷开危机·抛钩', hookKind: 'situation' },
    { shotId: 'EP10-S1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转·加压' },
    { shotId: 'EP10-S2', durSec: 3, cast: [], beatRole: 'increment', action: '加压·推进' },
    { shotId: 'EP10-S3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念·收束' },
  ],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉', latestEp: 20,
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec: rhythmSpec }],
  countdowns: [{ id: '直播终局', label: '终局倒计时', startEp: 1, deadlineEp: 10, status: 'open' as const }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', rhythmId: 'EP10-rhythm', countdownId: '直播终局', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateRhythmCountdownPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateRhythmCountdownPeakBridge', () => {
  it('rhythm + countdown + peak → PASS', () => {
    const r = evaluateRhythmCountdownPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateRhythmCountdownPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateRhythmCountdownPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
