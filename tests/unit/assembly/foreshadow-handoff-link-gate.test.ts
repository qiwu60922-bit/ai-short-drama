/**
 * V12 Foreshadow×CliffHandoff Link — 伏笔账本 × 悬念承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowHandoffLink } from '@/agents/assembly/foreshadow-handoff-link-gate';

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

const handoff = (id: string, prevEp: number, nextEp: number) => ({
  id,
  prevEp,
  nextEp,
  prev: spec(`EP${String(prevEp).padStart(2, '0')}`, prevGood()),
  next: spec(`EP${String(nextEp).padStart(2, '0')}`, nextGood()),
});

const fs = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: `伏笔${id}`,
  priority: 'S',
  plantEp: 1,
  status: 'closed',
  payoffEp: 10,
  ...extra,
});

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '持械入宋',
  latestEp: 12,
  foreshadows: [fs('F01')],
  handoffs: [handoff('H9-10', 9, 10)],
  links: [{ id: 'L1', foreshadowId: 'F01', handoffId: 'H9-10' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateForeshadowHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateForeshadowHandoffLink', () => {
  it('S payoff covered by handoff nextEp=payoff → PASS', () => {
    const r = evaluateForeshadowHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1, foreshadows: 1, handoffs: 1 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN', () => {
    expect(failCodes(evaluateForeshadowHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowHandoffLink(
          pack({
            links: [
              { id: 'd', foreshadowId: 'F01', handoffId: 'H9-10' },
              { id: 'd', foreshadowId: 'F01', handoffId: 'H9-10' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    const r = evaluateForeshadowHandoffLink(
      pack({
        links: [
          { id: 'a', foreshadowId: 'ghost', handoffId: 'H9-10' },
          { id: 'b', foreshadowId: 'F01', handoffId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['UNKNOWN_FORESHADOW', 'UNKNOWN_HANDOFF']),
    );
  });

  it('S/A payoff without covering handoff → PAYOFF_WITHOUT_HANDOFF', () => {
    const r = evaluateForeshadowHandoffLink(
      pack({
        handoffs: [handoff('H3-4', 3, 4)],
        links: [{ id: 'L1', foreshadowId: 'F01', handoffId: 'H3-4' }],
      }),
    );
    expect(failCodes(r)).toContain('PAYOFF_WITHOUT_HANDOFF');
  });

  it('handoff before plant → HANDOFF_OUTSIDE_PLANT_WINDOW WARN', () => {
    const r = evaluateForeshadowHandoffLink(
      pack({
        foreshadows: [fs('F01', { plantEp: 8, payoffEp: 10 })],
        handoffs: [handoff('H1-2', 1, 2)],
        links: [{ id: 'L1', foreshadowId: 'F01', handoffId: 'H1-2' }],
      }),
    );
    // also PAYOFF_WITHOUT_HANDOFF because H1-2 doesn't cover payoff 10
    expect(warnCodes(r)).toContain('HANDOFF_OUTSIDE_PLANT_WINDOW');
  });

  it('active foreshadow → PENDING_PAIR WARN, PASS', () => {
    const r = evaluateForeshadowHandoffLink(
      pack({
        foreshadows: [
          fs('F01', {
            status: 'active',
            payoffEp: undefined,
            lastAdvancedEp: 10,
            priority: 'B',
          }),
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.pending).toBe(1);
  });

  it('broken handoff child → CHILD_HANDOFF_FAIL', () => {
    const badNext = spec('EP10', [
      { durSec: 10, beatRole: 'setup', action: '软重置开场无承接' },
      { durSec: 10, beatRole: 'setup', action: '日常' },
    ]);
    const r = evaluateForeshadowHandoffLink(
      pack({
        handoffs: [
          {
            id: 'H9-10',
            prevEp: 9,
            nextEp: 10,
            prev: spec('EP09', prevGood()),
            next: badNext,
          },
        ],
      }),
    );
    expect(failCodes(r)).toContain('CHILD_HANDOFF_FAIL');
  });
});
