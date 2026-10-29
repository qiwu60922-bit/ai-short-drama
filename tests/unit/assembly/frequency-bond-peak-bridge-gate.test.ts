/**
 * V12 Frequency×Bond×Peak Ternary — 第N次×契约×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyBondPeakBridge } from '@/agents/assembly/frequency-bond-peak-bridge-gate';

const frequency = {
  id: '离婚99',
  actor: '叶楚',
  motif: '离婚要挟',
  unit: 'count' as const,
  threshold: 3,
  plantEp: 1,
  plantAtSec: 0,
  tipEp: 8,
  tipAtSec: 10,
  tipLabel: '第3次离婚签字',
  ticks: [
    { ep: 2, n: 1 },
    { ep: 5, n: 2 },
    { ep: 8, n: 3 },
  ],
};
const bond = {
  id: '入赘姜家',
  partyA: '叶楚',
  partyB: '姜家',
  contractEp: 1,
  contractLabel: '入赘契约',
  companionEps: [2, 4],
  upgradeEp: 8,
  upgradeLabel: '真情站稳',
};
const peak = { id: '对峙峰值', openEp: 1, peakEp: 8, peakLabel: '对峙', payoffEp: 8 };

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '叶楚出狱',
  latestEp: 20,
  frequencies: [frequency],
  bonds: [bond],
  peaks: [peak],
  links: [{ id: 'L1', frequencyId: '离婚99', bondId: '入赘姜家', peakId: '对峙峰值', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyBondPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyBondPeakBridge', () => {
  it('tip + upgrade + peak @ep → PASS', () => {
    const r = evaluateFrequencyBondPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateFrequencyBondPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateFrequencyBondPeakBridge(
          pack({
            links: [{ id: 'L1', frequencyId: '离婚99', bondId: '入赘姜家', peakId: '对峙峰值', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateFrequencyBondPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
