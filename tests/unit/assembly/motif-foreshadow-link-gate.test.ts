/**
 * V12 Motif×Foreshadow Link — 母题×伏笔联表, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifForeshadowLink } from '@/agents/assembly/motif-foreshadow-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff', visualState: '盛放' },
  ],
  items: [{ id: '机长身份', name: '机长马甲伏笔', priority: 'S', plantEp: 1, status: 'closed', payoffEp: 10, lastAdvancedEp: 5 }],
  links: [{ id: 'L1', motifId: 'white-rose', foreshadowId: '机长身份', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateMotifForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifForeshadowLink', () => {
  it('motif appearance + foreshadow payoff @ep → PASS', () => {
    const r = evaluateMotifForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateMotifForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_MOTIF');
  });
});
