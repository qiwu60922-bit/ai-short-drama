/**
 * V12 Ensemble×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateEnsembleForeshadowLink } from '@/agents/assembly/ensemble-foreshadow-link-gate';

const members = [
  { id: '太奶奶', name: '顾晚晴', roleSlot: 'matriarch' as const, functionTag: '穿越太奶奶温情重整', lookTag: '十八岁少女皮囊', voiceTag: '科学院大佬口吻', spotlightEps: [10] },
  { id: '七十岁儿子', name: '顾成', roleSlot: 'heir' as const, functionTag: '老年儿子赡养线', lookTag: '花甲老人', voiceTag: '无奈絮叨', spotlightEps: [5] },
  { id: '老三', name: '顾老三', roleSlot: 'grandchild' as const, functionTag: '创伤后失智恢复单元', lookTag: '痴呆傻笑', voiceTag: '童声残留', spotlightEps: [10] },
];
const units = [
  { id: '听证重整', ep: 10, leadIds: ['太奶奶'], supportIds: ['七十岁儿子', '老三'], warmth: false },
];

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '太奶奶3',
  latestEp: 10,
  members,
  units,
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', unitId: '听证重整', foreshadowId: 'FS1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateEnsembleForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateEnsembleForeshadowLink', () => {
  it('unit + foreshadow payoff → PASS', () => {
    const r = evaluateEnsembleForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_UNIT', () => {
    expect(failCodes(evaluateEnsembleForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateEnsembleForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_UNIT');
  });
});
