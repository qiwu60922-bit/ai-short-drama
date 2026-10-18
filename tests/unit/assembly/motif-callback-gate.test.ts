/**
 * V12 Motif Callback Gate — 视觉母题/道具回扣账本（seed→echo→payoff）, offline, ≠Final ≠G3.
 * Reverse-engineered (public text/structure only) from 红果 hits 2026-10-17~18:
 * 《盛夏芬德拉》(白玫瑰空镜三次：含苞→半开→盛放；局部细节先于正脸),
 * 《首辅娇娘》(守宫砂→画梅遮掩的身份视觉印记反复回扣),
 * 《小奶团回裴家,全家抢着宠!》(回裴家→偏见→真诚收哥哥们宠爱的亲情重建回扣).
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateMotifCallbacks,
  MOTIF_CALLBACK_DEFAULTS,
} from '@/agents/assembly/motif-callback-gate';

const rose = {
  id: 'white-rose',
  label: '白玫瑰',
  kind: 'prop' as const,
};

const ledger = (
  appearances: Array<Record<string, unknown>>,
  opts: { latestEp?: number; motifs?: Array<Record<string, unknown>> } = {},
) => ({
  series: 'T',
  latestEp: opts.latestEp ?? 80,
  motifs: opts.motifs ?? [rose],
  appearances,
});

const failCodes = (r: ReturnType<typeof evaluateMotifCallbacks>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateMotifCallbacks>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateMotifCallbacks', () => {
  it('exposes defaults: minAppearances=3, maxIdleEps=40', () => {
    expect(MOTIF_CALLBACK_DEFAULTS).toEqual({ minAppearances: 3, maxIdleEps: 40 });
  });

  it('seed + echo + payoff across episodes → PASS; gates untouched', () => {
    const r = evaluateMotifCallbacks(
      ledger([
        { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
        { motifId: 'white-rose', ep: 36, role: 'echo', visualState: '半开' },
        { motifId: 'white-rose', ep: 78, role: 'payoff', visualState: '盛放' },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.metrics).toMatchObject({
      motifs: 1,
      appearances: 3,
      underCallbacks: 0,
      idle: 0,
      latestEp: 80,
    });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('schema garbage → SCHEMA FAIL', () => {
    const r = evaluateMotifCallbacks({ series: 'T' });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('duplicate motif id → DUP_ID FAIL', () => {
    const r = evaluateMotifCallbacks(
      ledger([], {
        motifs: [rose, { ...rose, label: '白玫瑰2' }],
      }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('appearance refs unknown motif → UNKNOWN_MOTIF FAIL', () => {
    const r = evaluateMotifCallbacks(
      ledger([{ motifId: 'ghost', ep: 1, role: 'seed' }]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('UNKNOWN_MOTIF');
  });

  it('appearance ep beyond latestEp → FUTURE_EP FAIL', () => {
    const r = evaluateMotifCallbacks(
      ledger([{ motifId: 'white-rose', ep: 99, role: 'seed' }], { latestEp: 10 }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('echo/payoff without any seed → NO_SEED FAIL', () => {
    const r = evaluateMotifCallbacks(
      ledger([
        { motifId: 'white-rose', ep: 10, role: 'echo' },
        { motifId: 'white-rose', ep: 20, role: 'payoff' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('NO_SEED');
  });

  it('payoff episode before seed → PAYOFF_BEFORE_SEED FAIL', () => {
    const r = evaluateMotifCallbacks(
      ledger([
        { motifId: 'white-rose', ep: 50, role: 'seed' },
        { motifId: 'white-rose', ep: 10, role: 'payoff' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('PAYOFF_BEFORE_SEED');
  });

  it('echo episode before seed → ECHO_BEFORE_SEED FAIL', () => {
    const r = evaluateMotifCallbacks(
      ledger([
        { motifId: 'white-rose', ep: 20, role: 'seed' },
        { motifId: 'white-rose', ep: 5, role: 'echo' },
      ]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('ECHO_BEFORE_SEED');
  });

  it('only seed (no callback) → UNDER_CALLBACKS FAIL', () => {
    const r = evaluateMotifCallbacks(
      ledger([{ motifId: 'white-rose', ep: 1, role: 'seed' }], { latestEp: 10 }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('UNDER_CALLBACKS');
    expect(r.metrics.underCallbacks).toBe(1);
  });

  it('seed + one echo but minAppearances=3 → UNDER_CALLBACKS FAIL', () => {
    const r = evaluateMotifCallbacks(
      ledger(
        [
          { motifId: 'white-rose', ep: 1, role: 'seed' },
          { motifId: 'white-rose', ep: 20, role: 'echo' },
        ],
        { latestEp: 40 },
      ),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('UNDER_CALLBACKS');
  });

  it('seed + echo without payoff after idle window → MISSING_PAYOFF WARN', () => {
    const r = evaluateMotifCallbacks(
      ledger(
        [
          { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
          { motifId: 'white-rose', ep: 5, role: 'echo', visualState: '半开' },
          { motifId: 'white-rose', ep: 10, role: 'echo', visualState: '半开' },
        ],
        { latestEp: 60 },
      ),
    );
    // 3 appearances satisfy minAppearances, but no payoff and idle from last appearance
    expect(failCodes(r)).not.toContain('UNDER_CALLBACKS');
    expect(warnCodes(r)).toContain('MISSING_PAYOFF');
    expect(r.verdict).toBe('PASS');
  });

  it('last appearance idle beyond maxIdleEps → MOTIF_IDLE WARN', () => {
    const r = evaluateMotifCallbacks(
      ledger(
        [
          { motifId: 'white-rose', ep: 1, role: 'seed' },
          { motifId: 'white-rose', ep: 2, role: 'echo' },
          { motifId: 'white-rose', ep: 3, role: 'payoff' },
        ],
        { latestEp: 80 },
      ),
      { maxIdleEps: 40 },
    );
    expect(warnCodes(r)).toContain('MOTIF_IDLE');
    expect(r.metrics.idle).toBe(1);
    expect(r.verdict).toBe('PASS');
  });

  it('visual_mark kind (守宫砂/画梅) same callback rules', () => {
    const r = evaluateMotifCallbacks(
      ledger(
        [
          { motifId: 'mei-mark', ep: 1, role: 'seed', note: '守宫砂' },
          { motifId: 'mei-mark', ep: 8, role: 'echo', note: '画梅遮掩' },
          { motifId: 'mei-mark', ep: 40, role: 'payoff', note: '印记和解' },
        ],
        {
          latestEp: 50,
          motifs: [{ id: 'mei-mark', label: '守宫砂·画梅', kind: 'visual_mark' }],
        },
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
  });

  it('declared motif with zero appearances → UNDER_CALLBACKS FAIL', () => {
    const r = evaluateMotifCallbacks(ledger([], { latestEp: 5 }));
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('UNDER_CALLBACKS');
  });

  it('invalid appearance role → SCHEMA FAIL', () => {
    const r = evaluateMotifCallbacks(
      ledger([{ motifId: 'white-rose', ep: 1, role: 'hook' }]),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('minAppearances override to 2 allows seed+payoff only', () => {
    const r = evaluateMotifCallbacks(
      ledger(
        [
          { motifId: 'white-rose', ep: 1, role: 'seed' },
          { motifId: 'white-rose', ep: 10, role: 'payoff' },
        ],
        { latestEp: 12 },
      ),
      { minAppearances: 2 },
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).not.toContain('UNDER_CALLBACKS');
  });
});
