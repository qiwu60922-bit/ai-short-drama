/**
 * V12 Motif×Rhythm×Foreshadow Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifRhythmForeshadowLink } from '@/agents/assembly/motif-rhythm-foreshadow-link-gate';

const shotSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-B139-0', durSec: 2, cast: [], beatRole: 'hook', action: '冷开危机·抛钩', hookKind: 'situation' },
    { shotId: 'EP10-B139-1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转·加压' },
    { shotId: 'EP10-B139-2', durSec: 3, cast: [], beatRole: 'increment', action: '加压·推进' },
    { shotId: 'EP10-B139-3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念·收束' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 10,
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' as const }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
    { motifId: 'white-rose', ep: 5, role: 'echo' as const, visualState: '半开' },
    { motifId: 'white-rose', ep: 10, role: 'payoff' as const, visualState: '盛放' },
  ],
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec }],
  items: [{ id: 'FS1', name: '预言家真伪', priority: 'S' as const, plantEp: 1, status: 'closed' as const, payoffEp: 10, lastAdvancedEp: 4 }],
  links: [{ id: 'L1', motifId: 'white-rose', rhythmId: 'EP10-rhythm', foreshadowId: 'FS1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateMotifRhythmForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifRhythmForeshadowLink', () => {
  it('motif + rhythm + foreshadow → PASS', () => {
    const r = evaluateMotifRhythmForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PAYOFF_WITHOUT_LINK', () => {
    expect(failCodes(evaluateMotifRhythmForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMotifRhythmForeshadowLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_LINK');
  });
});
