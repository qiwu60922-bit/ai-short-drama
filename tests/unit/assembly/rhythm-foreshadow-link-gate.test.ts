/**
 * V12 Rhythm×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateRhythmForeshadowLink } from '@/agents/assembly/rhythm-foreshadow-link-gate';

const shotSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-B138-0', durSec: 2, cast: [], beatRole: 'hook', action: '冷开危机·抛钩', hookKind: 'situation' },
    { shotId: 'EP10-B138-1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转·加压' },
    { shotId: 'EP10-B138-2', durSec: 3, cast: [], beatRole: 'increment', action: '加压·推进' },
    { shotId: 'EP10-B138-3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念·收束' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
  latestEp: 10,
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec }],
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', rhythmId: 'EP10-rhythm', foreshadowId: 'FS1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateRhythmForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateRhythmForeshadowLink', () => {
  it('rhythm + foreshadow payoff → PASS', () => {
    const r = evaluateRhythmForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_RHYTHM', () => {
    expect(failCodes(evaluateRhythmForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateRhythmForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_RHYTHM');
  });
});
