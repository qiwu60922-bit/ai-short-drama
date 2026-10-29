/**
 * V12 ColdOpen×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdOpenRhythmPeakBridge } from '@/agents/assembly/cold-open-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec }],
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', coldOpenId: 'EP10-cold', rhythmId: 'EP10-rhythm', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateColdOpenRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateColdOpenRhythmPeakBridge', () => {
  it('coldOpen + rhythm + peak → PASS', () => {
    const r = evaluateColdOpenRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateColdOpenRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateColdOpenRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
