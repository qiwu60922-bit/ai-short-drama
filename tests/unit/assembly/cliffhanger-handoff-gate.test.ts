/**
 * V12 Cliffhanger Handoff Gate — 季末悬念 → 下季开篇承接, offline, pre-generation. ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果 hits 2026-10:
 * 《持械入宋》(瑾叶剧场): multi-season continuous narrative, finales open tension → next season continues;
 * 《满院亲戚全是上古大妖》S4: season opens with crisis carrying prior stakes;
 * 《聚宝仙盆》 leftover: 季间悬念 → 下季开篇立即承接.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffhangerHandoff } from '@/agents/assembly/cliffhanger-handoff-gate';
import { BEAT_ROLES } from '@/agents/assembly/hook-structure-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});

/** 30s prev ending on cliffhanger within tail; 30s next opening with hook. */
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '危机开场' },
  { durSec: 8, beatRole: 'increment', action: '追查线索' },
  { durSec: 8, beatRole: 'reversal', action: '身份暴露' },
  { durSec: 10, beatRole: 'cliffhanger', action: '持械闯入皇城大门被围' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '皇城门口持械对峙未解' },
  { durSec: 10, beatRole: 'increment', action: '追兵逼近' },
  { durSec: 10, beatRole: 'reversal', action: '旧友现身' },
  { durSec: 8, beatRole: 'cliffhanger', action: '下一场更大危机' },
];

