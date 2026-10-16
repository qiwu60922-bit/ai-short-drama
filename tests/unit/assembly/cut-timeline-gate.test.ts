/**
 * V12 Cut Timeline Gate — 帧级分镜时间轴校验（尺合计·C###·cue·角色引用）, offline, ≠Final ≠G3.
 * Rules adapted (MIT) from RNA4219/video-storyboard-forge scripts/storyboard.py load()/validate.
 * https://github.com/RNA4219/video-storyboard-forge
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateCutTimeline,
  CUT_TIMELINE_DEFAULTS,
} from '@/agents/assembly/cut-timeline-gate';

const cam = { framing: 'WS', angle: 'eye', movement: 'FIX' };
const cut = (id: string, duration_frames: number, extra: Record<string, unknown> = {}) => ({
  id,
  duration_frames,
  scene: '广场',
  action: '主角停步抬头',
  camera: cam,
  characters: ['hero'],
  dialogue: '',
  sound: '',
  on_screen_text: '',
  notes: '',
  cues: [],
  ...extra,
});

const doc = (cuts: ReturnType<typeof cut>[], metaExtra: Record<string, unknown> = {}) => ({
  version: 1 as const,
  meta: {
    title: '样本',
    style: '线稿分镜',
    fps: 24,
    width: 1280,
    height: 720,
    target_frames: cuts.reduce((s, c) => s + (c.duration_frames as number), 0),
    characters: { hero: '短发夹克旅人' },
    ...metaExtra,
  },
  cuts,
});

const codes = (r: ReturnType<typeof evaluateCutTimeline>, sev?: 'FAIL' | 'WARN') =>
  r.findings.filter((x) => !sev || x.severity === sev).map((x) => x.code);

describe('evaluateCutTimeline', () => {
  it('exposes defaults: maxBeatSec=4, minBeatSec=0.5', () => {
    expect(CUT_TIMELINE_DEFAULTS).toMatchObject({ maxBeatSec: 4, minBeatSec: 0.5 });
  });

  it('PASS on a healthy timeline; computes start/end; gates untouched', () => {
    const r = evaluateCutTimeline(doc([cut('C001', 72), cut('C002', 48)]));
    expect(r.verdict).toBe('PASS');
    expect(r.findings.filter((f) => f.severity === 'FAIL')).toEqual([]);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.metrics).toMatchObject({
      cuts: 2,
      total_frames: 120,
      target_frames: 120,
      fps: 24,
      total_seconds: 5,
    });
    expect(r.timeline).toEqual([
      {
        id: 'C001',
        start_frame: 0,
        end_frame: 72,
        duration_frames: 72,
        start_seconds: 0,
        end_seconds: 3,
      },
      {
        id: 'C002',
        start_frame: 72,
        end_frame: 120,
        duration_frames: 48,
        start_seconds: 3,
        end_seconds: 5,
      },
    ]);
  });

  it('SCHEMA FAIL on malformed input (bad version / empty cuts)', () => {
    expect(codes(evaluateCutTimeline({ version: 2, meta: {}, cuts: [] }))).toContain('SCHEMA');
    expect(evaluateCutTimeline(null).verdict).toBe('FAIL');
  });

  it('BAD_FPS FAIL when fps outside 1..120', () => {
    const r = evaluateCutTimeline(doc([cut('C001', 24)], { fps: 240 }));
    expect(codes(r, 'FAIL')).toContain('BAD_FPS');
    expect(r.verdict).toBe('FAIL');
  });

  it('BAD_CANVAS FAIL when width/height odd or out of range', () => {
    const r = evaluateCutTimeline(doc([cut('C001', 24)], { width: 1279, height: 720 }));
    expect(codes(r, 'FAIL')).toContain('BAD_CANVAS');
  });

  it('BAD_CUT_ID FAIL on non-C### or duplicate ids', () => {
    expect(codes(evaluateCutTimeline(doc([cut('S01', 24)])), 'FAIL')).toContain('BAD_CUT_ID');
    expect(
      codes(evaluateCutTimeline(doc([cut('C001', 24), cut('C001', 24)])), 'FAIL'),
    ).toContain('BAD_CUT_ID');
  });

  it('EMPTY_SCENE_ACTION FAIL when scene or action blank', () => {
    expect(
      codes(evaluateCutTimeline(doc([cut('C001', 24, { scene: '  ' })])), 'FAIL'),
    ).toContain('EMPTY_SCENE_ACTION');
  });

  it('UNKNOWN_CAST FAIL when cut references undefined character', () => {
    const r = evaluateCutTimeline(doc([cut('C001', 24, { characters: ['hero', 'villain'] })]));
    expect(codes(r, 'FAIL')).toContain('UNKNOWN_CAST');
    expect(r.findings.find((f) => f.code === 'UNKNOWN_CAST')?.ids).toEqual(['C001', 'villain']);
  });

  it('CUE_OOR FAIL when cue ends past duration_frames', () => {
    const r = evaluateCutTimeline(
      doc([
        cut('C001', 24, {
          cues: [{ start_frame: 0, end_frame: 30, description: '抬头' }],
        }),
      ]),
    );
    expect(codes(r, 'FAIL')).toContain('CUE_OOR');
  });

  it('TOTAL_MISMATCH FAIL when sum(duration) != target_frames', () => {
    const r = evaluateCutTimeline(doc([cut('C001', 24)], { target_frames: 48 }));
    expect(codes(r, 'FAIL')).toContain('TOTAL_MISMATCH');
    expect(r.verdict).toBe('FAIL');
  });

  it('BEAT_TOO_LONG WARN (>4s) keeps verdict PASS; overrideable', () => {
    // 120f @24fps = 5s > 4
    const r = evaluateCutTimeline(doc([cut('C001', 120)]));
    expect(codes(r, 'WARN')).toContain('BEAT_TOO_LONG');
    expect(r.verdict).toBe('PASS');
    expect(codes(evaluateCutTimeline(doc([cut('C001', 120)]), { maxBeatSec: 6 }))).toEqual([]);
  });

  it('BEAT_TOO_SHORT WARN (<0.5s) keeps verdict PASS', () => {
    // 6f @24fps = 0.25s
    const r = evaluateCutTimeline(doc([cut('C001', 6)]));
    expect(codes(r, 'WARN')).toContain('BEAT_TOO_SHORT');
    expect(r.verdict).toBe('PASS');
  });

  it('valid cue inside duration does not flag CUE_OOR', () => {
    const r = evaluateCutTimeline(
      doc([
        cut('C001', 72, {
          cues: [{ start_frame: 24, end_frame: 72, description: '抬头' }],
        }),
      ]),
    );
    expect(codes(r, 'FAIL')).not.toContain('CUE_OOR');
    expect(r.verdict).toBe('PASS');
  });
});
