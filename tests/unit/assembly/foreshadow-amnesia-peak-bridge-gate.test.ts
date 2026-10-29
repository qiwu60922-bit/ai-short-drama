/**
 * V12 Foreshadow×Amnesia×Peak Ternary — 伏笔×失忆×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowAmnesiaPeakBridge } from '@/agents/assembly/foreshadow-amnesia-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '帐中香',
  latestEp: 20,
  items: [{
    id: '机长身份',
    name: '机长马甲伏笔',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 5,
  }],
  amnesias: [{
    id: '祁南失忆',
    actor: '祁南',
    plantEp: 1,
    plantCause: '爆炸',
    companionEps: [2, 4, 6],
    recoverEp: 10,
    recoverLabel: '摩天轮唤回',
    recoverTrigger: '圣诞摩天轮',
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', foreshadowId: '机长身份', amnesiaId: '祁南失忆', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowAmnesiaPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowAmnesiaPeakBridge', () => {
  it('payoff + recover + peak @ep → PASS', () => {
    const r = evaluateForeshadowAmnesiaPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateForeshadowAmnesiaPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowAmnesiaPeakBridge(
          pack({
            links: [{ id: 'L1', foreshadowId: '机长身份', amnesiaId: '祁南失忆', peakId: '对峙峰值', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateForeshadowAmnesiaPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
