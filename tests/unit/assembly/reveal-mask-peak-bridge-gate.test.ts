/**
 * V12 Reveal×Mask×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateRevealMaskPeakBridge } from '@/agents/assembly/reveal-mask-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  reveals: [{ id: 'R1', wearer: '江少', plantEp: 1, maintainEps: [2, 3], revealEp: 10, revealLabel: '主线揭穿' }],
  masks: [{ id: 'M1', wearer: '江少', plantEp: 1, maintainEps: [2, 3], revealEp: 10, revealLabel: '并行伪装崩' }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', revealId: 'R1', maskId: 'M1', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateRevealMaskPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateRevealMaskPeakBridge', () => {
  it('reveal + mask + peak → PASS', () => {
    const r = evaluateRevealMaskPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateRevealMaskPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateRevealMaskPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
