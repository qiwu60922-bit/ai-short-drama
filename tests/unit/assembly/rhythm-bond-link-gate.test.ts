/**
 * V12 Rhythm×Bond Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateRhythmBondLink } from '@/agents/assembly/rhythm-bond-link-gate';

const rhythmSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-S0', durSec: 2, cast: [], beatRole: 'hook', action: '冷开危机·抛钩', hookKind: 'situation' },
    { shotId: 'EP10-S1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转·加压' },
    { shotId: 'EP10-S2', durSec: 3, cast: [], beatRole: 'increment', action: '加压·推进' },
    { shotId: 'EP10-S3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念·收束' },
  ],
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉', latestEp: 20,
  rhythms: [{ id: 'EP10-rhythm', ep: 10, shotSpec: rhythmSpec }],
  bonds: [{ id: 'B1', partyA: '苏见晴', partyB: '江少', contractEp: 1, contractLabel: '一年契约女友', upgradeEp: 10, upgradeLabel: '受伤后真情求婚' }],
  links: [{ id: 'L1', rhythmId: 'EP10-rhythm', bondId: 'B1', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateRhythmBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateRhythmBondLink', () => {
  it('rhythm + bond → PASS', () => {
    const r = evaluateRhythmBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / TERMINAL_WITHOUT_RHYTHM', () => {
    expect(failCodes(evaluateRhythmBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateRhythmBondLink(pack({ links: [] })))).toContain('TERMINAL_WITHOUT_RHYTHM');
  });
});
