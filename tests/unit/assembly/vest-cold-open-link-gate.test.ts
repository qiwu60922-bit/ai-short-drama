/**
 * V12 Vest×ColdOpen Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestColdOpenLink } from '@/agents/assembly/vest-cold-open-link-gate';

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
  vests: [{ id: 'V1', wearer: '苏见晴', vestLabel: '机长', plantEp: 1, teaseEps: [3, 5], dropEp: 10, dropLabel: '公开机长身份反击' }],
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec }],
  links: [{ id: 'L1', vestId: 'V1', coldOpenId: 'EP10-cold', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateVestColdOpenLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestColdOpenLink', () => {
  it('vest + coldOpen → PASS', () => {
    const r = evaluateVestColdOpenLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / COLD_OPEN_WITHOUT_VEST', () => {
    expect(failCodes(evaluateVestColdOpenLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateVestColdOpenLink(pack({ links: [] })))).toContain('COLD_OPEN_WITHOUT_VEST');
  });
});
