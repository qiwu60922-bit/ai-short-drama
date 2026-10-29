/**
 * V12 Vest×Rhythm×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestRhythmForeshadowLink } from '@/agents/assembly/vest-rhythm-foreshadow-link-gate';

const shotSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-B140-0', durSec: 2, cast: [], beatRole: 'hook', action: '冷开危机·抛钩', hookKind: 'situation' },
    { shotId: 'EP10-B140-1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转·加压' },
    { shotId: 'EP10-B140-2', durSec: 3, cast: [], beatRole: 'increment', action: '加压·推进' },
    { shotId: 'EP10-B140-3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念·收束' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 10,
  vests: [{ id: 'V1', wearer: '苏见晴', vestLabel: '机长', plantEp: 1, teaseEps: [3, 5], dropEp: 10, dropLabel: '公开机长身份反击' }],
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec }],
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', vestId: 'V1', rhythmId: 'EP10-rhythm', foreshadowId: 'FS1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateVestRhythmForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestRhythmForeshadowLink', () => {
  it('vest + rhythm + foreshadow → PASS', () => {
    const r = evaluateVestRhythmForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_LINK', () => {
    expect(failCodes(evaluateVestRhythmForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateVestRhythmForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_LINK');
  });
});
