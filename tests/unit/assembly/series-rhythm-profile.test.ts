/**
 * V12 Series Rhythm Profile — 系列节奏档位（密爽/默认/权谋细糠/慢热）, offline, ≠Final ≠G3.
 * Reverse-engineered (public text/structure only) from 红果 hits 2026-10-21:
 * 《大唐憨婿之我姐姐是太子妃第四季》(多方博弈·朝堂权谋 → intrigue),
 * 《当家主母的自我修养》(掌掴立威密爽 → dense),
 * 《婆婆装瘫七年，我高调离婚！》(蓄仇后巅峰清算；单集仍可走 dense，跨集延迟另候选).
 */
import { describe, expect, it } from 'vitest';
import {
  SERIES_RHYTHM_PROFILES,
  SERIES_RHYTHM_PROFILE_NAMES,
  resolveSeriesRhythmProfile,
  evaluateSeriesRhythm,
} from '@/agents/assembly/series-rhythm-profile';

const spec = (shots: { durSec: number; action?: string; cutMotive?: string }[]) => ({
  episode: 'T',
  shots: shots.map((s, i) => ({ shotId: `S${i}`, cast: [], ...s })),
});

/** 90s / 12 shots × 7.5s — passes default, fails dense maxShot=6 */
const midPace = () =>
  spec(Array.from({ length: 12 }, () => ({ durSec: 7.5, action: 'x·y' })));

/** 90s / 18 shots × 5s with 2 beats — dense-friendly */
const densePace = () =>
  spec(Array.from({ length: 18 }, () => ({ durSec: 5, action: 'a·b' })));

/** 90s / 9 shots × 10s with 2 beats — intrigue-friendly, fails default maxShot=8 */
const intriguePace = () =>
  spec(Array.from({ length: 9 }, () => ({ durSec: 10, action: '朝堂·对峙' })));

describe('SERIES_RHYTHM_PROFILES', () => {
  it('exposes four named profiles with ordered density', () => {
    expect(SERIES_RHYTHM_PROFILE_NAMES).toEqual(['dense', 'default', 'intrigue', 'slow_burn']);
    expect(SERIES_RHYTHM_PROFILES.dense.minEventsPer90s).toBeGreaterThan(
      SERIES_RHYTHM_PROFILES.default.minEventsPer90s,
    );
    expect(SERIES_RHYTHM_PROFILES.default.minEventsPer90s).toBeGreaterThan(
      SERIES_RHYTHM_PROFILES.intrigue.minEventsPer90s,
    );
    expect(SERIES_RHYTHM_PROFILES.intrigue.minEventsPer90s).toBeGreaterThan(
      SERIES_RHYTHM_PROFILES.slow_burn.minEventsPer90s,
    );
    expect(SERIES_RHYTHM_PROFILES.dense.maxShotSeconds).toBeLessThan(
      SERIES_RHYTHM_PROFILES.intrigue.maxShotSeconds,
    );
  });
});

describe('resolveSeriesRhythmProfile', () => {
  it('resolves known names', () => {
    const r = resolveSeriesRhythmProfile('intrigue');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.name).toBe('intrigue');
      expect(r.thresholds).toEqual(SERIES_RHYTHM_PROFILES.intrigue);
    }
  });
  it('rejects unknown profile', () => {
    const r = resolveSeriesRhythmProfile('turbo');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('UNKNOWN_PROFILE');
  });
  it('defaults empty/undefined to default', () => {
    expect(resolveSeriesRhythmProfile(undefined).ok).toBe(true);
    expect(resolveSeriesRhythmProfile('').ok).toBe(true);
    const r = resolveSeriesRhythmProfile(undefined);
    if (r.ok) expect(r.name).toBe('default');
  });
});

describe('evaluateSeriesRhythm', () => {
  it('unknown profile → FAIL UNKNOWN_PROFILE, gates NOT_EVALUATED', () => {
    const r = evaluateSeriesRhythm(densePace(), { profile: 'nope' });
    expect(r.verdict).toBe('FAIL');
    expect(r.profile).toBe('nope');
    expect(r.findings.some((f) => f.code === 'UNKNOWN_PROFILE' && f.severity === 'FAIL')).toBe(
      true,
    );
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('default profile matches prior story-rhythm defaults', () => {
    const r = evaluateSeriesRhythm(midPace(), { profile: 'default' });
    expect(r.verdict).toBe('PASS');
    expect(r.profile).toBe('default');
    expect(r.thresholds).toMatchObject(SERIES_RHYTHM_PROFILES.default);
    expect(r.metrics.profile).toBe('default');
  });

  it('dense rejects mid-pace shots that default would pass (当家主母密爽)', () => {
    expect(evaluateSeriesRhythm(midPace(), { profile: 'default' }).verdict).toBe('PASS');
    const dense = evaluateSeriesRhythm(midPace(), { profile: 'dense' });
    expect(dense.verdict).toBe('FAIL');
    expect(dense.findings.some((f) => f.code === 'SHOT_TOO_LONG')).toBe(true);
  });

  it('dense accepts dense-pace specs', () => {
    const r = evaluateSeriesRhythm(densePace(), { profile: 'dense' });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.eventsPer90s).toBeGreaterThanOrEqual(
      SERIES_RHYTHM_PROFILES.dense.minEventsPer90s,
    );
  });

  it('intrigue accepts longer court shots that default would fail (大唐憨婿权谋)', () => {
    expect(evaluateSeriesRhythm(intriguePace(), { profile: 'default' }).verdict).toBe('FAIL');
    const intrigue = evaluateSeriesRhythm(intriguePace(), { profile: 'intrigue' });
    expect(intrigue.verdict).toBe('PASS');
    expect(intrigue.profile).toBe('intrigue');
  });

  it('slow_burn is looser than intrigue', () => {
    const long = spec(Array.from({ length: 8 }, () => ({ durSec: 11.25, action: 'a·b' })));
    expect(evaluateSeriesRhythm(long, { profile: 'intrigue' }).verdict).toBe('FAIL');
    expect(evaluateSeriesRhythm(long, { profile: 'slow_burn' }).verdict).toBe('PASS');
  });

  it('explicit opts override profile thresholds', () => {
    const r = evaluateSeriesRhythm(midPace(), {
      profile: 'dense',
      maxShotSeconds: 8,
    });
    expect(r.verdict).toBe('PASS');
    expect(r.thresholds.maxShotSeconds).toBe(8);
  });

  it('omitting profile uses default', () => {
    const r = evaluateSeriesRhythm(midPace());
    expect(r.profile).toBe('default');
    expect(r.verdict).toBe('PASS');
  });
});
