/**
 * V12 Ensemble×Persona×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateEnsemblePersonaPeakBridge } from '@/agents/assembly/ensemble-persona-peak-bridge-gate';
import fixture from '../../fixtures/v13/story-ledger-suite.v13.json';

const pack = (extra: Record<string, unknown> = {}) => {
  const card = (fixture as any).countdownPersonaPeakBridge.cards[0];
  return {
    series: '穿越太奶奶',
    latestEp: 20,
    cards: [card],
    members: [
    { id: '太奶奶', name: '顾晚晴', roleSlot: 'matriarch', functionTag: '穿越太奶奶温情重整', lookTag: '十八岁少女皮囊', voiceTag: '科学院大佬口吻', spotlightEps: [10] },
    { id: '七十岁儿子', name: '顾成', roleSlot: 'heir', functionTag: '老年儿子赡养线', lookTag: '花甲老人', voiceTag: '无奈絮叨', spotlightEps: [5] },
    { id: '老三', name: '顾老三', roleSlot: 'grandchild', functionTag: '创伤后失智恢复单元', lookTag: '痴呆傻笑', voiceTag: '童声残留', spotlightEps: [10] },
  ],
    units: [{ id: 'U1', ep: 10, leadIds: ['太奶奶'], supportIds: ['七十岁儿子', '老三'], warmth: false }],
    peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
    links: [{ id: 'L1', cardSlug: card.slug, unitId: 'U1', peakId: '对峙峰值', ep: 10 }],
    ...extra,
  };
};
const failCodes = (r: ReturnType<typeof evaluateEnsemblePersonaPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateEnsemblePersonaPeakBridge', () => {
  it('persona + ensemble + peak → PASS', () => {
    const r = evaluateEnsemblePersonaPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateEnsemblePersonaPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateEnsemblePersonaPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
