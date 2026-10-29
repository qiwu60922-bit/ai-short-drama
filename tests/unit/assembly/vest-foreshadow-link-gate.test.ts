/**
 * V12 Vest×Foreshadow Link — 马甲×伏笔, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestForeshadowLink } from '@/agents/assembly/vest-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  vests: [{ id: '机长马甲', wearer: '苏见晴', vestLabel: '机长', plantEp: 1, teaseEps: [3, 5], dropEp: 10, dropLabel: '公开机长身份反击' }],
  items: [{ id: '伪人身份', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', vestId: '机长马甲', foreshadowId: '伪人身份', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateVestForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestForeshadowLink', () => {
  it('drop + payoff @ep → PASS', () => {
    const r = evaluateVestForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / DROP_WITHOUT_FORESHADOW', () => {
    expect(failCodes(evaluateVestForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateVestForeshadowLink(pack({ links: [] })))).toContain('DROP_WITHOUT_FORESHADOW');
  });
});
