/**
 * V12 Frequency×Handoff Link — 第N次 tipping × 集间承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyHandoffLink } from '@/agents/assembly/frequency-handoff-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '开场' },
  { durSec: 8, beatRole: 'increment', action: '对峙' },
  { durSec: 8, beatRole: 'reversal', action: '证据甩出' },
  { durSec: 10, beatRole: 'cliffhanger', action: '门外未解' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '门外脚步' },
  { durSec: 2, beatRole: 'increment', action: '追问' },
  { durSec: 10, beatRole: 'reversal', action: '新证' },
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

const freq = {
  id: '离婚要挟',
  actor: '丈夫',
  motif: '离婚要挟',
  unit: 'count' as const,
  threshold: 99,
  plantEp: 1,
  ticks: [
    { ep: 3, n: 10 },
    { ep: 5, n: 50 },
    { ep: 8, n: 99, label: '第99次' },
  ],
  tipEp: 8,
  tipLabel: '接受第99次离婚彻底离开',
};
const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};
const pack = (extra: Record<string, unknown> = {}) => ({
  series: '轻烟染日暮',
  latestEp: 20,
  frequencies: [freq],
  handoffs: [handoff],
  links: [{ id: 'L1', frequencyId: '离婚要挟', handoffId: 'H8-9' }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateFrequencyHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyHandoffLink', () => {
  it('tip at handoff.prevEp → PASS', () => {
    const r = evaluateFrequencyHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TIP_NOT_AT_HANDOFF / HANDOFF_WITHOUT_FREQUENCY', () => {
    expect(failCodes(evaluateFrequencyHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateFrequencyHandoffLink(
          pack({ frequencies: [{ ...freq, tipEp: 5, tipLabel: '提前 tip', ticks: [{ ep: 3, n: 10 }, { ep: 5, n: 99, label: '第99次' }] }] }),
        ),
      ),
    ).toContain('TIP_NOT_AT_HANDOFF');
    expect(failCodes(evaluateFrequencyHandoffLink(pack({ links: [] })))).toContain(
      'HANDOFF_WITHOUT_FREQUENCY',
    );
  });
});
