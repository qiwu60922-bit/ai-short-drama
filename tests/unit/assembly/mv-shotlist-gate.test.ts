/**
 * V12 MV Shotlist Gate — offline 分镜表时间连续·景别分布·段落时长.
 * Method rewritten (MIT) from blackiseki/anime-mv-art-direction
 * scripts/shotlist_check.py:
 * https://github.com/blackiseki/anime-mv-art-direction
 * ≠Final ≠G3. No video/ffmpeg / MiniMax / paid API.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMvShotlist } from '@/agents/assembly/mv-shotlist-gate';

const failCodes = (r: ReturnType<typeof evaluateMvShotlist>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateMvShotlist>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

/** Continuous contiguous shots covering intro→verse→chorus→outro with mixed 景别. */
function goldenShot(
  overrides: Record<string, unknown> = {},
) {
  return {
    no: '1',
    start: 0,
    end: 3,
    dur: 3,
    section: 'intro',
    lyric: '',
    shot: 'FS',
    angle: 'eye',
    subject: 'hero',
    move: 'static',
    trans: 'cut',
    beat: '1',
    asset: 'A1',
    ...overrides,
  };
}

function golden(overrides: Record<string, unknown> = {}) {
  const shots = [
    goldenShot({ no: '1', start: 0, end: 3, dur: 3, section: 'intro', shot: 'FS' }),
    goldenShot({
      no: '2',
      start: 3,
      end: 5.5,
      dur: 2.5,
      section: 'verse',
      shot: 'MS',
      lyric: '第一句',
    }),
    goldenShot({
      no: '3',
      start: 5.5,
      end: 7,
      dur: 1.5,
      section: 'verse',
      shot: 'CU',
      lyric: '第二句',
    }),
    goldenShot({
      no: '4',
      start: 7,
      end: 8,
      dur: 1,
      section: 'chorus',
      shot: 'MCU',
      lyric: '副歌',
    }),
    goldenShot({
      no: '5',
      start: 8,
      end: 11,
      dur: 3,
      section: 'outro',
      shot: 'ELS',
    }),
  ];
  return {
    fps: 24,
    shots,
    ...overrides,
  };
}

