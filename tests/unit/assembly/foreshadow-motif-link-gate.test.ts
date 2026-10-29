/**
 * V12 Foreshadow×Motif Link — 剧情伏笔 × 视觉母题联表, offline, ≠Final ≠G3.
 * 《盛夏芬德拉》《首辅娇娘》结构层对照.
 */
import { describe, expect, it } from 'vitest';
import { evaluateForeshadowMotifLink } from '@/agents/assembly/foreshadow-motif-link-gate';

const rose = { id: 'white-rose', label: '白玫瑰', kind: 'prop' as const };
const appsOk = [
  { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
  { motifId: 'white-rose', ep: 36, role: 'echo', visualState: '半开' },
  { motifId: 'white-rose', ep: 78, role: 'payoff', visualState: '盛放' },
];
const fsClosed = {
  id: 'F-rose',
  name: '白玫瑰线',
  priority: 'S' as const,
  plantEp: 1,
  status: 'closed' as const,
  payoffEp: 78,
};
const fsActive = {
  id: 'F-rose',
  name: '白玫瑰线',
  priority: 'S' as const,
  plantEp: 1,
  status: 'active' as const,
  lastAdvancedEp: 36,
};

const pack = (
  extra: {
    foreshadows?: Array<Record<string, unknown>>;
    motifs?: Array<Record<string, unknown>>;
    appearances?: Array<Record<string, unknown>>;
    links?: Array<Record<string, unknown>>;
    latestEp?: number;
  } = {},
) => ({
  series: '盛夏芬德拉',
  latestEp: extra.latestEp ?? 80,
  foreshadows: extra.foreshadows ?? [fsClosed],
  motifs: extra.motifs ?? [rose],
  appearances: extra.appearances ?? appsOk,
  links: extra.links ?? [{ id: 'L1', foreshadowId: 'F-rose', motifId: 'white-rose' }],
});

const failCodes = (r: ReturnType<typeof evaluateForeshadowMotifLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateForeshadowMotifLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateForeshadowMotifLink', () => {
  it('closed foreshadow + motif seed→echo→payoff 同集 → PASS; gates untouched', () => {
    const r = evaluateForeshadowMotifLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('bad schema → SCHEMA FAIL', () => {
    expect(failCodes(evaluateForeshadowMotifLink({ series: 'T' }))).toContain('SCHEMA');
  });

  it('dup link id → DUP_ID FAIL', () => {
    const r = evaluateForeshadowMotifLink(
      pack({
        links: [
          { id: 'dup', foreshadowId: 'F-rose', motifId: 'white-rose' },
          { id: 'dup', foreshadowId: 'F-rose', motifId: 'white-rose' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('unknown foreshadow/motif → UNKNOWN_* FAIL', () => {
    const r = evaluateForeshadowMotifLink(
      pack({
        links: [
          { id: 'a', foreshadowId: 'ghost', motifId: 'white-rose' },
          { id: 'b', foreshadowId: 'F-rose', motifId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['UNKNOWN_FORESHADOW', 'UNKNOWN_MOTIF']),
    );
  });

  it('no seed before plant → NO_SEED_BEFORE_PLANT FAIL', () => {
    const r = evaluateForeshadowMotifLink(
      pack({
        appearances: [
          { motifId: 'white-rose', ep: 10, role: 'seed', visualState: '含苞' },
          { motifId: 'white-rose', ep: 36, role: 'echo', visualState: '半开' },
          { motifId: 'white-rose', ep: 78, role: 'payoff', visualState: '盛放' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('NO_SEED_BEFORE_PLANT');
  });

  it('closed without motif payoff → PAYOFF_WITHOUT_MOTIF_PAYOFF FAIL', () => {
    const r = evaluateForeshadowMotifLink(
      pack({
        appearances: [
          { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
          { motifId: 'white-rose', ep: 20, role: 'echo', visualState: '半开' },
          { motifId: 'white-rose', ep: 40, role: 'echo', visualState: '又半开' },
        ],
      }),
    );
    // child motif may also FAIL UNDER_CALLBACKS / MISSING_PAYOFF — still expect our code
    expect(failCodes(r)).toEqual(
      expect.arrayContaining(['PAYOFF_WITHOUT_MOTIF_PAYOFF']),
    );
  });

  it('motif payoff but foreshadow still active → MOTIF_PAYOFF_WITHOUT_CLOSE FAIL', () => {
    const r = evaluateForeshadowMotifLink(pack({ foreshadows: [fsActive] }));
    expect(failCodes(r)).toContain('MOTIF_PAYOFF_WITHOUT_CLOSE');
  });

  it('payoffEp ≠ motif payoff ep → EP_MISMATCH FAIL', () => {
    const r = evaluateForeshadowMotifLink(
      pack({
        foreshadows: [{ ...fsClosed, payoffEp: 70 }],
        appearances: [
          { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
          { motifId: 'white-rose', ep: 36, role: 'echo', visualState: '半开' },
          { motifId: 'white-rose', ep: 78, role: 'payoff', visualState: '盛放' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('EP_MISMATCH');
  });

  it('both pending → PENDING_PAIR WARN + PASS', () => {
    const r = evaluateForeshadowMotifLink(
      pack({
        foreshadows: [fsActive],
        appearances: [
          { motifId: 'white-rose', ep: 1, role: 'seed', visualState: '含苞' },
          { motifId: 'white-rose', ep: 20, role: 'echo', visualState: '半开' },
          { motifId: 'white-rose', ep: 36, role: 'echo', visualState: '又半开' },
        ],
        latestEp: 40,
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.metrics.pending).toBe(1);
  });
});
