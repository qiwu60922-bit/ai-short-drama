/**
 * V12 Foreshadow Ledger Gate (伏笔账本闸门) — cross-episode setup/payoff bookkeeping. Offline. ≠Final ≠G3.
 * Rules adapted (MIT-0) from mengxiujie/ManjuForge scripts/consistency_check.py
 * (F1 发酵期 / F2 回收状态矛盾 / F3 悬置 / F4 并发上限 / F5 ID唯一 / M5 悬空引用 / M4 状态同步).
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowLedger } from '@/agents/assembly/foreshadow-ledger-gate';

type Row = Record<string, unknown>;
const f = (id: string, extra: Row = {}): Row => ({ id, name: `伏笔${id}`, priority: 'B', plantEp: 1, status: 'active', ...extra });
const doc = (items: Row[], extra: Row = {}) => ({ series: 'zhui-yu-shitu', latestEp: 6, items, ...extra });
const codes = (r: ReturnType<typeof evaluateForeshadowLedger>, sev?: 'FAIL' | 'WARN') =>
  r.findings.filter((x) => !sev || x.severity === sev).map((x) => x.code);

describe('evaluateForeshadowLedger', () => {
  it('PASS on a healthy ledger; gates stay NOT_EVALUATED; metrics counted', () => {
    const r = evaluateForeshadowLedger(doc([
      f('F01', { priority: 'S', lastAdvancedEp: 5 }),
      f('F02', { status: 'closed', plantEp: 1, payoffEp: 4 }),
      f('F03', { status: 'dropped', plantEp: 2 }),
    ]));
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.metrics).toMatchObject({ total: 3, active: 1, closed: 1, dropped: 1, latestEp: 6 });
  });

  it('SCHEMA FAIL on malformed input (bad status / missing id)', () => {
    expect(codes(evaluateForeshadowLedger(doc([f('F01', { status: 'maybe' })])))).toEqual(['SCHEMA']);
    expect(codes(evaluateForeshadowLedger({ series: 'x', latestEp: 1, items: [{ name: 'n', plantEp: 1, status: 'active' }] }))).toEqual(['SCHEMA']);
    expect(evaluateForeshadowLedger(null).verdict).toBe('FAIL');
  });

  it('DUP_ID FAIL (F5)', () => {
    const r = evaluateForeshadowLedger(doc([f('F01'), f('F01', { name: '另一根线' })]));
    expect(codes(r, 'FAIL')).toContain('DUP_ID');
    expect(r.verdict).toBe('FAIL');
  });

  it('CLOSED_NO_PAYOFF FAIL (F2) and PAYOFF_ON_OPEN FAIL when an active item claims a payoff episode', () => {
    expect(codes(evaluateForeshadowLedger(doc([f('F01', { status: 'closed' })])), 'FAIL')).toEqual(['CLOSED_NO_PAYOFF']);
    expect(codes(evaluateForeshadowLedger(doc([f('F01', { payoffEp: 3 })])), 'FAIL')).toEqual(['PAYOFF_ON_OPEN']);
  });

  it('PAYOFF_BEFORE_PLANT FAIL and FUTURE_EP FAIL', () => {
    expect(codes(evaluateForeshadowLedger(doc([f('F01', { status: 'closed', plantEp: 4, payoffEp: 2 })])), 'FAIL')).toEqual(['PAYOFF_BEFORE_PLANT']);
    expect(codes(evaluateForeshadowLedger(doc([f('F01', { plantEp: 9 })])), 'FAIL')).toEqual(['FUTURE_EP']);
    expect(codes(evaluateForeshadowLedger(doc([f('F01', { status: 'closed', plantEp: 1, payoffEp: 7 })])), 'FAIL')).toEqual(['FUTURE_EP']);
  });

  it('PAYOFF_TOO_FAST WARN (F1): payoff gap < minFermentEps keeps verdict PASS', () => {
    const r = evaluateForeshadowLedger(doc([f('F01', { status: 'closed', plantEp: 3, payoffEp: 4 })]));
    expect(codes(r)).toEqual(['PAYOFF_TOO_FAST']);
    expect(r.verdict).toBe('PASS');
    expect(codes(evaluateForeshadowLedger(doc([f('F01', { status: 'closed', plantEp: 3, payoffEp: 4 })]), { minFermentEps: 1 }))).toEqual([]);
  });

  it('STALE FAIL (F3): active and idle more than maxIdleEps since last advance (defaults to plantEp)', () => {
    const r = evaluateForeshadowLedger(doc([f('F01', { plantEp: 1 })], { latestEp: 10 }));
    expect(codes(r, 'FAIL')).toEqual(['STALE']);
    expect(codes(evaluateForeshadowLedger(doc([f('F01', { plantEp: 1, lastAdvancedEp: 3 })], { latestEp: 10 })))).toEqual([]);
    expect(codes(evaluateForeshadowLedger(doc([f('F01', { plantEp: 1 })], { latestEp: 10 }), { maxIdleEps: 9 }))).toEqual([]);
  });

  it('CONCURRENCY WARN (F4): more than 3 active S or 5 active A', () => {
    const s = ['F1', 'F2', 'F3', 'F4'].map((id) => f(id, { priority: 'S', lastAdvancedEp: 6 }));
    const r = evaluateForeshadowLedger(doc(s));
    expect(codes(r)).toEqual(['CONCURRENCY']);
    expect(r.findings[0].ids).toEqual(['F1', 'F2', 'F3', 'F4']);
    expect(r.verdict).toBe('PASS');
    const a = ['A1', 'A2', 'A3', 'A4', 'A5'].map((id) => f(id, { priority: 'A', lastAdvancedEp: 6 }));
    expect(codes(evaluateForeshadowLedger(doc(a)))).toEqual([]);
  });

  it('DANGLING_REF FAIL (M5): episode beats reference an unknown foreshadow ID', () => {
    const r = evaluateForeshadowLedger(doc([f('F01', { lastAdvancedEp: 5 })], {
      episodes: [{ ep: 5, advances: ['F01', 'F99'] }],
    }));
    expect(codes(r, 'FAIL')).toEqual(['DANGLING_REF']);
    expect(r.findings[0].ids).toEqual(['F99']);
  });

  it('STATUS_DESYNC FAIL (M4): episode marks payoff but ledger disagrees, or plant episode mismatches', () => {
    const r = evaluateForeshadowLedger(doc([f('F01', { lastAdvancedEp: 5 })], { episodes: [{ ep: 5, payoffs: ['F01'] }] }));
    expect(codes(r, 'FAIL')).toEqual(['STATUS_DESYNC']);
    const p = evaluateForeshadowLedger(doc([f('F01', { plantEp: 1, lastAdvancedEp: 5 })], { episodes: [{ ep: 2, plants: ['F01'] }] }));
    expect(codes(p, 'FAIL')).toEqual(['STATUS_DESYNC']);
    const ok = evaluateForeshadowLedger(doc([f('F01', { status: 'closed', plantEp: 1, payoffEp: 4 })], {
      episodes: [{ ep: 1, plants: ['F01'] }, { ep: 4, payoffs: ['F01'] }],
    }));
    expect(ok.findings).toEqual([]);
  });

  it('episode advances count as lastAdvanced when the ledger field is missing (prevents false STALE)', () => {
    const r = evaluateForeshadowLedger(doc([f('F01', { plantEp: 1 })], { latestEp: 10, episodes: [{ ep: 8, advances: ['F01'] }] }));
    expect(codes(r)).toEqual([]);
  });
});
