/**
 * V12 Amnesia×Mask×Peak Ternary — 失忆×伪装×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaMaskPeakBridge } from '@/agents/assembly/amnesia-mask-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
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
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 8,
    revealLabel: '真心崩塌',
  }],
  peaks: [{ id: '告白巅峰', openEp: 1, peakEp: 8, peakLabel: '摩天轮对峙', payoffEp: 8 }],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', maskId: '花心纨绔', peakId: '告白巅峰', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAmnesiaMaskPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaMaskPeakBridge', () => {
  it('recover + reveal + peak @ep → PASS', () => {
    const r = evaluateAmnesiaMaskPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAmnesiaMaskPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAmnesiaMaskPeakBridge(
          pack({
            links: [{ id: 'L1', amnesiaId: '祁南失忆', maskId: '花心纨绔', peakId: '告白巅峰', ep: 7 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateAmnesiaMaskPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
