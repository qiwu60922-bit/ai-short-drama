/**
 * V12 Motif×Amnesia×Peak Ternary — 母题×失忆×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifAmnesiaPeakBridge } from '@/agents/assembly/motif-amnesia-peak-bridge-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  motifs: [{ id: '红伞', label: '红伞母题', kind: 'prop' as const }],
  appearances: [
    { motifId: '红伞', ep: 1, role: 'seed' as const, visualState: '收起' },
    { motifId: '红伞', ep: 4, role: 'echo' as const, visualState: '半开' },
    { motifId: '红伞', ep: 10, role: 'payoff' as const, visualState: '撑开' },
  ],
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
  links: [{ id: 'L1', motifId: '红伞', amnesiaId: '祁南失忆', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateMotifAmnesiaPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifAmnesiaPeakBridge', () => {
  it('motif@ep + recover + peak → PASS', () => {
    const r = evaluateMotifAmnesiaPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateMotifAmnesiaPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifAmnesiaPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
