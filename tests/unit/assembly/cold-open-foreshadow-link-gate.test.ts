/**
 * V12 ColdOpen×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdOpenForeshadowLink } from '@/agents/assembly/cold-open-foreshadow-link-gate';

const coldSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-B138c-0', durSec: 1.5, cast: [], beatRole: 'hook', action: '冷开危机', hookKind: 'situation' },
    { shotId: 'EP10-B138c-1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转' },
    { shotId: 'EP10-B138c-2', durSec: 3, cast: [], beatRole: 'increment', action: '加压' },
    { shotId: 'EP10-B138c-3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 10,
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec: coldSpec }],
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', coldOpenId: 'EP10-cold', foreshadowId: 'FS1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateColdOpenForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateColdOpenForeshadowLink', () => {
  it('coldOpen + foreshadow payoff → PASS', () => {
    const r = evaluateColdOpenForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_COLD_OPEN', () => {
    expect(failCodes(evaluateColdOpenForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateColdOpenForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_COLD_OPEN');
  });
});
