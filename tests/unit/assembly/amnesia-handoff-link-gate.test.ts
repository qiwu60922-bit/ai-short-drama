/**
 * V12 Amnesia×Handoff Link — 失忆唤回 × 集间悬念承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaHandoffLink } from '@/agents/assembly/amnesia-handoff-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '唤回开场' },
  { durSec: 8, beatRole: 'increment', action: '对视蓄势' },
  { durSec: 8, beatRole: 'reversal', action: '记忆闪回' },
  { durSec: 10, beatRole: 'cliffhanger', action: '门外脚步未解' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '门外脚步未解' },
  { durSec: 2, beatRole: 'increment', action: '追问延续' },
  { durSec: 10, beatRole: 'reversal', action: '新证人' },
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

const amnesia = {
  id: '祁南失忆',
  actor: '祁南',
  plantEp: 1,
  plantCause: '爆炸',
  companionEps: [2, 4, 6],
  recoverEp: 8,
  recoverLabel: '摩天轮唤回',
  recoverTrigger: '圣诞摩天轮',
};

const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  amnesias: [amnesia],
  handoffs: [handoff],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAmnesiaHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAmnesiaHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAmnesiaHandoffLink', () => {
  it('handoff at recover → PASS', () => {
    const r = evaluateAmnesiaHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / not at recover', () => {
    expect(failCodes(evaluateAmnesiaHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAmnesiaHandoffLink(
          pack({
            links: [
              { id: 'd', amnesiaId: '祁南失忆', handoffId: 'H8-9' },
              { id: 'd', amnesiaId: '祁南失忆', handoffId: 'H8-9' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateAmnesiaHandoffLink(
          pack({
            handoffs: [{ ...handoff, id: 'H3-4', prevEp: 3, nextEp: 4 }],
            links: [{ id: 'L1', amnesiaId: '祁南失忆', handoffId: 'H3-4' }],
          }),
        ),
      ),
    ).toContain('HANDOFF_NOT_AT_RECOVER');
  });

  it('recover without link → RECOVER_WITHOUT_HANDOFF', () => {
    expect(failCodes(evaluateAmnesiaHandoffLink(pack({ links: [] })))).toContain(
      'RECOVER_WITHOUT_HANDOFF',
    );
  });

  it('orphan handoff → PENDING_HANDOFF WARN', () => {
    const r = evaluateAmnesiaHandoffLink(
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
