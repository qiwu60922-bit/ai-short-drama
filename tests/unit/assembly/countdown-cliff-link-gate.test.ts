/**
 * V12 Countdown×Cliff Link — 倒计时 × 跨集悬念叠钩, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCountdownCliffLink } from '@/agents/assembly/countdown-cliff-link-gate';

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

const cliff = (id: string, prevEp: number, nextEp: number) => ({
  id,
  prevEp,
  nextEp,
  prev: spec(`EP${String(prevEp).padStart(2, '0')}`, prevGood()),
  next: spec(`EP${String(nextEp).padStart(2, '0')}`, nextGood()),
});

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '天幕直播',
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
  cliffLinks: [cliff('C1-2', 9, 10)],
  links: [{ id: 'L1', countdownId: 'visit', cliffLinkId: 'C1-2' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCountdownCliffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateCountdownCliffLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateCountdownCliffLink', () => {
  it('deadline handoff nextEp=deadline → PASS', () => {
    const r = evaluateCountdownCliffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN', () => {
    expect(failCodes(evaluateCountdownCliffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCountdownCliffLink(
          pack({
            links: [
              { id: 'd', countdownId: 'visit', cliffLinkId: 'C1-2' },
              { id: 'd', countdownId: 'visit', cliffLinkId: 'C1-2' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    const r = evaluateCountdownCliffLink(
      pack({
        links: [
          { id: 'a', countdownId: 'ghost', cliffLinkId: 'C1-2' },
          { id: 'b', countdownId: 'visit', cliffLinkId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['UNKNOWN_COUNTDOWN', 'UNKNOWN_CLIFF_LINK']),
    );
  });

  it('cliff outside countdown window → CLIFF_OUTSIDE_WINDOW', () => {
    const r = evaluateCountdownCliffLink(
      pack({
        countdowns: [
          { id: 'visit', label: '访客时限', startEp: 5, deadlineEp: 10, status: 'met' },
        ],
        cliffLinks: [cliff('C1-2', 1, 2)],
        links: [{ id: 'L1', countdownId: 'visit', cliffLinkId: 'C1-2' }],
        latestEp: 10,
        progress: [
          { goalId: 'survive', ep: 5, advances: true },
          { goalId: 'survive', ep: 10, advances: true },
        ],
      }),
    );
    expect(failCodes(r)).toContain('CLIFF_OUTSIDE_WINDOW');
  });

  it('deadline reached but cliff not handoff → DEADLINE_WITHOUT_HANDOFF', () => {
    const r = evaluateCountdownCliffLink(
      pack({
        cliffLinks: [cliff('C1-2', 5, 6)],
        links: [{ id: 'L1', countdownId: 'visit', cliffLinkId: 'C1-2' }],
      }),
    );
    expect(failCodes(r)).toContain('DEADLINE_WITHOUT_HANDOFF');
  });

  it('open countdown inside window → PENDING_PAIR WARN', () => {
    const r = evaluateCountdownCliffLink(
      pack({
        latestEp: 6,
        countdowns: [
          { id: 'visit', label: '访客时限', startEp: 1, deadlineEp: 10, status: 'open' },
        ],
        cliffLinks: [cliff('C1-2', 5, 6)],
        links: [{ id: 'L1', countdownId: 'visit', cliffLinkId: 'C1-2' }],
        progress: [
          { goalId: 'survive', ep: 1, advances: true },
          { goalId: 'survive', ep: 6, advances: true },
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
  });
});
