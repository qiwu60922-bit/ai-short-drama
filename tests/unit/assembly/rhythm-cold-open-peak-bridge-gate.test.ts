/**
 * V12 Rhythm×ColdOpen×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateRhythmColdOpenPeakBridge } from '@/agents/assembly/rhythm-cold-open-peak-bridge-gate';

const shotSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-S0', durSec: 1.5, cast: [], beatRole: 'hook', action: '冷开危机', hookKind: 'situation' },
    { shotId: 'EP10-S1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转' },
    { shotId: 'EP10-S2', durSec: 3, cast: [], beatRole: 'increment', action: '加压' },
    { shotId: 'EP10-S3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念' },
  ],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec }],
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', rhythmId: 'EP10-rhythm', coldOpenId: 'EP10-cold', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateRhythmColdOpenPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateRhythmColdOpenPeakBridge', () => {
  it('rhythm + coldOpen + peak → PASS', () => {
    const r = evaluateRhythmColdOpenPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateRhythmColdOpenPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateRhythmColdOpenPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
