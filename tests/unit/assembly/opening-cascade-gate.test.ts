/**
 * V12 Opening Cascade Gate — 开场叠钩 ≥N 拍, offline, pre-generation. ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from public breakdowns of 红果/抖音 hits 2026-10-19~20:
 * 《老公请和我恋爱吧》派出所认亲→死对头变老公→穿到八年后（叠钩 cascade）;
 * 《回到70年代霸道婆婆带我飞》跳河→穿书→婆婆重生拥抱（三层叠钩）;
 * 《我成全嫡孙抗旨退婚，他却慌了》重生+三日倒计时+前世惨死（开场叠层）;
 * 《猪圈倒了，薄荷火了》恶邻违建+臭气压迫+反常种薄荷（冲突后立刻第二拍）。
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  evaluateOpeningCascade,
  CASCADE_BEAT_ROLES,
} from '@/agents/assembly/opening-cascade-gate';

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (shots: S[]) => ({
  episode: 'T',
  shots: shots.map((s, i) => ({ shotId: `S${i}`, cast: [], ...s })),
});
const failCodes = (r: ReturnType<typeof evaluateOpeningCascade>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateOpeningCascade>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

/** 60s ep: hook@0 + increment@2 within 8s window, then mid/end filler. */
const goodCascade = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: 'crisis cold open' },
  { durSec: 2, beatRole: 'increment', action: 'identity twist lands' },
  { durSec: 8, beatRole: 'setup' },
  { durSec: 10, beatRole: 'increment' },
  { durSec: 10, beatRole: 'reversal' },
  { durSec: 10, beatRole: 'increment' },
  { durSec: 10, beatRole: 'increment' },
  { durSec: 8, beatRole: 'cliffhanger' },
];