const failCodes = (r: ReturnType<typeof evaluateCliffhangerHandoff>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateCliffhangerHandoff>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateCliffhangerHandoff', () => {
  it('reuses BEAT_ROLES vocabulary from hook-structure-gate', () => {
    expect(BEAT_ROLES).toContain('cliffhanger');
    expect(BEAT_ROLES).toContain('hook');
  });

  it('prev ends cliffhanger + next opens hook with overlapping stakes → PASS, gates untouched', () => {
    const r = evaluateCliffhangerHandoff(spec('EP01', prevGood()), spec('EP02', nextGood()));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.prevCliffEndsAtSec).toBe(30);
    expect(r.metrics.nextHookAtSec).toBe(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('prev ending on calm setup (no late cliffhanger) → PREV_CLIFF_MISSING FAIL', () => {
    const prev = prevGood();
    prev[3] = { durSec: 10, beatRole: 'setup', action: '平静收场' };
    const r = evaluateCliffhangerHandoff(spec('EP01', prev), spec('EP02', nextGood()));
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('PREV_CLIFF_MISSING');
    expect(r.metrics.prevCliffEndsAtSec).toBeNull();
  });

  it('prev cliffhanger ending more than tailToleranceSec before end → PREV_CLIFF_MISSING FAIL', () => {
    const prev = [
      { durSec: 4, beatRole: 'hook' },
      { durSec: 10, beatRole: 'cliffhanger', action: '危机' },
      { durSec: 10, beatRole: 'setup', action: '黑场后还有长尾' },
    ];
    const r = evaluateCliffhangerHandoff(spec('EP01', prev), spec('EP02', nextGood()), {
      tailToleranceSec: 3,
    });
    expect(failCodes(r)).toContain('PREV_CLIFF_MISSING');
  });

  it('≤3s title card after prev cliffhanger is tolerated (same as hook-structure-gate)', () => {
    const prev = [
      ...prevGood().slice(0, 3),
      { durSec: 7, beatRole: 'cliffhanger', action: '持械闯入皇城' },
      { durSec: 3, beatRole: 'setup', action: '黑场标题' },
    ];
    expect(
      evaluateCliffhangerHandoff(spec('EP01', prev), spec('EP02', nextGood())).verdict,
    ).toBe('PASS');
  });

  it('next opens with late hook (after hookWindowSec) → NEXT_HOOK_LATE FAIL', () => {
    const next = [
      { durSec: 5, beatRole: 'setup', action: '漫长铺垫' },
      { durSec: 5, beatRole: 'hook', action: '皇城对峙' },
      { durSec: 10, beatRole: 'increment' },
      { durSec: 10, beatRole: 'cliffhanger' },
    ];
    const r = evaluateCliffhangerHandoff(spec('EP01', prevGood()), spec('EP02', next));
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('NEXT_HOOK_LATE');
    expect(r.metrics.nextHookAtSec).toBe(5);
  });

  it('next has no hook at all → NEXT_HOOK_LATE FAIL with null metric', () => {
    const next = nextGood().map((s) =>
      s.beatRole === 'hook' ? { ...s, beatRole: 'setup' } : s,
    );
    const r = evaluateCliffhangerHandoff(spec('EP01', prevGood()), spec('EP02', next));
    expect(failCodes(r)).toContain('NEXT_HOOK_LATE');
    expect(r.metrics.nextHookAtSec).toBeNull();
  });

  it('bad prev or next schema → SCHEMA FAIL', () => {
    const good = spec('EP02', nextGood());
    expect(evaluateCliffhangerHandoff({ shots: [] }, good).findings[0].code).toBe('SCHEMA');
    expect(evaluateCliffhangerHandoff(spec('EP01', prevGood()), { shots: [] }).findings[0].code).toBe(
      'SCHEMA',
    );
    expect(evaluateCliffhangerHandoff({ shots: [] }, good).verdict).toBe('FAIL');
  });

  it('cliff/hook actions share zero meaningful tokens → HANDOFF_WEAK WARN, still PASS', () => {
    const prev = prevGood();
    prev[3] = { durSec: 10, beatRole: 'cliffhanger', action: '密室毒药即将发作' };
    const next = nextGood();
    next[0] = { durSec: 2, beatRole: 'hook', action: '海滩婚礼突然停电' };
    const r = evaluateCliffhangerHandoff(spec('EP01', prev), spec('EP02', next));
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('HANDOFF_WEAK');
    expect(r.metrics.sharedTokenCount).toBe(0);
  });

  it('overlapping Chinese stakes (持械/皇城) → no HANDOFF_WEAK', () => {
    const r = evaluateCliffhangerHandoff(spec('EP01', prevGood()), spec('EP02', nextGood()));
    expect(warnCodes(r)).not.toContain('HANDOFF_WEAK');
    expect(r.metrics.sharedTokenCount).toBeGreaterThan(0);
  });

  it('unknown beatRole typo on either side → INVALID_ROLE FAIL', () => {
    const prev = prevGood();
    prev[1] = { ...prev[1], beatRole: 'twist' };
    const r1 = evaluateCliffhangerHandoff(spec('EP01', prev), spec('EP02', nextGood()));
    expect(failCodes(r1)).toContain('INVALID_ROLE');
    expect(r1.findings.find((f) => f.code === 'INVALID_ROLE')?.shotIds).toContain('EP01-S1');

    const next = nextGood();
    next[2] = { ...next[2], beatRole: 'climax' };
    const r2 = evaluateCliffhangerHandoff(spec('EP01', prevGood()), spec('EP02', next));
    expect(failCodes(r2)).toContain('INVALID_ROLE');
  });

  it('thresholds configurable', () => {
    const next = [
      { durSec: 4, beatRole: 'setup' },
      { durSec: 2, beatRole: 'hook', action: '持械对峙' },
      { durSec: 10, beatRole: 'increment' },
      { durSec: 10, beatRole: 'cliffhanger' },
    ];
    // hook starts at 4s: default window 3 → FAIL; window 5 → ok (if prev cliff ok)
    expect(
      failCodes(evaluateCliffhangerHandoff(spec('EP01', prevGood()), spec('EP02', next))),
    ).toContain('NEXT_HOOK_LATE');
    expect(
      evaluateCliffhangerHandoff(spec('EP01', prevGood()), spec('EP02', next), {
        hookWindowSec: 5,
      }).verdict,
    ).toBe('PASS');
  });
});
