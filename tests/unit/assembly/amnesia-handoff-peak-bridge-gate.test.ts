/**
 * V12 Amnesia×Handoff×Peak Ternary — 失忆×承接×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaHandoffPeakBridge } from '@/agents/assembly/amnesia-handoff-peak-bridge-gate';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
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

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  handoffs: [{
    id: 'H10-11',
    prevEp: 10,
    nextEp: 11,
    prev: spec('EP10', prevGood()),
    next: spec('EP11', nextGood()),
  }],
  amnesias: [{
    id: '祁南失忆',
    actor: '祁南',
    plantEp: 1,
    plantCause: '爆炸',
    companionEps: [2, 4, 6],
    recoverEp: 10,
    recoverLabel: '摩天轮唤回',
    recoverTrigger: '圣诞摩天轮',
  }],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', handoffId: 'H10-11', amnesiaId: '祁南失忆', peakId: '对峙峰值', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateAmnesiaHandoffPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaHandoffPeakBridge', () => {
  it('recover = prevEp = peak → PASS', () => {
    const r = evaluateAmnesiaHandoffPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateAmnesiaHandoffPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAmnesiaHandoffPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
