/**
 * V12 Rhythm×Bond×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateRhythmBondPeakBridge } from '@/agents/assembly/rhythm-bond-peak-bridge-gate';

const rhythmSpec = {"episode": "EP10", "shots": [{"shotId": "EP10-b142r-0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "冷开危机·抛钩", "hookKind": "situation"}, {"shotId": "EP10-b142r-1", "durSec": 2, "cast": [], "beatRole": "reversal", "action": "身份反转·加压"}, {"shotId": "EP10-b142r-2", "durSec": 3, "cast": [], "beatRole": "increment", "action": "加压·推进"}, {"shotId": "EP10-b142r-3", "durSec": 4, "cast": [], "beatRole": "cliffhanger", "action": "悬念·收束"}]};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec: rhythmSpec }],
  bonds: [{
    id: 'B1', partyA: '苏见晴', partyB: '傅司宴', contractEp: 1, contractLabel: '契约联姻',
    companionEps: [2, 3, 5], upgradeEp: 10, upgradeLabel: '真心升级',
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', rhythmId: 'EP10-rhythm', bondId: 'B1', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateRhythmBondPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateRhythmBondPeakBridge', () => {
  it('rhythm + bond + peak → PASS', () => {
    const r = evaluateRhythmBondPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateRhythmBondPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateRhythmBondPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
