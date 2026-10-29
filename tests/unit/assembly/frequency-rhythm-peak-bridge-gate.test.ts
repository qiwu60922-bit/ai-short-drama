/**
 * V12 Frequency×Rhythm×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyRhythmPeakBridge } from '@/agents/assembly/frequency-rhythm-peak-bridge-gate';

const shotSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-B154-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机", "hookKind": "situation"}, {"shotId": "EP10-B154-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转"}, {"shotId": "EP10-B154-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压"}, {"shotId": "EP10-B154-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念"}]};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 20,
  frequencies: [{
    id: '离婚99-b154',
    actor: '叶楚',
    motif: '离婚要挟',
    unit: 'count' as const,
    threshold: 3,
    plantEp: 1,
    plantAtSec: 0,
    tipEp: 10,
    tipAtSec: 10,
    tipLabel: '第3次离婚签字',
    ticks: [{ ep: 2, n: 1 }, { ep: 5, n: 2 }, { ep: 10, n: 3 }],
  }],
  rhythms: [{ id: 'EP10-rhythm-b154-f', ep: 10, shotSpec }],
  peaks: [{ id: '对峙峰值-b154-f', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', frequencyId: '离婚99-b154', rhythmId: 'EP10-rhythm-b154-f', peakId: '对峙峰值-b154-f', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateFrequencyRhythmPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyRhythmPeakBridge', () => {
  it('frequency + rhythm + peak → PASS', () => {
    const r = evaluateFrequencyRhythmPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateFrequencyRhythmPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateFrequencyRhythmPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
