/**
 * V12 Ensemble×Mask Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateEnsembleMaskLink } from '@/agents/assembly/ensemble-mask-link-gate';

const members = [
  { id: '太奶奶-b142', name: '顾晚晴', roleSlot: 'matriarch', functionTag: '穿越太奶奶温情重整-b142', lookTag: '十八岁少女皮囊-b142', voiceTag: '科学院大佬口吻-b142', spotlightEps: [10] },
  { id: '七十岁儿子-b142', name: '顾成', roleSlot: 'heir', functionTag: '老年儿子赡养线-b142', lookTag: '花甲老人-b142', voiceTag: '无奈絮叨-b142', spotlightEps: [5] },
  { id: '老三-b142', name: '顾老三', roleSlot: 'grandchild', functionTag: '创伤后失智恢复单元-b142', lookTag: '痴呆傻笑-b142', voiceTag: '童声残留-b142', spotlightEps: [10] },
];
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉', latestEp: 20,
  members,
  units: [{ id: '听证重整-b142', ep: 10, leadIds: ['太奶奶-b142'], supportIds: ['七十岁儿子-b142', '老三-b142'], warmth: false }],
  masks: [{ id: 'M1', wearer: '江少', plantEp: 1, maintainEps: [2, 3], revealEp: 10, revealLabel: '并行伪装崩' }],
  links: [{ id: 'L1', unitId: '听证重整-b142', maskId: 'M1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateEnsembleMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateEnsembleMaskLink', () => {
  it('ensemble + mask → PASS', () => {
    const r = evaluateEnsembleMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / REVEAL_WITHOUT_UNIT', () => {
    expect(failCodes(evaluateEnsembleMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateEnsembleMaskLink(pack({ links: [] })))).toContain('REVEAL_WITHOUT_UNIT');
  });
});
