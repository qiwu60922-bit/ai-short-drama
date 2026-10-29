/**
 * V12 Motif×Vest×Peak Ternary — 母题×马甲×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifVestPeakBridge } from '@/agents/assembly/motif-vest-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 8, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 20, role: 'payoff', visualState: '盛放' },
  ],
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 8,
    dropLabel: '公开机长身份反击',
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 8, peakLabel: '公开身份对峙', payoffEp: 8 }],
  links: [{ id: 'L1', motifId: 'white-rose', vestId: '机长马甲', peakId: '对峙峰值', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifVestPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifVestPeakBridge', () => {
  it('motif + drop + peak @ep → PASS', () => {
    const r = evaluateMotifVestPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateMotifVestPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifVestPeakBridge(
          pack({
            links: [{ id: 'L1', motifId: 'white-rose', vestId: '机长马甲', peakId: '对峙峰值', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateMotifVestPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
