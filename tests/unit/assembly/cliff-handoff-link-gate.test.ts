/**
 * V12 CliffCascade×Handoff Link — 开场叠钩联表 × 悬念承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffHandoffLink } from '@/agents/assembly/cliff-handoff-link-gate';

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

const pair = (id: string, prevEp: number, nextEp: number) => ({
  id,
  prevEp,
  nextEp,
  prev: spec(`EP${String(prevEp).padStart(2, '0')}`, prevGood()),
  next: spec(`EP${String(nextEp).padStart(2, '0')}`, nextGood()),
});

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '持械入宋',
  latestEp: 10,
  cliffLinks: [pair('C9-10', 9, 10)],
  handoffs: [pair('H9-10', 9, 10)],
  links: [{ id: 'L1', cliffLinkId: 'C9-10', handoffId: 'H9-10' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCliffHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateCliffHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateCliffHandoffLink', () => {
  it('same-window cliff + handoff → PASS', () => {
    const r = evaluateCliffHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN', () => {
    expect(failCodes(evaluateCliffHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateCliffHandoffLink(
          pack({
            links: [
              { id: 'd', cliffLinkId: 'C9-10', handoffId: 'H9-10' },
              { id: 'd', cliffLinkId: 'C9-10', handoffId: 'H9-10' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    const r = evaluateCliffHandoffLink(
      pack({
        links: [
          { id: 'a', cliffLinkId: 'ghost', handoffId: 'H9-10' },
          { id: 'b', cliffLinkId: 'C9-10', handoffId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_CLIFF', 'UNKNOWN_HANDOFF']));
  });

  it('window mismatch → EP_WINDOW_MISMATCH', () => {
    expect(
      failCodes(
        evaluateCliffHandoffLink(
          pack({
            handoffs: [pair('H3-4', 3, 4)],
            links: [{ id: 'L1', cliffLinkId: 'C9-10', handoffId: 'H3-4' }],
          }),
        ),
      ),
    ).toContain('EP_WINDOW_MISMATCH');
  });

  it('unpaired cliff → CASCADE_WITHOUT_PAIR', () => {
    expect(
      failCodes(
        evaluateCliffHandoffLink(
          pack({
            links: [],
            handoffs: [],
          }),
        ),
      ),
    ).toContain('CASCADE_WITHOUT_PAIR');
  });

  it('orphan handoff → PENDING_PAIR WARN', () => {
    const r = evaluateCliffHandoffLink(
      pack({
        handoffs: [pair('H9-10', 9, 10), pair('H7-8', 7, 8)],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.verdict).toBe('PASS');
  });
});
