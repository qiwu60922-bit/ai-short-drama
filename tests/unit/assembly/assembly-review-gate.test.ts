/**
 * V12 Assembly Review Gate — 成片拼接审核指纹闸门（素材一改旧审核作废·三项必审·路径不逃逸·导出元数据核对）.
 * Offline, deterministic, ≠Final ≠G3.
 * Rules adapted (MIT) from zhsjwjw3888/ai-drama-post `ai-drama-post/scripts/studio.py`
 * load()/check()/review()/gate()/render() metadata check.
 * https://github.com/zhsjwjw3888/ai-drama-post
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateAssemblyPlan,
  recordAssemblyReview,
  verifyRenderOutput,
  timelineSeconds,
  type AssemblyPlan,
  type ClipProbe,
  type AssemblyReviews,
} from '@/agents/assembly/assembly-review-gate';

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
const SHA_C = 'c'.repeat(64);

const plan = (extra: Partial<AssemblyPlan> = {}): AssemblyPlan => ({
  version: 1,
  output: 'renders/ep01-v1.mp4',
  width: 720,
  height: 1280,
  fps: 24,
  codec: 'h264',
  clips: [
    { id: 'S01', path: 'media/S01.mp4', start: 0, duration: 3 },
    { id: 'S02', path: 'media/S02.mp4', start: 0.5, duration: 2 },
  ],
  ...extra,
});

const probes = (): Record<string, ClipProbe> => ({
  'media/S01.mp4': { hasVideo: true, hasAudio: true, durationSec: 3.0 },
  'media/S02.mp4': { hasVideo: true, hasAudio: false, durationSec: 2.5 },
});

const shas = () => ({ 'media/S01.mp4': SHA_A, 'media/S02.mp4': SHA_B });

function fullyReviewed(p: AssemblyPlan): AssemblyReviews {
  let r: AssemblyReviews = {};
  r = recordAssemblyReview(r, p, 'S01', SHA_A, ['visual', 'audio', 'timing'], '实际播放 0–3s，无脸形漂移');
  r = recordAssemblyReview(r, p, 'S02', SHA_B, ['visual', 'audio', 'timing'], '实际播放 0.5–2.5s，口型对齐');
  return r;
}

const codes = (r: { findings: { code: string }[] }) => r.findings.map((f) => f.code);

describe('timelineSeconds', () => {
  it('sums frame-rounded clip durations', () => {
    expect(timelineSeconds(plan())).toBeCloseTo(5, 6);
    expect(
      timelineSeconds(plan({ clips: [{ id: 'x', path: 'm/x.mp4', start: 0, duration: 1.01 }] })),
    ).toBeCloseTo(24 / 24, 6);
  });
});

describe('evaluateAssemblyPlan', () => {
  it('PASS when plan valid, sources long enough, every clip reviewed on current fingerprint', () => {
    const p = plan();
    const r = evaluateAssemblyPlan(p, { probes: probes(), sha256: shas(), reviews: fullyReviewed(p) });
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.metrics.clips).toBe(2);
    expect(r.metrics.timeline_seconds).toBeCloseTo(5, 6);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.scope).toMatch(/final timeline review still required/);
  });

  it('SCHEMA on malformed document', () => {
    const r = evaluateAssemblyPlan({ version: 2 }, {});
    expect(r.verdict).toBe('FAIL');
    expect(codes(r)).toEqual(['SCHEMA']);
  });

  it('BAD_CANVAS for odd dimensions, BAD_FPS_CODEC for fps/codec out of range', () => {
    const r = evaluateAssemblyPlan(plan({ width: 721, fps: 0.5 }), {});
    expect(codes(r)).toContain('BAD_CANVAS');
    expect(codes(r)).toContain('BAD_FPS_CODEC');
    const r2 = evaluateAssemblyPlan({ ...plan(), codec: 'vp9' }, {});
    expect(codes(r2)).toContain('SCHEMA');
  });

  it('BAD_OUTPUT when output is not mp4; OUTPUT_OVERWRITES_INPUT when output equals an input', () => {
    expect(codes(evaluateAssemblyPlan(plan({ output: 'renders/ep.mov' }), {}))).toContain('BAD_OUTPUT');
    expect(codes(evaluateAssemblyPlan(plan({ output: 'media/./S01.mp4' }), {}))).toContain(
      'OUTPUT_OVERWRITES_INPUT',
    );
  });

  it('PATH_ESCAPE for absolute, drive-letter or ../ paths', () => {
    for (const bad of ['/etc/x.mp4', 'C:/media/x.mp4', '../x.mp4', 'media/../../x.mp4', 'D:\\ESC_AI_Work\\a.mp4']) {
      const r = evaluateAssemblyPlan(
        plan({ clips: [{ id: 'S01', path: bad, start: 0, duration: 1 }] }),
        {},
      );
      expect(codes(r), bad).toContain('PATH_ESCAPE');
    }
    expect(codes(evaluateAssemblyPlan(plan({ mix: '../mix.wav' }), {}))).toContain('PATH_ESCAPE');
  });

  it('DUP_CLIP_ID for repeated clip ids', () => {
    const p = plan({
      clips: [
        { id: 'S01', path: 'media/S01.mp4', start: 0, duration: 1 },
        { id: 'S01', path: 'media/S02.mp4', start: 0, duration: 1 },
      ],
    });
    expect(codes(evaluateAssemblyPlan(p, {}))).toContain('DUP_CLIP_ID');
  });

  it('MISSING_PROBE / NO_VIDEO / CLIP_EXCEEDS_SOURCE / CLIP_UNDER_ONE_FRAME', () => {
    const p = plan({
      clips: [
        { id: 'S01', path: 'media/S01.mp4', start: 1, duration: 2.1 },
        { id: 'S02', path: 'media/S02.mp4', start: 0, duration: 0.01 },
        { id: 'S03', path: 'media/S03.mp4', start: 0, duration: 1 },
        { id: 'S04', path: 'media/S04.wav', start: 0, duration: 1 },
      ],
    });
    const pr = { ...probes(), 'media/S04.wav': { hasVideo: false, hasAudio: true, durationSec: 5 } };
    const c = codes(evaluateAssemblyPlan(p, { probes: pr }));
    expect(c).toContain('CLIP_EXCEEDS_SOURCE');
    expect(c).toContain('CLIP_UNDER_ONE_FRAME');
    expect(c).toContain('MISSING_PROBE');
    expect(c).toContain('NO_VIDEO');
  });

  it('tolerates 0.02s probe rounding at the clip tail', () => {
    const p = plan({ clips: [{ id: 'S01', path: 'media/S01.mp4', start: 0, duration: 3.015 }] });
    expect(codes(evaluateAssemblyPlan(p, { probes: probes() }))).not.toContain('CLIP_EXCEEDS_SOURCE');
  });

  it('MIX_NO_AUDIO / MIX_TOO_SHORT for the mix track', () => {
    const p = plan({ mix: 'media/mix.wav' });
    const silent = { ...probes(), 'media/mix.wav': { hasVideo: false, hasAudio: false, durationSec: 9 } };
    expect(codes(evaluateAssemblyPlan(p, { probes: silent }))).toContain('MIX_NO_AUDIO');
    const short = { ...probes(), 'media/mix.wav': { hasVideo: false, hasAudio: true, durationSec: 4.5 } };
    expect(codes(evaluateAssemblyPlan(p, { probes: short }))).toContain('MIX_TOO_SHORT');
  });

  it('SUBTITLE_NOT_ASS for non-.ass subtitles; SUBTITLE_DRAWING when ASS has \\p1 drawing', () => {
    expect(codes(evaluateAssemblyPlan(plan({ subtitles: 'media/cap.srt' }), {}))).toContain(
      'SUBTITLE_NOT_ASS',
    );
    const r = evaluateAssemblyPlan(plan({ subtitles: 'media/cap.ass' }), {
      subtitleText: 'Dialogue: 0,0:00:00.00,0:00:01.00,Default,,0,0,0,,{\\P1}m 0 0 l 100 0',
    });
    expect(codes(r)).toContain('SUBTITLE_DRAWING');
  });

  it('REVIEW_MISSING when a clip has no review record', () => {
    const p = plan();
    const reviews = recordAssemblyReview({}, p, 'S01', SHA_A, ['visual', 'audio', 'timing'], 'ok 看过');
    const r = evaluateAssemblyPlan(p, { probes: probes(), sha256: shas(), reviews });
    expect(r.verdict).toBe('FAIL');
    expect(r.findings.find((f) => f.code === 'REVIEW_MISSING')?.ids).toEqual(['S02']);
  });

  it('REVIEW_STALE when media bytes changed after review (旧审核作废)', () => {
    const p = plan();
    const r = evaluateAssemblyPlan(p, {
      probes: probes(),
      sha256: { ...shas(), 'media/S02.mp4': SHA_C },
      reviews: fullyReviewed(p),
    });
    expect(r.verdict).toBe('FAIL');
    expect(r.findings.find((f) => f.code === 'REVIEW_STALE')?.ids).toEqual(['S02']);
  });

  it('REVIEW_STALE when clip in/out points changed after review', () => {
    const p = plan();
    const reviews = fullyReviewed(p);
    const p2 = plan({
      clips: [
        { id: 'S01', path: 'media/S01.mp4', start: 0, duration: 2.5 },
        { id: 'S02', path: 'media/S02.mp4', start: 0.5, duration: 2 },
      ],
    });
    const r = evaluateAssemblyPlan(p2, { probes: probes(), sha256: shas(), reviews });
    expect(r.findings.find((f) => f.code === 'REVIEW_STALE')?.ids).toEqual(['S01']);
  });

  it('REVIEW_INCOMPLETE when visual/audio/timing not all checked', () => {
    const p = plan();
    let reviews = recordAssemblyReview({}, p, 'S01', SHA_A, ['visual', 'audio', 'timing'], '全看');
    reviews = recordAssemblyReview(reviews, p, 'S02', SHA_B, ['visual'], '只看了画面');
    const r = evaluateAssemblyPlan(p, { probes: probes(), sha256: shas(), reviews });
    const f = r.findings.find((x) => x.code === 'REVIEW_INCOMPLETE');
    expect(f?.ids).toEqual(['S02']);
    expect(f?.message).toMatch(/audio/);
    expect(f?.message).toMatch(/timing/);
  });

  it('MISSING_FINGERPRINT when no current sha256 is supplied for a clip (never assume PASS)', () => {
    const p = plan();
    const r = evaluateAssemblyPlan(p, {
      probes: probes(),
      sha256: { 'media/S01.mp4': SHA_A },
      reviews: fullyReviewed(p),
    });
    expect(r.verdict).toBe('FAIL');
    expect(r.findings.find((f) => f.code === 'MISSING_FINGERPRINT')?.ids).toEqual(['S02']);
  });

  it('never PASS without probes, fingerprints and reviews', () => {
    const r = evaluateAssemblyPlan(plan(), {});
    expect(r.verdict).toBe('FAIL');
    expect(codes(r)).toEqual(expect.arrayContaining(['MISSING_PROBE', 'MISSING_FINGERPRINT', 'REVIEW_MISSING']));
  });
});

describe('recordAssemblyReview', () => {
  it('accumulates partial checks and evidence on the same fingerprint', () => {
    const p = plan();
    let r = recordAssemblyReview({}, p, 'S01', SHA_A, ['visual'], '画面 OK');
    r = recordAssemblyReview(r, p, 'S01', SHA_A, ['audio', 'timing'], '声音时长 OK');
    expect(r.S01.checks).toEqual({ visual: true, audio: true, timing: true });
    expect(r.S01.evidence).toEqual(['画面 OK', '声音时长 OK']);
  });

  it('resets checks and evidence when fingerprint changed (旧检查作废)', () => {
    const p = plan();
    let r = recordAssemblyReview({}, p, 'S01', SHA_A, ['visual', 'audio', 'timing'], '旧版全看');
    r = recordAssemblyReview(r, p, 'S01', SHA_C, ['visual'], '新版只看画面');
    expect(r.S01.sha256).toBe(SHA_C);
    expect(r.S01.checks).toEqual({ visual: true });
    expect(r.S01.evidence).toEqual(['新版只看画面']);
  });

  it('does not mutate the input records', () => {
    const p = plan();
    const a = recordAssemblyReview({}, p, 'S01', SHA_A, ['visual'], 'x 看过');
    const snapshot = JSON.stringify(a);
    recordAssemblyReview(a, p, 'S01', SHA_A, ['audio'], 'y 听过');
    expect(JSON.stringify(a)).toBe(snapshot);
  });

  it('rejects unknown clip, blank evidence, bad sha, unknown check', () => {
    const p = plan();
    expect(() => recordAssemblyReview({}, p, 'S99', SHA_A, ['visual'], 'x')).toThrow(/clip/);
    expect(() => recordAssemblyReview({}, p, 'S01', SHA_A, ['visual'], '   ')).toThrow(/evidence/);
    expect(() => recordAssemblyReview({}, p, 'S01', 'abc', ['visual'], 'x')).toThrow(/sha256/);
    expect(() =>
      recordAssemblyReview({}, p, 'S01', SHA_A, ['vibes' as never], 'x'),
    ).toThrow(/check/);
  });
});

describe('verifyRenderOutput', () => {
  const ok = {
    width: 720,
    height: 1280,
    durationSec: 5.05,
    avgFrameRate: '24/1',
    videoCodec: 'h264',
    audioSampleRate: 48000,
    audioChannels: 2,
    completeDecode: true,
  };

  it('PASS when output metadata matches plan (technical only, not artistic approval)', () => {
    const r = verifyRenderOutput(plan(), ok);
    expect(r.verdict).toBe('PASS');
    expect(r.scope).toMatch(/not visual or listening approval/);
    expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
  });

  it('flags size, duration, fps, codec, audio and decode mismatches', () => {
    const r = verifyRenderOutput(plan({ codec: 'h265' }), {
      width: 1280,
      height: 720,
      durationSec: 5.5,
      avgFrameRate: '30000/1001',
      videoCodec: 'h264',
      audioSampleRate: 44100,
      audioChannels: 1,
      completeDecode: false,
    });
    expect(r.verdict).toBe('FAIL');
    expect(codes(r)).toEqual(
      expect.arrayContaining([
        'RENDER_SIZE',
        'RENDER_DURATION',
        'RENDER_FPS',
        'RENDER_CODEC',
        'RENDER_AUDIO',
        'RENDER_DECODE',
      ]),
    );
  });

  it('h265 plan expects hevc codec name', () => {
    expect(verifyRenderOutput(plan({ codec: 'h265' }), { ...ok, videoCodec: 'hevc' }).verdict).toBe('PASS');
  });
});
