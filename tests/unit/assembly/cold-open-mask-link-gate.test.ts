/**
 * V12 ColdOpen×Mask Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateColdOpenMaskLink } from '@/agents/assembly/cold-open-mask-link-gate';

const shotSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-B141-0', durSec: 2, cast: [], beatRole: 'hook', action: '冷开危机·抛钩', hookKind: 'situation' },
    { shotId: 'EP10-B141-1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转·加压' },
    { shotId: 'EP10-B141-2', durSec: 3, cast: [], beatRole: 'increment', action: '加压·推进' },
    { shotId: 'EP10-B141-3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念·收束' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec }],
  masks: [{ id: 'M1', wearer: '江少', plantEp: 1, maintainEps: [2, 3], revealEp: 10, revealLabel: '真心崩塌' }],
  links: [{ id: 'L1', coldOpenId: 'EP10-cold', maskId: 'M1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateColdOpenMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateColdOpenMaskLink', () => {
  it('coldOpen + mask → PASS', () => {
    const r = evaluateColdOpenMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / COLD_OPEN_WITHOUT_MASK', () => {
    expect(failCodes(evaluateColdOpenMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateColdOpenMaskLink(pack({ links: [] })))).toContain('COLD_OPEN_WITHOUT_MASK');
  });
});
