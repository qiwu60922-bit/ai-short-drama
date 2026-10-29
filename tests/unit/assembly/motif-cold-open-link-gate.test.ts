/**
 * V12 Motif×ColdOpen Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifColdOpenLink } from '@/agents/assembly/motif-cold-open-link-gate';

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
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff', visualState: '盛放' },
  ],
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec: coldSpec }],
  links: [{ id: 'L1', motifId: 'white-rose', coldOpenId: 'EP10-cold', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateMotifColdOpenLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifColdOpenLink', () => {
  it('motif + coldOpen → PASS', () => {
    const r = evaluateMotifColdOpenLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / MOTIF_WITHOUT_COLD', () => {
    expect(failCodes(evaluateMotifColdOpenLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifColdOpenLink(pack({ links: [] })))).toContain('MOTIF_WITHOUT_COLD');
  });
});
