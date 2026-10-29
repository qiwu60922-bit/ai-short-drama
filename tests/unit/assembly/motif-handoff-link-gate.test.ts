/**
 * V12 Motif×Handoff Link — 母题×集间承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMotifHandoffLink } from '@/agents/assembly/motif-handoff-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '开场' },
  { durSec: 8, beatRole: 'increment', action: '追问' },
  { durSec: 8, beatRole: 'reversal', action: '反转' },
  { durSec: 10, beatRole: 'cliffhanger', action: '悬念' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '承接' },
  { durSec: 2, beatRole: 'increment', action: '追问' },
  { durSec: 10, beatRole: 'reversal', action: '新证' },
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

const motif = { id: 'white-rose', label: '白玫瑰', kind: 'prop' as const };
const appearances = [
  { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
  { motifId: 'white-rose', ep: 8, role: 'echo' as const, visualState: '半开' },
  { motifId: 'white-rose', ep: 20, role: 'payoff' as const, visualState: '盛放' },
];
const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  motifs: [motif],
  appearances,
  handoffs: [handoff],
  links: [{ id: 'L1', motifId: 'white-rose', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMotifHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMotifHandoffLink', () => {
  it('appearance at handoff.prevEp → PASS', () => {
    const r = evaluateMotifHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / NO_MOTIF_AT_HANDOFF / HANDOFF_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateMotifHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMotifHandoffLink(
          pack({
            handoffs: [{ ...handoff, prevEp: 7, nextEp: 8 }],
          }),
        ),
      ),
    ).toContain('NO_MOTIF_AT_HANDOFF');
    expect(failCodes(evaluateMotifHandoffLink(pack({ links: [] })))).toContain(
      'HANDOFF_WITHOUT_MOTIF',
    );
  });
});
