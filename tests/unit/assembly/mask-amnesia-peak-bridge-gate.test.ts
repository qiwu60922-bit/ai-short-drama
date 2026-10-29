/**
 * V12 Mask×Amnesia×Peak Ternary — 伪装揭穿×失忆唤回×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskAmnesiaPeakBridge } from '@/agents/assembly/mask-amnesia-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 8,
    revealLabel: '真心崩塌',
  }],
  amnesias: [{
    id: '祁南失忆',
    actor: '祁南',
    plantEp: 1,
    plantCause: '爆炸',
    companionEps: [2, 4, 6],
    recoverEp: 8,
    recoverLabel: '摩天轮唤回',
    recoverTrigger: '圣诞摩天轮',
  }],
  peaks: [{ id: '告白巅峰', openEp: 1, peakEp: 8, peakLabel: '摩天轮对峙', payoffEp: 8 }],
  links: [{ id: 'L1', maskId: '花心纨绔', amnesiaId: '祁南失忆', peakId: '告白巅峰', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskAmnesiaPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskAmnesiaPeakBridge', () => {
  it('reveal + recover + peak @ep → PASS', () => {
    const r = evaluateMaskAmnesiaPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / REVEAL_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateMaskAmnesiaPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMaskAmnesiaPeakBridge(pack({ links: [] })))).toContain('REVEAL_WITHOUT_BRIDGE');
  });
});
