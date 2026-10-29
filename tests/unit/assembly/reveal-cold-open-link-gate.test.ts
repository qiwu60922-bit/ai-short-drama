/**
 * V12 Reveal×ColdOpen Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateRevealColdOpenLink } from '@/agents/assembly/reveal-cold-open-link-gate';

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
  reveals: [{ id: 'R1', wearer: '江少', plantEp: 1, maintainEps: [2, 3], revealEp: 10, revealLabel: '主线揭穿' }],
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec: coldSpec }],
  links: [{ id: 'L1', revealId: 'R1', coldOpenId: 'EP10-cold', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateRevealColdOpenLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateRevealColdOpenLink', () => {
  it('reveal + coldOpen → PASS', () => {
    const r = evaluateRevealColdOpenLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / REVEAL_WITHOUT_COLD', () => {
    expect(failCodes(evaluateRevealColdOpenLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateRevealColdOpenLink(pack({ links: [] })))).toContain('REVEAL_WITHOUT_COLD');
  });
});
