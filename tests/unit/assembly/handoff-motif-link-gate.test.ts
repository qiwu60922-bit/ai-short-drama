/**
 * V12 Handoff×Motif Link — 承接×母题, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffMotifLink } from '@/agents/assembly/handoff-motif-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '危机开场' },
  { durSec: 8, beatRole: 'increment', action: '追查线索' },
  { durSec: 8, beatRole: 'reversal', action: '身份暴露' },
  { durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
  { durSec: 2, beatRole: 'increment', action: '追兵逼近' },
  { durSec: 10, beatRole: 'reversal', action: '旧友现身' },
  { durSec: 8, beatRole: 'cliffhanger', action: '下一场更大危机' },
];

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  handoffs: [{
    id: 'H9-10',
    prevEp: 9,
    nextEp: 10,
    prev: spec('EP09', prevGood()),
    next: spec('EP10', nextGood()),
  }],
  motifs: [{ id: 'white-rose', label: '白玫瑰', kind: 'prop' as const }],
  appearances: [
    { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
    { motifId: 'white-rose', ep: 9, role: 'echo' as const, visualState: '半开' },
    { motifId: 'white-rose', ep: 20, role: 'payoff' as const, visualState: '盛放' },
  ],
  links: [{ id: 'L1', handoffId: 'H9-10', motifId: 'white-rose' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateHandoffMotifLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHandoffMotifLink', () => {
  it('motif @ prevEp → PASS', () => {
    const r = evaluateHandoffMotifLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / NO_MOTIF_AT_HANDOFF / HANDOFF_WITHOUT_MOTIF', () => {
    expect(failCodes(evaluateHandoffMotifLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateHandoffMotifLink(
          pack({
            appearances: [{ motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' }],
          }),
        ),
      ),
    ).toContain('NO_MOTIF_AT_HANDOFF');
    expect(failCodes(evaluateHandoffMotifLink(pack({ links: [] })))).toContain(
      'HANDOFF_WITHOUT_MOTIF',
    );
  });
});
