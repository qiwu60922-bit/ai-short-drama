/**
 * V12 Conflict×Bond×Peak Ternary — 冲突×契约×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateConflictBondPeakBridge } from '@/agents/assembly/conflict-bond-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '叶楚出狱',
  latestEp: 20,
  conflicts: [{ id: '挑衅反噬', name: '配角挑衅', openEp: 9, payoffEp: 10 }],
  bonds: [{
    id: '机长契约',
    partyA: '苏见晴',
    partyB: '傅司宴',
    contractEp: 1,
    contractLabel: '契约联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 10,
    upgradeLabel: '真心升级',
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', conflictId: '挑衅反噬', bondId: '机长契约', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateConflictBondPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictBondPeakBridge', () => {
  it('payoff + terminal + peak @ep → PASS', () => {
    const r = evaluateConflictBondPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateConflictBondPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateConflictBondPeakBridge(
          pack({
            links: [{ id: 'L1', conflictId: '挑衅反噬', bondId: '机长契约', peakId: '对峙峰值', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateConflictBondPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
