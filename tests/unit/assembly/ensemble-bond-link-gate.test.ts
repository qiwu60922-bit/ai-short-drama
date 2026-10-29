/**
 * V12 Ensemble×Bond Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateEnsembleBondLink } from '@/agents/assembly/ensemble-bond-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉', latestEp: 20,
  members: [
    { id: '太奶奶', name: '顾晚晴', roleSlot: 'matriarch', functionTag: '温情重整', lookTag: '少女皮囊', voiceTag: '大佬口吻', spotlightEps: [10] },
    { id: '儿子', name: '顾成', roleSlot: 'heir', functionTag: '赡养线', lookTag: '花甲', voiceTag: '絮叨', spotlightEps: [5] },
    { id: '老三', name: '顾三', roleSlot: 'outsider', functionTag: '搅局', lookTag: '中年', voiceTag: '急促', spotlightEps: [8] },
  ],
  units: [{ id: '听证重整', ep: 10, leadIds: ['太奶奶'], supportIds: ['儿子', '老三'], warmth: false }],
  bonds: [{
    id: 'B1', partyA: '苏见晴', partyB: '傅司宴', contractEp: 1, contractLabel: '契约联姻',
    companionEps: [2, 3, 5], upgradeEp: 10, upgradeLabel: '真心升级',
  }],
  links: [{ id: 'L1', unitId: '听证重整', bondId: 'B1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateEnsembleBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateEnsembleBondLink', () => {
  it('ensemble + bond → PASS', () => {
    const r = evaluateEnsembleBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / TERMINAL_WITHOUT_UNIT', () => {
    expect(failCodes(evaluateEnsembleBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateEnsembleBondLink(pack({ links: [] })))).toContain('TERMINAL_WITHOUT_UNIT');
  });
});
