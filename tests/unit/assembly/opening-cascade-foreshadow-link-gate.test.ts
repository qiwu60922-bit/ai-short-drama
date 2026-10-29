/**
 * V12 OpeningCascade×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateOpeningCascadeForeshadowLink } from '@/agents/assembly/opening-cascade-foreshadow-link-gate';

const cascadeShot = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-0', durSec: 2, cast: [], beatRole: 'hook', action: '冷开危机', hookKind: 'situation' },
    { shotId: 'EP10-1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转' },
    { shotId: 'EP10-2', durSec: 3, cast: [], beatRole: 'increment', action: '加压' },
    { shotId: 'EP10-3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '密爽向',
  latestEp: 20,
  cascades: [{ id: 'C10', ep: 10, shotSpec: cascadeShot }],
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', cascadeId: 'C10', foreshadowId: 'FS1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateOpeningCascadeForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateOpeningCascadeForeshadowLink', () => {
  it('cascade + foreshadow payoff → PASS', () => {
    const r = evaluateOpeningCascadeForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_CASCADE', () => {
    expect(failCodes(evaluateOpeningCascadeForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateOpeningCascadeForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_CASCADE');
  });
});
