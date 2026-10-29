/**
 * V12 Vest×Motif×Peak Ternary — 马甲×母题×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestMotifPeakBridge } from '@/agents/assembly/vest-motif-peak-bridge-gate';

const vest = {
  id: '机长马甲',
  wearer: '苏见晴',
  vestLabel: '机长',
  plantEp: 1,
  teaseEps: [3, 5],
  dropEp: 8,
  dropLabel: '公开机长身份反击',
  peakEp: 8,
  peakLabel: '对峙峰值',
};
const motif = { id: 'white-rose', label: '白玫瑰', kind: 'prop' as const };
const appearances = [
  { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
  { motifId: 'white-rose', ep: 8, role: 'echo' as const, visualState: '半开' },
  { motifId: 'white-rose', ep: 20, role: 'payoff' as const, visualState: '盛放' },
];
const peak = { id: '订婚宴嫌弃', openEp: 1, peakEp: 8, peakLabel: '订婚宴嫌弃峰值', payoffEp: 8 };

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  vests: [vest],
  motifs: [motif],
  appearances,
  peaks: [peak],
  links: [{ id: 'L1', vestId: '机长马甲', motifId: 'white-rose', peakId: '订婚宴嫌弃', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateVestMotifPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestMotifPeakBridge', () => {
  it('drop=peak=motif@ep → PASS', () => {
    const r = evaluateVestMotifPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / DROP_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateVestMotifPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateVestMotifPeakBridge(
          pack({
            links: [{ id: 'L1', vestId: '机长马甲', motifId: 'white-rose', peakId: '订婚宴嫌弃', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateVestMotifPeakBridge(pack({ links: [] })))).toContain(
      'DROP_WITHOUT_BRIDGE',
    );
  });
});
