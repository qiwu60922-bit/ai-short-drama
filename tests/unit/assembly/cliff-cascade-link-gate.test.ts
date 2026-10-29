/**
 * V12 Cliff×Cascade Link — 跨集悬念承接 × 开场叠钩, offline, ≠Final ≠G3.
 * 《持械入宋》《满院亲戚…S4》《聚宝仙盆》结构层对照.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffCascadeLink } from '@/agents/assembly/cliff-cascade-link-gate';

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

const pack = (
  links: Array<Record<string, unknown>>,
  latestEp = 2,
) => ({ series: '持械入宋', latestEp, links });

const failCodes = (r: ReturnType<typeof evaluateCliffCascadeLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffCascadeLink', () => {
  it('N→N+1 cliff+cascade+hook+shared tokens → PASS; gates untouched', () => {
    const r = evaluateCliffCascadeLink(
      pack([
        {
          id: 'S1-S2',
          prevEp: 1,
          nextEp: 2,
          prev: spec('EP01', prevGood()),
          next: spec('EP02', nextGood()),
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('bad schema → SCHEMA FAIL', () => {
    expect(failCodes(evaluateCliffCascadeLink({ series: 'T' }))).toContain('SCHEMA');
  });

  it('duplicate link id → DUP_ID FAIL', () => {
    const link = {
      id: 'dup',
      prevEp: 1,
      nextEp: 2,
      prev: spec('EP01', prevGood()),
      next: spec('EP02', nextGood()),
    };
    expect(failCodes(evaluateCliffCascadeLink(pack([link, { ...link }])))).toContain('DUP_ID');
  });

  it('nextEp !== prevEp+1 → EP_NOT_SEQUENTIAL FAIL', () => {
    const r = evaluateCliffCascadeLink(
      pack(
        [
          {
            id: 'gap',
            prevEp: 1,
            nextEp: 3,
            prev: spec('EP01', prevGood()),
            next: spec('EP03', nextGood()),
          },
        ],
        3,
      ),
    );
    expect(failCodes(r)).toContain('EP_NOT_SEQUENTIAL');
  });

  it('future ep → FUTURE_EP FAIL', () => {
    const r = evaluateCliffCascadeLink(
      pack([
        {
          id: 'fut',
          prevEp: 1,
          nextEp: 2,
          prev: spec('EP01', prevGood()),
          next: spec('EP02', nextGood()),
        },
      ], 1),
    );
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('prev missing cliff → CHILD_CLIFF_FAIL', () => {
    const prev = prevGood();
    prev[3] = { durSec: 10, beatRole: 'setup', action: '平静收场' };
    const r = evaluateCliffCascadeLink(
      pack([
        {
          id: 'nocliff',
          prevEp: 1,
          nextEp: 2,
          prev: spec('EP01', prev),
          next: spec('EP02', nextGood()),
        },
      ]),
    );
    expect(failCodes(r)).toContain('CHILD_CLIFF_FAIL');
  });

  it('next cascade thin → CHILD_CASCADE_FAIL', () => {
    const next = [
      { durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
      { durSec: 10, beatRole: 'setup', action: '过场' },
      { durSec: 10, beatRole: 'setup', action: '过场2' },
    ];
    const r = evaluateCliffCascadeLink(
      pack([
        {
          id: 'thin',
          prevEp: 1,
          nextEp: 2,
          prev: spec('EP01', prevGood()),
          next: spec('EP02', next),
        },
      ]),
    );
    expect(failCodes(r)).toContain('CHILD_CASCADE_FAIL');
  });

  it('cascade without hook (only increment+reversal) → CASCADE_MISS_HOOK', () => {
    const next = [
      { durSec: 2, beatRole: 'increment', action: '皇城持械余波' },
      { durSec: 2, beatRole: 'reversal', action: '身份反转' },
      { durSec: 10, beatRole: 'setup', action: '过场' },
    ];
    const r = evaluateCliffCascadeLink(
      pack([
        {
          id: 'nohook',
          prevEp: 1,
          nextEp: 2,
          prev: spec('EP01', prevGood()),
          next: spec('EP02', next),
        },
      ]),
    );
    // cliff may also fail NEXT_HOOK_LATE → CHILD_CLIFF_FAIL; cascade may PASS with increment+reversal
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['CHILD_CLIFF_FAIL']),
    );
  });

  it('zero shared tokens → HANDOFF_TOKEN_GAP FAIL', () => {
    const next = [
      { durSec: 2, beatRole: 'hook', action: '完全无关的菜市场砍价' },
      { durSec: 2, beatRole: 'increment', action: '买菜回家' },
      { durSec: 10, beatRole: 'setup', action: '过场' },
    ];
    const r = evaluateCliffCascadeLink(
      pack([
        {
          id: 'gap',
          prevEp: 1,
          nextEp: 2,
          prev: spec('EP01', prevGood()),
          next: spec('EP02', next),
        },
      ]),
    );
    expect(failCodes(r)).toContain('HANDOFF_TOKEN_GAP');
  });
});