describe('evaluateMvShotlist', () => {
  it('golden continuous shotlist → PASS; gates untouched', () => {
    const r = evaluateMvShotlist(golden());
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
    expect(r.metrics.shotCount).toBe(5);
    expect(r.metrics.totalDur).toBeCloseTo(11, 5);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('accepts bare shots array input → PASS', () => {
    const r = evaluateMvShotlist(golden().shots);
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
  });

  it('accepts m:ss / h:mm:ss time strings → PASS', () => {
    const r = evaluateMvShotlist({
      fps: 24,
      shots: [
        goldenShot({ no: '1', start: '0:00', end: '0:03', dur: 3, section: 'intro', shot: 'FS' }),
        goldenShot({
          no: '2',
          start: '0:03',
          end: '0:05.5',
          dur: 2.5,
          section: 'verse',
          shot: 'CU',
          lyric: '词',
        }),
        goldenShot({
          no: '3',
          start: '0:05.5',
          end: '0:08',
          dur: 2.5,
          section: 'outro',
          shot: 'ELS',
        }),
      ],
    });
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
  });

  it('schema garbage / empty shots → SCHEMA FAIL', () => {
    expect(failCodes(evaluateMvShotlist({ nope: true }))).toContain('SCHEMA');
    expect(failCodes(evaluateMvShotlist({ fps: 24, shots: [] }))).toContain('SCHEMA');
    expect(failCodes(evaluateMvShotlist(null))).toContain('SCHEMA');
  });

  it('unparseable start/end → TIME_PARSE FAIL', () => {
    const r = evaluateMvShotlist(
      golden({
        shots: [
          goldenShot({ no: '1', start: 'xx', end: 3, dur: 3, shot: 'FS' }),
          goldenShot({ no: '2', start: 3, end: 6, dur: 3, shot: 'CU', section: 'verse' }),
        ],
      }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('TIME_PARSE');
  });

  it('end <= start or dur <= 0 → DUR_NONPOSITIVE FAIL', () => {
    const r = evaluateMvShotlist(
      golden({
        shots: [
          goldenShot({ no: '1', start: 0, end: 0, dur: 0, shot: 'FS' }),
          goldenShot({ no: '2', start: 0, end: 3, dur: 3, shot: 'CU', section: 'verse' }),
        ],
      }),
    );
    expect(failCodes(r)).toContain('DUR_NONPOSITIVE');
  });

  it('adjacent overlap → TIME_OVERLAP FAIL', () => {
    const r = evaluateMvShotlist(
      golden({
        shots: [
          goldenShot({ no: '1', start: 0, end: 4, dur: 4, shot: 'FS', section: 'intro' }),
          goldenShot({
            no: '2',
            start: 3,
            end: 6,
            dur: 3,
            shot: 'CU',
            section: 'verse',
            lyric: '词',
          }),
          goldenShot({
            no: '3',
            start: 6,
            end: 9,
            dur: 3,
            shot: 'ELS',
            section: 'outro',
          }),
        ],
      }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('TIME_OVERLAP');
  });

  it('gap > 0.1s → TIME_GAP FAIL', () => {
    const r = evaluateMvShotlist(
      golden({
        shots: [
          goldenShot({ no: '1', start: 0, end: 3, dur: 3, shot: 'FS', section: 'intro' }),
          goldenShot({
            no: '2',
            start: 3.5,
            end: 6,
            dur: 2.5,
            shot: 'CU',
            section: 'verse',
            lyric: '词',
          }),
          goldenShot({
            no: '3',
            start: 6,
            end: 9,
            dur: 3,
            shot: 'ELS',
            section: 'outro',
          }),
        ],
      }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('TIME_GAP');
  });

  it('tiny gap (<=0.1s, >1 frame) → TIME_GAP WARN only (PASS)', () => {
    // fps=24 → 1 frame ≈ 0.0417s; gap 0.08s is >1 frame and <=0.1 → WARN
    const r = evaluateMvShotlist({
      fps: 24,
      shots: [
        goldenShot({ no: '1', start: 0, end: 3, dur: 3, shot: 'FS', section: 'intro' }),
        goldenShot({
          no: '2',
          start: 3.08,
          end: 5.5,
          dur: 2.42,
          shot: 'CU',
          section: 'verse',
          lyric: '词',
        }),
        goldenShot({
          no: '3',
          start: 5.5,
          end: 8.5,
          dur: 3,
          shot: 'ELS',
          section: 'outro',
        }),
      ],
    });
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
    expect(warnCodes(r)).toContain('TIME_GAP');
  });

  it('MS+MCU >55% → SHOT_MS_HEAVY WARN', () => {
    const r = evaluateMvShotlist({
      fps: 24,
      shots: [
        goldenShot({ no: '1', start: 0, end: 2, dur: 2, shot: 'MS', section: 'intro' }),
        goldenShot({
          no: '2',
          start: 2,
          end: 4,
          dur: 2,
          shot: 'MCU',
          section: 'verse',
          lyric: 'a',
        }),
        goldenShot({
          no: '3',
          start: 4,
          end: 6,
          dur: 2,
          shot: 'MS',
          section: 'chorus',
          lyric: 'b',
        }),
        goldenShot({
          no: '4',
          start: 6,
          end: 8,
          dur: 2,
          shot: 'MCU',
          section: 'outro',
        }),
      ],
    });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('SHOT_MS_HEAVY');
    // also no CU/ECU and no ELS/FS
    expect(warnCodes(r)).toContain('SHOT_NO_CU');
    expect(warnCodes(r)).toContain('SHOT_NO_WIDE');
  });

  it('no CU/ECU → SHOT_NO_CU WARN', () => {
    const r = evaluateMvShotlist({
      fps: 24,
      shots: [
        goldenShot({ no: '1', start: 0, end: 3, dur: 3, shot: 'FS', section: 'intro' }),
        goldenShot({
          no: '2',
          start: 3,
          end: 5.5,
          dur: 2.5,
          shot: 'MS',
          section: 'verse',
          lyric: '词',
        }),
        goldenShot({
          no: '3',
          start: 5.5,
          end: 8.5,
          dur: 3,
          shot: 'ELS',
          section: 'outro',
        }),
      ],
    });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('SHOT_NO_CU');
    expect(warnCodes(r)).not.toContain('SHOT_NO_WIDE');
  });

  it('no ELS/FS → SHOT_NO_WIDE WARN', () => {
    const r = evaluateMvShotlist({
      fps: 24,
      shots: [
        goldenShot({ no: '1', start: 0, end: 3, dur: 3, shot: 'MS', section: 'intro' }),
        goldenShot({
          no: '2',
          start: 3,
          end: 5,
          dur: 2,
          shot: 'CU',
          section: 'verse',
          lyric: '词',
        }),
        goldenShot({
          no: '3',
          start: 5,
          end: 8,
          dur: 3,
          shot: 'MCU',
          section: 'outro',
        }),
      ],
    });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('SHOT_NO_WIDE');
  });

  it('section duration far off → SECTION_DUR_OFF WARN', () => {
    // chorus reference 0.4–2.0; threshold 0.55*0.4=0.22 / 1.9*2=3.8
    // use dur=8 which is >> 3.8
    const r = evaluateMvShotlist({
      fps: 24,
      shots: [
        goldenShot({
          no: '1',
          start: 0,
          end: 8,
          dur: 8,
          shot: 'CU',
          section: 'chorus',
          lyric: '长副歌',
        }),
        goldenShot({
          no: '2',
          start: 8,
          end: 11,
          dur: 3,
          shot: 'FS',
          section: 'outro',
        }),
      ],
    });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('SECTION_DUR_OFF');
  });

  it('fx items >2 → FX_STACK WARN', () => {
    const r = evaluateMvShotlist({
      fps: 24,
      shots: [
        goldenShot({
          no: '1',
          start: 0,
          end: 3,
          dur: 3,
          shot: 'FS',
          section: 'intro',
          fx: 'glow+shake+blur',
        }),
        goldenShot({
          no: '2',
          start: 3,
          end: 5,
          dur: 2,
          shot: 'CU',
          section: 'verse',
          lyric: '词',
        }),
        goldenShot({
          no: '3',
          start: 5,
          end: 8,
          dur: 3,
          shot: 'ELS',
          section: 'outro',
        }),
      ],
    });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('FX_STACK');
  });

  it('bpm with low beat-align ratio → BEAT_ALIGN_LOW WARN', () => {
    // bpm=60 → beat=1s; starts at 0, 1.4, 2.8 → only first on beat
    const r = evaluateMvShotlist({
      fps: 24,
      bpm: 60,
      shots: [
        goldenShot({ no: '1', start: 0, end: 1.4, dur: 1.4, shot: 'FS', section: 'intro' }),
        goldenShot({
          no: '2',
          start: 1.4,
          end: 2.8,
          dur: 1.4,
          shot: 'CU',
          section: 'verse',
          lyric: '词',
        }),
        goldenShot({
          no: '3',
          start: 2.8,
          end: 5.8,
          dur: 3,
          shot: 'ELS',
          section: 'outro',
        }),
      ],
    });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('BEAT_ALIGN_LOW');
    expect(r.metrics.beatAlignRatio).toBeDefined();
    expect(r.metrics.beatAlignRatio!).toBeLessThan(0.7);
  });

  it('empty required field (non-lyric) → REQUIRED_EMPTY WARN; missing no → WARN', () => {
    const r = evaluateMvShotlist({
      fps: 24,
      shots: [
        goldenShot({
          no: '',
          start: 0,
          end: 3,
          dur: 3,
          shot: 'FS',
          section: 'intro',
          subject: '',
        }),
        goldenShot({
          no: '2',
          start: 3,
          end: 5,
          dur: 2,
          shot: 'CU',
          section: 'verse',
          lyric: '词',
        }),
        goldenShot({
          no: '3',
          start: 5,
          end: 8,
          dur: 3,
          shot: 'ELS',
          section: 'outro',
        }),
      ],
    });
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('REQUIRED_EMPTY');
  });

  it('metrics include shotTypeDist', () => {
    const r = evaluateMvShotlist(golden());
    expect(r.metrics.shotTypeDist).toMatchObject({
      FS: 1,
      MS: 1,
      CU: 1,
      MCU: 1,
      ELS: 1,
    });
  });
});