describe('evaluateOpeningCascade', () => {
  it('exposes cascade beat vocabulary (hook/reversal/increment)', () => {
    expect(CASCADE_BEAT_ROLES).toEqual(['hook', 'reversal', 'increment']);
  });

  it('≥2 cascade beats starting within 8s → PASS with metrics, gates untouched', () => {
    const r = evaluateOpeningCascade(spec(goodCascade()));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({
      totalSeconds: 60,
      cascadeBeatCount: 2,
      cascadeWindowSec: 8,
      minCascadeBeats: 2,
    });
    expect(r.metrics.cascadeStartsAtSec).toEqual([0, 2]);
    expect(r.metrics.cascadeRoles).toEqual(['hook', 'increment']);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('single hook in window (老公请 anti-pattern without cascade) → CASCADE_THIN FAIL', () => {
    const shots = goodCascade();
    shots[1] = { durSec: 2, beatRole: 'setup' };
    const r = evaluateOpeningCascade(spec(shots));
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('CASCADE_THIN');
    expect(r.metrics.cascadeBeatCount).toBe(1);
  });

  it('no cascade beats in window → CASCADE_THIN FAIL with empty starts', () => {
    const shots = goodCascade().map((s) =>
      s.beatRole === 'hook' || s.beatRole === 'increment' || s.beatRole === 'reversal'
        ? { ...s, beatRole: 'setup' }
        : s,
    );
    // restore mid/end so total still valid; only opening matters
    shots[3] = { durSec: 10, beatRole: 'increment' };
    shots[4] = { durSec: 10, beatRole: 'reversal' };
    shots[7] = { durSec: 8, beatRole: 'cliffhanger' };
    const r = evaluateOpeningCascade(spec(shots));
    expect(failCodes(r)).toContain('CASCADE_THIN');
    expect(r.metrics.cascadeBeatCount).toBe(0);
    expect(r.metrics.cascadeStartsAtSec).toEqual([]);
  });

  it('second beat after cascade window does not count (猪圈: 种薄荷 must land early)', () => {
    const shots: S[] = [
      { durSec: 3, beatRole: 'hook' },
      { durSec: 6, beatRole: 'setup' }, // ends at 9s — past default 8s window start for next
      { durSec: 2, beatRole: 'increment' }, // starts at 9s → outside window
      { durSec: 20, beatRole: 'increment' },
      { durSec: 20, beatRole: 'reversal' },
      { durSec: 9, beatRole: 'cliffhanger' },
    ];
    const r = evaluateOpeningCascade(spec(shots));
    expect(r.metrics.cascadeBeatCount).toBe(1);
    expect(failCodes(r)).toContain('CASCADE_THIN');
  });

  it('hook + reversal both in window counts (三层叠钩中的两拍即可 PASS)', () => {
    const shots: S[] = [
      { durSec: 2, beatRole: 'hook' },
      { durSec: 3, beatRole: 'reversal' },
      { durSec: 10, beatRole: 'setup' },
      { durSec: 20, beatRole: 'increment' },
      { durSec: 15, beatRole: 'cliffhanger' },
    ];
    const r = evaluateOpeningCascade(spec(shots));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.cascadeRoles).toEqual(['hook', 'reversal']);
  });

  it('three stacked hooks within window → PASS and cascadeBeatCount=3', () => {
    const shots: S[] = [
      { durSec: 2, beatRole: 'hook' },
      { durSec: 2, beatRole: 'hook' },
      { durSec: 2, beatRole: 'increment' },
      { durSec: 20, beatRole: 'setup' },
      { durSec: 20, beatRole: 'cliffhanger' },
    ];
    const r = evaluateOpeningCascade(spec(shots));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.cascadeBeatCount).toBe(3);
  });

  it('all cascade beats same role → CASCADE_FLAT WARN (still PASS if count ok)', () => {
    const shots: S[] = [
      { durSec: 2, beatRole: 'hook' },
      { durSec: 2, beatRole: 'hook' },
      { durSec: 20, beatRole: 'setup' }, // increment kept outside window so cascade stays hook-only
      { durSec: 20, beatRole: 'cliffhanger' },
    ];
    const r = evaluateOpeningCascade(spec(shots));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.cascadeRoles).toEqual(['hook', 'hook']);
    expect(warnCodes(r)).toContain('CASCADE_FLAT');
  });

  it('custom minCascadeBeats=3 requires three beats', () => {
    const r = evaluateOpeningCascade(spec(goodCascade()), { minCascadeBeats: 3 });
    expect(failCodes(r)).toContain('CASCADE_THIN');
    expect(r.thresholds.minCascadeBeats).toBe(3);
  });

  it('custom cascadeWindowSec=4 drops the second beat at t=2 if first is longer', () => {
    const shots: S[] = [
      { durSec: 3, beatRole: 'hook' },
      { durSec: 2, beatRole: 'increment' }, // starts at 3 < 4 → still in
      { durSec: 20, beatRole: 'setup' },
      { durSec: 20, beatRole: 'cliffhanger' },
    ];
    expect(evaluateOpeningCascade(spec(shots), { cascadeWindowSec: 4 }).verdict).toBe('PASS');
    const late: S[] = [
      { durSec: 5, beatRole: 'hook' },
      { durSec: 2, beatRole: 'increment' }, // starts at 5 > 4
      { durSec: 20, beatRole: 'setup' },
      { durSec: 20, beatRole: 'cliffhanger' },
    ];
    expect(failCodes(evaluateOpeningCascade(spec(late), { cascadeWindowSec: 4 }))).toContain(
      'CASCADE_THIN',
    );
  });

  it('unknown beatRole → INVALID_ROLE FAIL', () => {
    const shots = goodCascade();
    shots[2].beatRole = 'twist';
    expect(failCodes(evaluateOpeningCascade(spec(shots)))).toContain('INVALID_ROLE');
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateOpeningCascade({ episode: 'T', shots: 'nope' });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('CLI script exists and documents exit codes', () => {
    const src = readFileSync(resolve(__dirname, '../../../scripts/opening-cascade-check.ts'), 'utf8');
    expect(src).toMatch(/Exit 0 PASS/);
    expect(src).toMatch(/28 FAIL/);
    expect(src).toMatch(/evaluateOpeningCascade/);
  });
});
