/**
 * V12 Conflict Payoff Gap Gate — 冲突→兑现间隔（不受隔夜气）, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果 hits 2026-10-16:
 * 《帐中香》(配角挑衅当场反噬、主角绝不受隔夜气),
 * 《东北后妈，整顿全家》(家庭矛盾对症工具快速兑现),
 * 《公路求生榜一说她要走到公路尽头》(重生绝境→首杀/榜一短间隔).
 * Distinct from foreshadow-ledger: 伏笔要发酵，冲突要快兑现.
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateConflictPayoffGap,
  CONFLICT_PAYOFF_DEFAULTS,
} from '@/agents/assembly/conflict-payoff-gap-gate';

const ledger = (conflicts: Array<Record<string, unknown>>, latestEp = 10) => ({
  series: 'T',
  latestEp,
  conflicts,
});

const failCodes = (r: ReturnType<typeof evaluateConflictPayoffGap>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateConflictPayoffGap', () => {
  it('exposes defaults: maxGapEpisodes=1 (不受隔夜气), maxSameEpGapSec=60', () => {
    expect(CONFLICT_PAYOFF_DEFAULTS).toMatchObject({ maxGapEpisodes: 1, maxSameEpGapSec: 60 });
  });

  it('same-ep or next-ep payoff → PASS; gates untouched', () => {
    const r = evaluateConflictPayoffGap(
      ledger([
        { id: 'c1', openEp: 1, payoffEp: 1 },
        { id: 'c2', openEp: 3, payoffEp: 4 },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ total: 2, paid: 2, open: 0, overdue: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('payoff 2+ episodes later (隔夜气) → CONFLICT_GAP_EPISODES FAIL', () => {
    const r = evaluateConflictPayoffGap(
      ledger([{ id: '诗稿陷害', openEp: 2, payoffEp: 5 }]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('CONFLICT_GAP_EPISODES');
    expect(r.findings.find((f) => f.code === 'CONFLICT_GAP_EPISODES')?.ids).toEqual(['诗稿陷害']);
  });

  it('same episode but >60s between open and payoff → CONFLICT_GAP_SEC FAIL', () => {
    const r = evaluateConflictPayoffGap(
      ledger([{ id: 'c1', openEp: 1, openAtSec: 2, payoffEp: 1, payoffAtSec: 70 }]),
    );
    expect(failCodes(r)).toContain('CONFLICT_GAP_SEC');
  });

  it('same episode within 60s → PASS even if near end of short ep', () => {
    const r = evaluateConflictPayoffGap(
      ledger([{ id: 'c1', openEp: 1, openAtSec: 5, payoffEp: 1, payoffAtSec: 50 }]),
    );
    expect(r.verdict).toBe('PASS');
  });

  it('missing payoff and already past maxGap → CONFLICT_OPEN FAIL (overdue)', () => {
    const r = evaluateConflictPayoffGap(
      ledger([{ id: 'c1', openEp: 1 }], 5),
    );
    expect(failCodes(r)).toContain('CONFLICT_OPEN');
    expect(r.metrics.overdue).toBe(1);
  });

  it('missing payoff but still inside window → OPEN_PENDING WARN, not FAIL', () => {
    const r = evaluateConflictPayoffGap(
      ledger([{ id: 'c1', openEp: 5 }], 5),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.findings.find((f) => f.code === 'OPEN_PENDING')).toMatchObject({
      severity: 'WARN',
      ids: ['c1'],
    });
  });

  it('payoff before open → PAYOFF_BEFORE_OPEN FAIL', () => {
    const r = evaluateConflictPayoffGap(
      ledger([{ id: 'c1', openEp: 4, payoffEp: 2 }]),
    );
    expect(failCodes(r)).toContain('PAYOFF_BEFORE_OPEN');
  });

  it('same ep with payoffAtSec < openAtSec → PAYOFF_BEFORE_OPEN FAIL', () => {
    const r = evaluateConflictPayoffGap(
      ledger([{ id: 'c1', openEp: 1, openAtSec: 40, payoffEp: 1, payoffAtSec: 10 }]),
    );
    expect(failCodes(r)).toContain('PAYOFF_BEFORE_OPEN');
  });

  it('future open/payoff beyond latestEp → FUTURE_EP FAIL', () => {
    const r = evaluateConflictPayoffGap(
      ledger([{ id: 'c1', openEp: 12, payoffEp: 12 }], 10),
    );
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('duplicate conflict ids → DUP_ID FAIL', () => {
    const r = evaluateConflictPayoffGap(
      ledger([
        { id: 'c1', openEp: 1, payoffEp: 1 },
        { id: 'c1', openEp: 2, payoffEp: 2 },
      ]),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateConflictPayoffGap({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('thresholds configurable (maxGapEpisodes=0 forces same-ep only)', () => {
    const nextEp = ledger([{ id: 'c1', openEp: 1, payoffEp: 2 }]);
    expect(evaluateConflictPayoffGap(nextEp).verdict).toBe('PASS');
    expect(failCodes(evaluateConflictPayoffGap(nextEp, { maxGapEpisodes: 0 }))).toContain(
      'CONFLICT_GAP_EPISODES',
    );
  });
});
