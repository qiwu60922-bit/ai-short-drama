/**
 * V12 Alliance×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceRhythmPeakBridge } from '@/agents/assembly/alliance-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  alliances: [{ id: 'oni-fang-b153', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang-b153', ep: 1, role: 'seed', note: '结义' },
    { allianceId: 'oni-fang-b153', ep: 5, role: 'echo', note: '试探' },
    { allianceId: 'oni-fang-b153', ep: 10, role: 'payoff', note: '护短' },
  ],
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', allianceId: 'oni-fang-b153', rhythmId: 'EP10-rhythm', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateAllianceRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceRhythmPeakBridge', () => {
  it('alliance + rhythm + peak → PASS', () => {
    const r = evaluateAllianceRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAllianceRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAllianceRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
