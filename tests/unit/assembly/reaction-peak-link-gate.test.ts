/**
 * V12 Reaction × Peak Link — 反应镜 × 巅峰后再兑现, offline, ≠Final ≠G3.
 * 《天幕直播》《卖掉养老房那天…》《婆婆装瘫七年…》结构层对照.
 */
import { describe, expect, it } from 'vitest';
import { evaluateReactionPeakLink } from '@/agents/assembly/reaction-peak-link-gate';

type S = { durSec: number; beatRole?: string };
const shotSpec = (shots: S[], episode = 'E8') => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `S${i}`, cast: [], ...s })),
});

const withReaction = shotSpec([
  { durSec: 3, beatRole: 'hook' },
  { durSec: 6, beatRole: 'setup' },
  { durSec: 6, beatRole: 'reversal' },
  { durSec: 3, beatRole: 'reaction' },
  { durSec: 4, beatRole: 'cliffhanger' },
  { durSec: 2, beatRole: 'reaction' },
]);

const noReaction = shotSpec([
  { durSec: 3, beatRole: 'hook' },
  { durSec: 10, beatRole: 'reversal' },
  { durSec: 6, beatRole: 'setup' },
]);

const peakPaid = {
  id: '养老房清算',
  openEp: 1,
  peakEp: 8,
  peakLabel: '订婚宴嫌弃',
  payoffEp: 8,
};

const pack = (
  extra: {
    peaks?: Array<Record<string, unknown>>;
    links?: Array<Record<string, unknown>>;
    latestEp?: number;
  } = {},
) => ({
  series: '卖掉养老房',
  latestEp: extra.latestEp ?? 20,
  peaks: extra.peaks ?? [peakPaid],
  links: extra.links ?? [
    { id: 'L1', peakId: '养老房清算', ep: 8, shotSpec: withReaction },
  ],
});

const failCodes = (r: ReturnType<typeof evaluateReactionPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateReactionPeakLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateReactionPeakLink', () => {
  it('peak ep + shotSpec with reaction → PASS; gates untouched', () => {
    const r = evaluateReactionPeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('bad schema → SCHEMA FAIL', () => {
    expect(failCodes(evaluateReactionPeakLink({ series: 'T' }))).toContain('SCHEMA');
  });

  it('dup link → DUP_ID FAIL', () => {
    const r = evaluateReactionPeakLink(
      pack({
        links: [
          { id: 'dup', peakId: '养老房清算', ep: 8, shotSpec: withReaction },
          { id: 'dup', peakId: '养老房清算', ep: 8, shotSpec: withReaction },
        ],
      }),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('unknown peak → UNKNOWN_PEAK FAIL', () => {
    const r = evaluateReactionPeakLink(
      pack({
        links: [{ id: 'a', peakId: 'ghost', ep: 8, shotSpec: withReaction }],
      }),
    );
    expect(failCodes(r)).toContain('UNKNOWN_PEAK');
    // also PEAK_WITHOUT_REACTION_LINK for the unlinked paid peak
    expect(failCodes(r)).toContain('PEAK_WITHOUT_REACTION_LINK');
  });

  it('link.ep ≠ peak.peakEp → EP_MISMATCH FAIL', () => {
    const r = evaluateReactionPeakLink(
      pack({
        links: [{ id: 'L1', peakId: '养老房清算', ep: 7, shotSpec: withReaction }],
      }),
    );
    expect(failCodes(r)).toContain('EP_MISMATCH');
  });

  it('shotSpec missing reaction → CHILD_REACTION_FAIL', () => {
    const r = evaluateReactionPeakLink(
      pack({
        links: [{ id: 'L1', peakId: '养老房清算', ep: 8, shotSpec: noReaction }],
      }),
    );
    expect(failCodes(r)).toContain('CHILD_REACTION_FAIL');
  });

  it('peakEp set but no link → PEAK_WITHOUT_REACTION_LINK FAIL', () => {
    const r = evaluateReactionPeakLink(pack({ links: [] }));
    expect(failCodes(r)).toContain('PEAK_WITHOUT_REACTION_LINK');
  });

  it('open peak without peakEp → PENDING_PAIR WARN + PASS', () => {
    const r = evaluateReactionPeakLink(
      pack({
        peaks: [{ id: '蓄仇中', openEp: 2 }],
        links: [],
        latestEp: 5,
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
  });

  it('broken peak ledger → CHILD_PEAK_FAIL', () => {
    const r = evaluateReactionPeakLink(
      pack({
        peaks: [
          {
            id: '坏',
            openEp: 1,
            peakEp: 10,
            // missing peakLabel → PEAK_LABEL_MISSING
            payoffEp: 10,
          },
        ],
        links: [{ id: 'L1', peakId: '坏', ep: 10, shotSpec: withReaction }],
      }),
    );
    expect(failCodes(r)).toContain('CHILD_PEAK_FAIL');
  });

  it('link.ep > latestEp → FUTURE_EP FAIL', () => {
    const r = evaluateReactionPeakLink(
      pack({
        peaks: [
          {
            id: '养老房清算',
            openEp: 1,
            peakEp: 8,
            peakLabel: '订婚宴嫌弃',
            payoffEp: 8,
          },
        ],
        links: [{ id: 'L1', peakId: '养老房清算', ep: 8, shotSpec: withReaction }],
        latestEp: 5,
      }),
    );
    // child also FUTURE_EP on peak/payoff → CHILD_PEAK_FAIL; link FUTURE_EP too
    expect(failCodes(r)).toEqual(expect.arrayContaining(['FUTURE_EP', 'CHILD_PEAK_FAIL']));
  });
});
