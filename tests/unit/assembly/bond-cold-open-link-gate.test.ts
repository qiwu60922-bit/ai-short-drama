/**
 * V12 Bond×ColdOpen Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondColdOpenLink } from '@/agents/assembly/bond-cold-open-link-gate';

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
  bonds: [{
    id: 'B1', partyA: '苏见晴', partyB: '傅司宴', contractEp: 1, contractLabel: '契约联姻',
    companionEps: [2, 3, 5], upgradeEp: 10, upgradeLabel: '真心升级',
  }],
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec: coldSpec }],
  links: [{ id: 'L1', bondId: 'B1', coldOpenId: 'EP10-cold', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateBondColdOpenLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateBondColdOpenLink', () => {
  it('bond + coldOpen → PASS', () => {
    const r = evaluateBondColdOpenLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / TERMINAL_WITHOUT_COLD', () => {
    expect(failCodes(evaluateBondColdOpenLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateBondColdOpenLink(pack({ links: [] })))).toContain('TERMINAL_WITHOUT_COLD');
  });
});
