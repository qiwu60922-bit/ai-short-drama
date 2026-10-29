/**
 * V12 PersonaMask×Handoff Link — 伪装揭穿 × 集间悬念承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskHandoffLink } from '@/agents/assembly/mask-handoff-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '真心崩塌开场' },
  { durSec: 8, beatRole: 'increment', action: '对峙' },
  { durSec: 8, beatRole: 'reversal', action: '证据甩出' },
  { durSec: 10, beatRole: 'cliffhanger', action: '门外有人未解' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '门外脚步未解' },
  { durSec: 2, beatRole: 'increment', action: '追问延续' },
  { durSec: 10, beatRole: 'reversal', action: '新证人' },
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

const mask = {
  id: '花心纨绔',
  wearer: '江少',
  plantEp: 1,
  maintainEps: [2, 3],
  revealEp: 8,
  revealLabel: '真心崩塌',
};

const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  masks: [mask],
  handoffs: [handoff],
  links: [{ id: 'L1', maskId: '花心纨绔', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateMaskHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateMaskHandoffLink', () => {
  it('reveal aligned with handoff → PASS', () => {
    const r = evaluateMaskHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / not at reveal', () => {
    expect(failCodes(evaluateMaskHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMaskHandoffLink(
          pack({
            links: [
              { id: 'd', maskId: '花心纨绔', handoffId: 'H8-9' },
              { id: 'd', maskId: '花心纨绔', handoffId: 'H8-9' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateMaskHandoffLink(
          pack({
            handoffs: [{ ...handoff, id: 'H3-4', prevEp: 3, nextEp: 4 }],
            links: [{ id: 'L1', maskId: '花心纨绔', handoffId: 'H3-4' }],
          }),
        ),
      ),
    ).toContain('HANDOFF_NOT_AT_REVEAL');
  });

  it('reveal without link → REVEAL_WITHOUT_HANDOFF', () => {
    expect(failCodes(evaluateMaskHandoffLink(pack({ links: [] })))).toContain(
      'REVEAL_WITHOUT_HANDOFF',
    );
  });

  it('orphan handoff → PENDING_HANDOFF WARN', () => {
    const r = evaluateMaskHandoffLink(
      pack({
        handoffs: [
          handoff,
          {
            id: 'Horphan',
            prevEp: 8,
            nextEp: 9,
            prev: spec('EP08b', prevGood()),
            next: spec('EP09b', nextGood()),
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_HANDOFF');
    expect(r.verdict).toBe('PASS');
  });
});
