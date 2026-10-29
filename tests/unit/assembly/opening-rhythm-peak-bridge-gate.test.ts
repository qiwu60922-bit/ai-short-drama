/**
 * V12 Opening×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateOpeningRhythmPeakBridge } from '@/agents/assembly/opening-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-B154-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-B154-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-B154-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-B154-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  openings: [{ id: 'EP10-open-b154', ep: 10, shotSpec }],
  rhythms: [{ id: 'EP10-rhythm-b154-o', ep: 10, shotSpec }],
  peaks: [{ id: '对峙峰值-b154-o', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', openingId: 'EP10-open-b154', rhythmId: 'EP10-rhythm-b154-o', peakId: '对峙峰值-b154-o', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateOpeningRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateOpeningRhythmPeakBridge', () => {
  it('opening + rhythm + peak → PASS', () => {
    const r = evaluateOpeningRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateOpeningRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateOpeningRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
