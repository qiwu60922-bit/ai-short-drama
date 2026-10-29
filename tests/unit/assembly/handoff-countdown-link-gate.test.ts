/**
 * V12 Handoff×Countdown Link — cliffhanger handoff × 阶段倒计时, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffCountdownLink } from '@/agents/assembly/handoff-countdown-link-gate';

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

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '持械入宋',
  seasonId: 'S1',
  latestEp: 10,
  goals: [
    {
      id: 'survive',
      label: '撑过访客时限',
      destination: '时限清零前撤离',
      startEp: 1,
      dueEp: 20,
      status: 'open',
    },
  ],
  progress: [
    { goalId: 'survive', ep: 1, advances: true },
    { goalId: 'survive', ep: 5, advances: true },
    { goalId: 'survive', ep: 10, advances: true },
  ],
  countdowns: [
    { id: 'visit', label: '访客时限', startEp: 1, deadlineEp: 10, status: 'met' },
  ],
  handoffs: [handoff('H9-10', 9, 10)],
  links: [{ id: 'L1', countdownId: 'visit', handoffId: 'H9-10' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateHandoffCountdownLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateHandoffCountdownLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateHandoffCountdownLink', () => {
  it('deadline handoff nextEp=deadline → PASS', () => {
    const r = evaluateHandoffCountdownLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN', () => {
    expect(failCodes(evaluateHandoffCountdownLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateHandoffCountdownLink(
          pack({
            links: [
              { id: 'd', countdownId: 'visit', handoffId: 'H9-10' },
              { id: 'd', countdownId: 'visit', handoffId: 'H9-10' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    const r = evaluateHandoffCountdownLink(
      pack({
        links: [
          { id: 'a', countdownId: 'ghost', handoffId: 'H9-10' },
          { id: 'b', countdownId: 'visit', handoffId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['UNKNOWN_COUNTDOWN', 'UNKNOWN_HANDOFF']),
    );
  });

  it('handoff outside countdown window → HANDOFF_OUTSIDE_WINDOW', () => {
    const r = evaluateHandoffCountdownLink(
      pack({
        countdowns: [
          { id: 'visit', label: '访客时限', startEp: 5, deadlineEp: 10, status: 'met' },
        ],
        handoffs: [handoff('H1-2', 1, 2)],
        links: [{ id: 'L1', countdownId: 'visit', handoffId: 'H1-2' }],
        progress: [
          { goalId: 'survive', ep: 5, advances: true },
          { goalId: 'survive', ep: 10, advances: true },
        ],
      }),
    );
    expect(failCodes(r)).toContain('HANDOFF_OUTSIDE_WINDOW');
  });

  it('deadline reached but handoff not at edge → DEADLINE_WITHOUT_HANDOFF', () => {
    const r = evaluateHandoffCountdownLink(
      pack({
        handoffs: [handoff('H3-4', 3, 4)],
        links: [{ id: 'L1', countdownId: 'visit', handoffId: 'H3-4' }],
      }),
    );
    expect(failCodes(r)).toContain('DEADLINE_WITHOUT_HANDOFF');
  });

  it('open countdown → PENDING_PAIR WARN PASS', () => {
    const r = evaluateHandoffCountdownLink(
      pack({
        latestEp: 5,
        countdowns: [
          { id: 'visit', label: '访客时限', startEp: 1, deadlineEp: 10, status: 'open' },
        ],
        handoffs: [handoff('H4-5', 4, 5)],
        links: [{ id: 'L1', countdownId: 'visit', handoffId: 'H4-5' }],
        progress: [
          { goalId: 'survive', ep: 1, advances: true },
          { goalId: 'survive', ep: 5, advances: true },
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
  });
});
