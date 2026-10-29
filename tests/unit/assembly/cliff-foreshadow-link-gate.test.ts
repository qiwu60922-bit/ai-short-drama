/**
 * V12 Cliff×Foreshadow Link — 叠钩×伏笔, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffForeshadowLink } from '@/agents/assembly/cliff-foreshadow-link-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
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
  series: '伪人降临',
  latestEp: 20,
  cliffLinks: [{
    id: 'C9-10',
    prevEp: 9,
    nextEp: 10,
    prev: spec('EP09', prevGood()),
    next: spec('EP10', nextGood()),
  }],
  items: [{
    id: '伪人身份',
    name: '预言家真伪',
    priority: 'S' as const,
    plantEp: 1,
    status: 'closed' as const,
    payoffEp: 10,
    lastAdvancedEp: 4,
  }],
  links: [{ id: 'L1', cliffLinkId: 'C9-10', foreshadowId: '伪人身份', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateCliffForeshadowLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffForeshadowLink', () => {
  it('cliff next = payoff → PASS', () => {
    const r = evaluateCliffForeshadowLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / CLIFF_WITHOUT_FORESHADOW', () => {
    expect(failCodes(evaluateCliffForeshadowLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateCliffForeshadowLink(pack({ links: [] })))).toContain('CLIFF_WITHOUT_FORESHADOW');
  });
});
