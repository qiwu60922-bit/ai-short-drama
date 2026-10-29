/**
 * V12 Cliff×Vest Link — 马甲掉落×跨集悬念, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffVestLink } from '@/agents/assembly/cliff-vest-link-gate';

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

const vest = {
  id: '机长马甲',
  wearer: '苏见晴',
  vestLabel: '机长',
  plantEp: 1,
  teaseEps: [3, 5],
  dropEp: 10,
  dropLabel: '公开机长身份反击',
};
const cliff = {
  id: 'C9-10',
  prevEp: 9,
  nextEp: 10,
  prev: spec('EP09', prevGood()),
  next: spec('EP10', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  vests: [vest],
  cliffLinks: [cliff],
  links: [{ id: 'L1', vestId: '机长马甲', cliffLinkId: 'C9-10', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCliffVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffVestLink', () => {
  it('drop at nextEp → PASS', () => {
    const r = evaluateCliffVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_DROP_NEXT / CLIFF_WITHOUT_VEST', () => {
    expect(failCodes(evaluateCliffVestLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCliffVestLink(
          pack({
            links: [{ id: 'L1', vestId: '机长马甲', cliffLinkId: 'C9-10', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_DROP_NEXT');
    expect(failCodes(evaluateCliffVestLink(pack({ links: [] })))).toContain('CLIFF_WITHOUT_VEST');
  });
});
