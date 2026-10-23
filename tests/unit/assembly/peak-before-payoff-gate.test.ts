/**
 * V12 Peak-Before-Payoff / Deferred-Revenge Gate — 巅峰后再兑现（蓄仇清算）, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果/抖音 hits 2026-10-22～10-23:
 * 《卖掉养老房那天，我重获新生》(卖房蓄势→公开清算),
 * 《婆婆装瘫七年，我高调离婚！》(等丈夫升副院长再清算 — 昨日候选),
 * 《和离后我带女儿横扫魔域》(身份底牌在羞辱/对峙峰值才揭).
 * Opposite of conflict-payoff-gap-gate「要快兑现」: deferred entries MAY have long gaps,
 * but payoff MUST sit at/after an explicit opponent (or situation) peak marker.
 */
import { describe, expect, it } from 'vitest';
import {
  evaluatePeakBeforePayoff,
  PEAK_BEFORE_PAYOFF_DEFAULTS,
} from '@/agents/assembly/peak-before-payoff-gate';

const ledger = (entries: Array<Record<string, unknown>>, latestEp = 20) => ({
  series: 'T',
  latestEp,
  entries,
});

const failCodes = (r: ReturnType<typeof evaluatePeakBeforePayoff>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluatePeakBeforePayoff', () => {
  it('exposes defaults: minPeakToPayoffEps=0 (peak may be same ep as payoff)', () => {
    expect(PEAK_BEFORE_PAYOFF_DEFAULTS).toMatchObject({ minPeakToPayoffEps: 0 });
  });

  it('deferred: peak then same/next-ep payoff → PASS; gates untouched', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([
        {
          id: '养老房清算',
          openEp: 1,
          peakEp: 8,
          peakLabel: '订婚宴嫌弃',
          payoffEp: 8,
        },
        {
          id: '装瘫清算',
          openEp: 2,
          peakEp: 12,
          peakLabel: '丈夫升副院长',
          payoffEp: 13,
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ total: 2, paid: 2, open: 0, withPeak: 2 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('long gap between open and payoff is OK when peak precedes payoff (≠ conflict-payoff)', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([{ id: 'd1', openEp: 1, peakEp: 15, peakLabel: '巅峰', payoffEp: 16 }], 20),
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).not.toContain('CONFLICT_GAP_EPISODES');
  });

  it('payoff without peakEp → PAYOFF_WITHOUT_PEAK FAIL', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([{ id: '早兑现', openEp: 1, payoffEp: 3 }]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('PAYOFF_WITHOUT_PEAK');
    expect(r.findings.find((f) => f.code === 'PAYOFF_WITHOUT_PEAK')?.ids).toEqual(['早兑现']);
  });

  it('peak after payoff → PEAK_AFTER_PAYOFF FAIL', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([{ id: '颠倒', openEp: 1, peakEp: 10, peakLabel: '晚巅峰', payoffEp: 5 }]),
    );
    expect(failCodes(r)).toContain('PEAK_AFTER_PAYOFF');
  });

  it('same ep but peakAtSec after payoffAtSec → PEAK_AFTER_PAYOFF FAIL', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([
        {
          id: '同集颠倒',
          openEp: 3,
          peakEp: 3,
          peakAtSec: 50,
          peakLabel: '升职',
          payoffEp: 3,
          payoffAtSec: 20,
        },
      ]),
    );
    expect(failCodes(r)).toContain('PEAK_AFTER_PAYOFF');
  });

  it('same ep peakAtSec ≤ payoffAtSec → PASS', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([
        {
          id: '同集巅峰兑现',
          openEp: 3,
          peakEp: 3,
          peakAtSec: 20,
          peakLabel: '升职宴',
          payoffEp: 3,
          payoffAtSec: 45,
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
  });

  it('peak before open → PEAK_BEFORE_OPEN FAIL', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([{ id: 'p1', openEp: 5, peakEp: 2, peakLabel: '早', payoffEp: 6 }]),
    );
    expect(failCodes(r)).toContain('PEAK_BEFORE_OPEN');
  });

  it('payoff before open → PAYOFF_BEFORE_OPEN FAIL', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([{ id: 'p1', openEp: 5, peakEp: 6, peakLabel: 'x', payoffEp: 3 }]),
    );
    expect(failCodes(r)).toContain('PAYOFF_BEFORE_OPEN');
  });

  it('future open/peak/payoff beyond latestEp → FUTURE_EP FAIL', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([{ id: 'p1', openEp: 1, peakEp: 25, peakLabel: 'x', payoffEp: 26 }], 20),
    );
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('duplicate ids → DUP_ID FAIL', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([
        { id: 'x', openEp: 1, peakEp: 2, peakLabel: 'a', payoffEp: 3 },
        { id: 'x', openEp: 4, peakEp: 5, peakLabel: 'b', payoffEp: 6 },
      ]),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluatePeakBeforePayoff({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('peak without peakLabel → PEAK_LABEL_MISSING FAIL', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([{ id: 'p1', openEp: 1, peakEp: 5, payoffEp: 6 }]),
    );
    expect(failCodes(r)).toContain('PEAK_LABEL_MISSING');
  });

  it('open without payoff, still pending → OPEN_PENDING WARN (PASS)', () => {
    const r = evaluatePeakBeforePayoff(
      ledger([{ id: '蓄仇中', openEp: 2, peakEp: 10, peakLabel: '计划升职' }], 10),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.findings.find((f) => f.code === 'OPEN_PENDING')).toMatchObject({
      severity: 'WARN',
      ids: ['蓄仇中'],
    });
  });

  it('open without peak plan → NO_PEAK_PLAN WARN (PASS)', () => {
    const r = evaluatePeakBeforePayoff(ledger([{ id: '无计划', openEp: 1 }], 5));
    expect(r.verdict).toBe('PASS');
    expect(r.findings.find((f) => f.code === 'NO_PEAK_PLAN')).toMatchObject({
      severity: 'WARN',
      ids: ['无计划'],
    });
  });
});
