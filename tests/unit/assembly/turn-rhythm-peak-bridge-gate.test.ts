/**
 * V12 Turn×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateTurnRhythmPeakBridge } from '@/agents/assembly/turn-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-B158-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-B158-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-B158-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-B158-3", "durSec": 1.5, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};
const rhythmSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-B158-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-B158-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-B158-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-B158-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  turns: [{ id: 'EP10-turn-b158', ep: 10, shotSpec }],
  rhythms: [{ id: 'EP10-rhythm-b158-pv', ep: 10, shotSpec: rhythmSpec }],
  peaks: [{ id: '对峙峰值-b158-pv', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', turnId: 'EP10-turn-b158', rhythmId: 'EP10-rhythm-b158-pv', peakId: '对峙峰值-b158-pv', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateTurnRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateTurnRhythmPeakBridge', () => {
  it('turn + rhythm + peak → PASS', () => {
    const r = evaluateTurnRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateTurnRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateTurnRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
