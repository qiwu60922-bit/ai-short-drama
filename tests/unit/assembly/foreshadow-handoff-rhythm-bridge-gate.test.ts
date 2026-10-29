/**
 * V12 Foreshadow×Handoff×Rhythm Ternary — 伏笔×承接×节奏, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowHandoffRhythmBridge } from '@/agents/assembly/foreshadow-handoff-rhythm-bridge-gate';

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
const denseSpec = (episode: string) => ({
  episode,
  shots: Array.from({ length: 18 }, (_, i) => ({
    shotId: `${episode}-S${i}`,
    cast: [] as string[],
    durSec: 2,
    action: 'x·y',
  })),
});

const item = {
  id: '伪人身份',
  name: '预言家真伪',
  priority: 'S' as const,
  plantEp: 1,
  status: 'closed' as const,
  payoffEp: 8,
  lastAdvancedEp: 4,
};
const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '持械入宋',
  latestEp: 20,
  profile: 'dense' as const,
  items: [item],
  handoffs: [handoff],
  links: [
    {
      id: 'L1',
      foreshadowId: '伪人身份',
      handoffId: 'H8-9',
      ep: 8,
      shotSpec: denseSpec('EP08'),
      profile: 'dense' as const,
    },
  ],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowHandoffRhythmBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateForeshadowHandoffRhythmBridge', () => {
  it('payoff + handoff + dense rhythm → PASS', () => {
    const r = evaluateForeshadowHandoffRhythmBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / NO_FORESHADOW_AT_EP / HANDOFF_NOT_AT_EP', () => {
    expect(failCodes(evaluateForeshadowHandoffRhythmBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateForeshadowHandoffRhythmBridge(
          pack({
            links: [
              {
                id: 'L1',
                foreshadowId: '伪人身份',
                handoffId: 'H8-9',
                ep: 3,
                shotSpec: denseSpec('EP03'),
              },
            ],
          }),
        ),
      ),
    ).toContain('NO_FORESHADOW_AT_EP');
    expect(
      failCodes(
        evaluateForeshadowHandoffRhythmBridge(
          pack({
            handoffs: [{ ...handoff, id: 'H2-3', prevEp: 2, nextEp: 3 }],
            links: [
              {
                id: 'L1',
                foreshadowId: '伪人身份',
                handoffId: 'H2-3',
                ep: 8,
                shotSpec: denseSpec('EP08'),
              },
            ],
          }),
        ),
      ),
    ).toContain('HANDOFF_NOT_AT_EP');
  });
});
