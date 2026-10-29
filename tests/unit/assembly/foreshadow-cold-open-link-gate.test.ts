/**
 * V12 Foreshadow×ColdOpen Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowColdOpenLink } from '@/agents/assembly/foreshadow-cold-open-link-gate';

const coldSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-S0', durSec: 1.5, cast: [], beatRole: 'hook', action: '冷开危机', hookKind: 'situation' },
    { shotId: 'EP10-S1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转' },
    { shotId: 'EP10-S2', durSec: 3, cast: [], beatRole: 'increment', action: '加压' },
    { shotId: 'EP10-S3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念' },
  ],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉', latestEp: 20,
  items: [{ id: 'F1', name: '机长马甲伏笔', priority: 'S', plantEp: 1, status: 'closed', payoffEp: 10, lastAdvancedEp: 5 }],
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec: coldSpec }],
  links: [{ id: 'L1', foreshadowId: 'F1', coldOpenId: 'EP10-cold', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateForeshadowColdOpenLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowColdOpenLink', () => {
  it('foreshadow + coldOpen → PASS', () => {
    const r = evaluateForeshadowColdOpenLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_COLD', () => {
    expect(failCodes(evaluateForeshadowColdOpenLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateForeshadowColdOpenLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_COLD');
  });
});
