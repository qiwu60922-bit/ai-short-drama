/**
 * V12 Dramakit Structure Gate — 分镜结构/时长/钩子密度机械闸门.
 * Offline, deterministic, ≠Final ≠G3.
 * Rules rewritten (not vendored) from gaoren7716-lab/dramakit scan.py (MIT).
 * https://github.com/gaoren7716-lab/dramakit
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateDramakitShotlist,
  type DramakitShot,
  type DramakitShotlist,
} from '@/agents/assembly/dramakit-structure-gate';

const codes = (r: ReturnType<typeof evaluateDramakitShotlist>) =>
  r.findings.map((f) => f.code);

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

/** Golden AI single PASS: 32 shots, ~123s, ratios + hooks OK. */
function goldenPass(): DramakitShotlist {
  const shots: DramakitShot[] = [];
  // shot 1: ≤3s, 特写 hook, no 旁白
  shots.push({
    no: 1,
    sec: 2,
    size: '特写',
    move: '缓推',
    visual: '手机亮起',
    line: '你敢？',
  });
  // 18 core 4s + 8 core 3s + 4 long takes with dialogue + last
  let no = 2;
  for (let i = 0; i < 18; i++) {
    const hasDlg = i % 2 === 0;
    shots.push({
      no: no++,
      sec: 4,
      size: i % 3 === 0 ? '近景' : '中景',
      move: '固定',
      visual: '对峙',
      line: hasDlg ? '你凭什么这样说' : '无',
    });
  }
  for (let i = 0; i < 8; i++) {
    shots.push({
      no: no++,
      sec: 3,
      size: i % 2 === 0 ? '近景' : '中景',
      move: i === 3 ? '推' : '固定',
      visual: i === 5 ? '突然推门' : '对话',
      line: i % 2 === 0 ? '为什么不说真相' : '无',
    });
  }
  for (let i = 0; i < 4; i++) {
    shots.push({
      no: no++,
      sec: 5,
      size: '中景',
      move: '固定',
      visual: '对峙升级',
      line: '闭嘴',
    });
  }
  // last: ≥5s 余味镜
  shots.push({
    no: no,
    sec: 5,
    size: '近景',
    move: '固定',
    visual: '余味收束',
    line: '我后悔了',
  });
  return { format: 'single', mode: 'ai', shots };
}

