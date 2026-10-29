/**
 * V12 Foreshadow×Mask×Peak Ternary — 伏笔×伪装×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowMaskPeakBridge } from '@/agents/assembly/foreshadow-mask-peak-bridge-gate';

const item = {
  id: '伪人身份',
  name: '预言家真伪',
  priority: 'S' as const,
  plantEp: 1,
  status: 'closed' as const,
  payoffEp: 8,
  lastAdvancedEp: 4,
};
const mask = {
  id: '预言家伪装',
  wearer: 'linyang',
  plantEp: 1,
  maintainEps: [2, 3],
  revealEp: 8,
  revealLabel: '揭伪人',
};
const peak = {
  id: '身份对峙',
  openEp: 1,
  peakEp: 8,
  peakLabel: '揭伪人对峙',
  payoffEp: 8,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '伪人降临',
  latestEp: 20,
  items: [item],
  masks: [mask],
  peaks: [peak],
  links: [{ id: 'L1', foreshadowId: '伪人身份', maskId: '预言家伪装', peakId: '身份对峙', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowMaskPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowMaskPeakBridge', () => {
  it('payoff=reveal=peak=ep → PASS', () => {
    const r = evaluateForeshadowMaskPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / EP_NOT_TERNARY', () => {
    expect(failCodes(evaluateForeshadowMaskPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowMaskPeakBridge(
          pack({
            links: [
              { id: 'd', foreshadowId: '伪人身份', maskId: '预言家伪装', peakId: '身份对峙', ep: 8 },
              { id: 'd', foreshadowId: '伪人身份', maskId: '预言家伪装', peakId: '身份对峙', ep: 8 },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateForeshadowMaskPeakBridge(
          pack({
            links: [{ id: 'L1', foreshadowId: '伪人身份', maskId: '预言家伪装', peakId: '身份对峙', ep: 3 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
  });

  it('missing bridge', () => {
    const codes = failCodes(evaluateForeshadowMaskPeakBridge(pack({ links: [] })));
    expect(codes).toContain('PAYOFF_WITHOUT_BRIDGE');
    expect(codes).toContain('REVEAL_WITHOUT_BRIDGE');
    expect(codes).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
