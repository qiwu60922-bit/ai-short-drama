/**
 * V12 Alliance×Handoff Link — 同盟 payoff × 集间悬念承接, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceHandoffLink } from '@/agents/assembly/alliance-handoff-link-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '同盟 payoff 开场' },
  { durSec: 8, beatRole: 'increment', action: '护短对峙' },
  { durSec: 8, beatRole: 'reversal', action: '证据甩出' },
  { durSec: 10, beatRole: 'cliffhanger', action: '门外有人未解' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '门外脚步未解' },
  { durSec: 2, beatRole: 'increment', action: '追问延续' },
  { durSec: 10, beatRole: 'reversal', action: '新证人' },
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

const alliance = {
  id: 'oni-fang',
  label: '鬼牙同盟',
  members: ['chen-haoyu', 'guild'],
};

const events = [
  { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留神弃少年' },
  { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩作战' },
  { allianceId: 'oni-fang', ep: 8, role: 'payoff' as const, note: '当众护短' },
];

const handoff = {
  id: 'H8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '觉醒伪神',
  latestEp: 20,
  alliances: [alliance],
  events,
  handoffs: [handoff],
  links: [{ id: 'L1', allianceId: 'oni-fang', handoffId: 'H8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAllianceHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateAllianceHandoffLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateAllianceHandoffLink', () => {
  it('handoff at payoff → PASS', () => {
    const r = evaluateAllianceHandoffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / not at payoff', () => {
    expect(failCodes(evaluateAllianceHandoffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAllianceHandoffLink(
          pack({
            links: [
              { id: 'd', allianceId: 'oni-fang', handoffId: 'H8-9' },
              { id: 'd', allianceId: 'oni-fang', handoffId: 'H8-9' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateAllianceHandoffLink(
          pack({
            handoffs: [{ ...handoff, id: 'H3-4', prevEp: 3, nextEp: 4 }],
            links: [{ id: 'L1', allianceId: 'oni-fang', handoffId: 'H3-4' }],
          }),
        ),
      ),
    ).toContain('HANDOFF_NOT_AT_PAYOFF');
  });

  it('payoff without link → PAYOFF_WITHOUT_HANDOFF', () => {
    expect(failCodes(evaluateAllianceHandoffLink(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_HANDOFF',
    );
  });

  it('orphan handoff → PENDING_HANDOFF WARN', () => {
    const r = evaluateAllianceHandoffLink(
      pack({
        handoffs: [
          handoff,
          {
            id: 'Horphan',
            prevEp: 8,
            nextEp: 9,
            prev: spec('EP08b', prevGood()),
            next: spec('EP09b', nextGood()),
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_HANDOFF');
    expect(r.verdict).toBe('PASS');
  });
});