describe('evaluateDramakitShotlist', () => {
  it('SCHEMA FAIL on empty/malformed shotlist (no throw)', () => {
    for (const bad of [
      null,
      {},
      { shots: [] },
      { shots: [{ no: 1, sec: 2 }] },
      { shots: 'x' },
    ]) {
      const r = evaluateDramakitShotlist(bad);
      expect(r.pass).toBe(false);
      expect(r.verdict).toBe('FAIL');
      expect(codes(r)).toEqual(['SCHEMA']);
      expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
    }
  });

  it('PASS on golden AI single fixture with NOT_EVALUATED gates', () => {
    const r = evaluateDramakitShotlist(goldenPass());
    expect(r.pass).toBe(true);
    expect(r.verdict).toBe('PASS');
    expect(r.findings.filter((f) => f.severity === 'error')).toEqual([]);
    expect(r.metrics.n).toBe(32);
    expect(r.metrics.totalSec).toBeGreaterThanOrEqual(119);
    expect(r.metrics.totalSec).toBeLessThanOrEqual(161);
    expect(r.metrics.profile).toBe('ai');
    expect(r.metrics.format).toBe('single');
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('HOOK_WINDOW_LONG fail when shot 1 exceeds hook_window_s', () => {
    const bad = clone(goldenPass());
    bad.shots[0].sec = 4;
    const r = evaluateDramakitShotlist(bad);
    expect(codes(r)).toContain('HOOK_WINDOW_LONG');
    expect(r.findings.find((f) => f.code === 'HOOK_WINDOW_LONG')!.severity).toBe(
      'error',
    );
    expect(r.pass).toBe(false);
    expect(r.verdict).toBe('FAIL');
  });

  it('HOOK_WINDOW_NARRATION fail when shot 1 line contains 旁白', () => {
    const bad = clone(goldenPass());
    bad.shots[0].line = '旁白：很久以前';
    const r = evaluateDramakitShotlist(bad);
    expect(codes(r)).toContain('HOOK_WINDOW_NARRATION');
    expect(r.pass).toBe(false);
  });

  it('EMPTY_LONG_TAKE fail when long take has empty/无 content', () => {
    const bad = clone(goldenPass());
    // force a long take without content
    bad.shots[5].sec = 6;
    bad.shots[5].line = '无';
    const r = evaluateDramakitShotlist(bad);
    expect(codes(r)).toContain('EMPTY_LONG_TAKE');
    expect(r.findings.find((f) => f.code === 'EMPTY_LONG_TAKE')!.shotNos).toContain(
      bad.shots[5].no,
    );
    expect(r.pass).toBe(false);
  });

  it('SERIES_ENDING_NO_HOOK fail when series last shot lacks hook keywords', () => {
    const bad = clone(goldenPass());
    bad.format = 'series';
    const last = bad.shots[bad.shots.length - 1];
    last.line = '好的';
    last.visual = '平静收束';
    last.size = '中景';
    last.move = '固定';
    last.sec = 3;
    const r = evaluateDramakitShotlist(bad);
    expect(codes(r)).toContain('SERIES_ENDING_NO_HOOK');
    expect(r.pass).toBe(false);
  });

  it('DURATION_DRIFT warning keeps pass=true', () => {
    const bad = clone(goldenPass());
    // inflate every core shot so total >> 161
    for (const s of bad.shots) {
      if (s.sec === 4) s.sec = 8;
    }
    // keep shot1 short to avoid HOOK_WINDOW_LONG; give long takes content
    bad.shots[0].sec = 2;
    for (const s of bad.shots) {
      if (s.sec >= 5 && !s.line) s.line = '有内容';
      if (s.sec >= 5 && s.line === '无') s.line = '有内容';
    }
    const r = evaluateDramakitShotlist(bad);
    expect(codes(r)).toContain('DURATION_DRIFT');
    expect(r.findings.find((f) => f.code === 'DURATION_DRIFT')!.severity).toBe(
      'warning',
    );
    // may also have other warnings; errors should not include duration
    expect(r.pass).toBe(true);
  });

  it('SHOT_COUNT warning when n outside ai 28-45', () => {
    const few: DramakitShotlist = {
      format: 'single',
      mode: 'ai',
      shots: [
        {
          no: 1,
          sec: 2,
          size: '特写',
          move: '缓推',
          visual: '亮起',
          line: '你敢？',
        },
        {
          no: 2,
          sec: 5,
          size: '近景',
          move: '固定',
          visual: '收',
          line: '后悔',
        },
      ],
    };
    const r = evaluateDramakitShotlist(few);
    expect(codes(r)).toContain('SHOT_COUNT');
    expect(r.findings.find((f) => f.code === 'SHOT_COUNT')!.severity).toBe(
      'warning',
    );
    // may FAIL for other blocking issues (ratios etc.) — check warning present
    expect(r.findings.some((f) => f.code === 'SHOT_COUNT')).toBe(true);
  });

  it('DIALOGUE_RATIO warning when dialogue share is out of band', () => {
    const bad = clone(goldenPass());
    // strip almost all dialogue → ratio too low; keep content on long takes via subtitle prefix
    for (let i = 1; i < bad.shots.length - 1; i++) {
      bad.shots[i].line = bad.shots[i].sec >= 5 ? '—字幕' : '无';
    }
    const r = evaluateDramakitShotlist(bad);
    expect(codes(r)).toContain('DIALOGUE_RATIO');
    expect(r.findings.find((f) => f.code === 'DIALOGUE_RATIO')!.severity).toBe(
      'warning',
    );
    expect(r.pass).toBe(true);
  });

  it('HOOK_GAP warning when a 20s window has no hook signal', () => {
    // First window has hook; next full 20s window is plain (no size/move/line/visual/long-take hooks)
    const shots: DramakitShot[] = [
      {
        no: 1,
        sec: 2,
        size: '特写',
        move: '缓推',
        visual: '亮起',
        line: '你敢？',
      },
    ];
    // 5×4s = 20s closes first window (with shot1 hook), then 5×4s = 20s plain gap
    for (let i = 0; i < 10; i++) {
      shots.push({
        no: i + 2,
        sec: 4,
        size: '中景',
        move: '固定',
        visual: '日常走路',
        line: '今天天气不错',
      });
    }
    shots.push({
      no: 12,
      sec: 5,
      size: '近景',
      move: '固定',
      visual: '收束',
      line: '后悔',
    });
    const r = evaluateDramakitShotlist({
      format: 'single',
      mode: 'ai',
      shots,
    });
    expect(codes(r)).toContain('HOOK_GAP');
    expect(r.findings.find((f) => f.code === 'HOOK_GAP')!.severity).toBe(
      'warning',
    );
  });

  it('live mode widens hook_window_s to 6 and reaction_max_sec to 6', () => {
    const liveOk = clone(goldenPass());
    liveOk.mode = 'live';
    // shot 1 at 5s is FAIL under ai (hook_window 3) but OK under live (6)
    liveOk.shots[0].sec = 5;
    liveOk.shots[0].line = '你敢？';
    // trim to live shot count band 6-12 while keeping ratios plausible
    liveOk.shots = [
      {
        no: 1,
        sec: 5,
        size: '特写',
        move: '缓推',
        visual: '亮起',
        line: '你敢？',
      },
      {
        no: 2,
        sec: 8,
        size: '中景',
        move: '固定',
        visual: '对峙',
        line: '凭什么',
      },
      {
        no: 3,
        sec: 7,
        size: '近景',
        move: '固定',
        visual: '对话',
        line: '为什么',
      },
      {
        no: 4,
        sec: 6,
        size: '中景',
        move: '固定',
        visual: '推门',
        line: '无',
      },
      {
        no: 5,
        sec: 9,
        size: '近景',
        move: '固定',
        visual: '对峙',
        line: '闭嘴',
      },
      {
        no: 6,
        sec: 5,
        size: '特写',
        move: '固定',
        visual: '反应',
        line: '无', // reaction 5s ≤ live reaction_max 6 → ok; would warn under ai (3)
      },
      {
        no: 7,
        sec: 8,
        size: '中景',
        move: '固定',
        visual: '拥抱',
        line: '其实我不想',
      },
      {
        no: 8,
        sec: 6,
        size: '近景',
        move: '固定',
        visual: '余味',
        line: '后悔',
      },
    ];
    const rLive = evaluateDramakitShotlist(liveOk);
    expect(rLive.metrics.profile).toBe('live');
    expect(codes(rLive)).not.toContain('HOOK_WINDOW_LONG');
    expect(codes(rLive)).not.toContain('REACTION_LONG');

    const rAi = evaluateDramakitShotlist({ ...liveOk, mode: 'ai' });
    expect(codes(rAi)).toContain('HOOK_WINDOW_LONG');
    expect(codes(rAi)).toContain('REACTION_LONG');
  });

  it('PASS ≠ G3: even a perfect run leaves V11_G3 NOT_EVALUATED', () => {
    const r = evaluateDramakitShotlist(goldenPass());
    expect(r.pass).toBe(true);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('ENDING_SHORT warning for single when last shot < long_take_sec', () => {
    const bad = clone(goldenPass());
    const last = bad.shots[bad.shots.length - 1];
    last.sec = 3;
    last.line = '后悔';
    const r = evaluateDramakitShotlist(bad);
    expect(codes(r)).toContain('ENDING_SHORT');
    expect(r.findings.find((f) => f.code === 'ENDING_SHORT')!.severity).toBe(
      'warning',
    );
    expect(r.pass).toBe(true);
  });
});
