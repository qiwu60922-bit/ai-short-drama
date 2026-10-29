/**
 * V12 Snap×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateSnapRhythmPeakBridge } from '@/agents/assembly/snap-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-B158-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-B158-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-B158-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-B158-3", "durSec": 1.5, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};
const rhythmSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-B158-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-B158-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-B158-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-B158-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  snaps: [{ id: 'EP10-snap-b158', ep: 10, shotSpec }],
  rhythms: [{ id: 'EP10-rhythm-b158-bt', ep: 10, shotSpec: rhythmSpec }],
  peaks: [{ id: '对峙峰值-b158-bt', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', snapId: 'EP10-snap-b158', rhythmId: 'EP10-rhythm-b158-bt', peakId: '对峙峰值-b158-bt', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateSnapRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateSnapRhythmPeakBridge', () => {
  it('snap + rhythm + peak → PASS', () => {
    const r = evaluateSnapRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateSnapRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateSnapRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
