/**
 * V12 Bond×Mask×Peak Ternary — 契约×伪装×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondMaskPeakBridge } from '@/agents/assembly/bond-mask-peak-bridge-gate';

const bond = {
  id: '江少契约',
  partyA: '江少',
  partyB: '女主',
  contractEp: 1,
  contractLabel: '假面联姻',
  companionEps: [2, 3, 5],
  upgradeEp: 8,
  upgradeLabel: '真心崩塌后真情',
};

const mask = {
  id: '花心纨绔',
  wearer: '江少',
  plantEp: 1,
  maintainEps: [2, 3],
  revealEp: 8,
  revealLabel: '真心崩塌',
};

const peak = {
  id: '订婚宴嫌弃',
  openEp: 1,
  peakEp: 8,
  peakLabel: '订婚宴嫌弃峰值',
  payoffEp: 8,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  bonds: [bond],
  masks: [mask],
  peaks: [peak],
  links: [{ id: 'L1', bondId: '江少契约', maskId: '花心纨绔', peakId: '订婚宴嫌弃', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateBondMaskPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateBondMaskPeakBridge', () => {
  it('terminal=reveal=peak=ep → PASS', () => {
    const r = evaluateBondMaskPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / EP_NOT_TERNARY', () => {
    expect(failCodes(evaluateBondMaskPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateBondMaskPeakBridge(
          pack({
            links: [
              { id: 'd', bondId: '江少契约', maskId: '花心纨绔', peakId: '订婚宴嫌弃', ep: 8 },
              { id: 'd', bondId: '江少契约', maskId: '花心纨绔', peakId: '订婚宴嫌弃', ep: 8 },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateBondMaskPeakBridge(
          pack({
            links: [{ id: 'L1', bondId: 'ghost', maskId: '花心纨绔', peakId: '订婚宴嫌弃', ep: 8 }],
          }),
        ),
      ),
    ).toContain('UNKNOWN_BOND');
    expect(
      failCodes(
        evaluateBondMaskPeakBridge(
          pack({
            links: [{ id: 'L1', bondId: '江少契约', maskId: '花心纨绔', peakId: '订婚宴嫌弃', ep: 3 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
  });

  it('missing bridge', () => {
    const codes = failCodes(evaluateBondMaskPeakBridge(pack({ links: [] })));
    expect(codes).toContain('REVEAL_WITHOUT_BRIDGE');
    expect(codes).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
