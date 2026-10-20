/**
 * V12 Clip Storyboard Gate — Clip 纸面 ≥6 镜·承接/交给·钉点上镜·禁空壳资产.
 * Offline, deterministic, ≠Final ≠G3.
 * Rules rewritten (not vendored) from wwaa34682-lab/novel-to-short-drama-skill
 * 步骤4 Clip 分镜 + error-ledger G01/G02/G08/G11 (MIT).
 * https://github.com/wwaa34682-lab/novel-to-short-drama-skill
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateClipStoryboard,
  type ClipStoryboardInput,
  type ClipShot,
  type ClipItem,
} from '@/agents/assembly/clip-storyboard-gate';

const codes = (r: ReturnType<typeof evaluateClipStoryboard>) =>
  r.findings.map((f) => f.code);

const errorCodes = (r: ReturnType<typeof evaluateClipStoryboard>) =>
  r.findings.filter((f) => f.severity === 'error').map((f) => f.code);

const warnCodes = (r: ReturnType<typeof evaluateClipStoryboard>) =>
  r.findings.filter((f) => f.severity === 'warning').map((f) => f.code);

function sixShots(opts?: {
  nailPoints?: Array<string | undefined>;
  lines?: Array<string | undefined>;
}): ClipShot[] {
  const nails = opts?.nailPoints ?? [
    '开场承接',
    '冲突升级',
    undefined,
    undefined,
    undefined,
    '收束钉',
  ];
  const lines = opts?.lines ?? [
    '你敢？',
    '我凭什么。',
    undefined,
    undefined,
    undefined,
    '走着瞧。',
  ];
  return Array.from({ length: 6 }, (_, i) => ({
    no: i + 1,
    visual: `画面${i + 1}`,
    size: i === 0 ? '特写' : '中景',
    angle: '平视',
    move: '固定',
    line: lines[i],
    nailPoint: nails[i],
  }));
}

function goldenInput(): ClipStoryboardInput {
  const clipA: ClipItem = {
    id: '1-1',
    title: '开场对峙',
    suggestedDurationSec: 15,
    handoffToNext: '镜头停在门缝，A 手握刀柄',
    nailPoints: ['开场承接', '冲突升级', '收束钉'],
    shots: sixShots(),
    assetRefs: ['char-a', 'loc-room'],
    isCombat: false,
  };
  const clipB: ClipItem = {
    id: '1-2',
    title: '走廊追逐',
    suggestedDurationSec: 15,
    handoffFromPrev: '从门缝切入，A 拔刀冲出',
    nailPoints: ['开场承接', '冲突升级', '收束钉'],
    shots: sixShots({
      nailPoints: ['开场承接', '冲突升级', undefined, undefined, undefined, '收束钉'],
      lines: ['站住！', '别过来。', undefined, undefined, undefined, '逃不掉。'],
    }),
    assetRefs: ['char-a'],
    isCombat: false,
  };
  return {
    clips: [clipA, clipB],
    assets: [
      { id: 'char-a', status: '可用' },
      { id: 'loc-room', status: '可用' },
    ],
    pipeline: { previousStepFormalPass: true },
    checkMode: 'paper',
  };
}

describe('evaluateClipStoryboard', () => {
  it('SCHEMA FAIL on empty/malformed input (no throw)', () => {
    for (const bad of [
      null,
      undefined,
      {},
      { clips: [] },
      { clips: 'x' },
      { clips: [{ id: '1-1' }] },
      { clips: [{ id: '1-1', nailPoints: [], shots: 'bad' }] },
    ]) {
      const r = evaluateClipStoryboard(bad);
      expect(r.pass).toBe(false);
      expect(r.verdict).toBe('FAIL');
      expect(codes(r)).toContain('SCHEMA');
      expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    }
  });

  it('golden PASS: 2 clips ≥6 shots, handoff, nails, usable assets, non-combat', () => {
    const r = evaluateClipStoryboard(goldenInput());
    expect(r.pass).toBe(true);
    expect(r.verdict).toBe('PASS');
    expect(errorCodes(r)).toEqual([]);
    expect(r.metrics.clipCount).toBe(2);
    expect(r.metrics.shotCount).toBe(12);
    expect(r.metrics.errorCount).toBe(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('CLIP_SHOT_MIN error when a clip has fewer than 6 shots', () => {
    const input = goldenInput();
    input.clips[0].shots = sixShots().slice(0, 5);
    const r = evaluateClipStoryboard(input);
    expect(r.pass).toBe(false);
    expect(errorCodes(r)).toContain('CLIP_SHOT_MIN');
    expect(r.findings.some((f) => f.code === 'CLIP_SHOT_MIN' && f.clipId === '1-1')).toBe(
      true,
    );
  });

  it('HANDOFF_MISSING error for middle/last without fromPrev or non-last without toNext', () => {
    const input = goldenInput();
    delete input.clips[1].handoffFromPrev;
    input.clips[0].handoffToNext = '   ';
    const r = evaluateClipStoryboard(input);
    expect(r.pass).toBe(false);
    expect(errorCodes(r).filter((c) => c === 'HANDOFF_MISSING').length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('NAIL_OFF_CAMERA error when a nailPoint is never covered by shot.nailPoint', () => {
    const input = goldenInput();
    input.clips[0].nailPoints = ['开场承接', '冲突升级', '收束钉', '未上镜钉'];
    const r = evaluateClipStoryboard(input);
    expect(r.pass).toBe(false);
    expect(errorCodes(r)).toContain('NAIL_OFF_CAMERA');
  });

  it('NAIL_OFF_CAMERA skipped when nailPoints empty', () => {
    const input = goldenInput();
    input.clips[0].nailPoints = [];
    input.clips[0].shots = sixShots({ nailPoints: Array(6).fill(undefined) });
    const r = evaluateClipStoryboard(input);
    expect(errorCodes(r)).not.toContain('NAIL_OFF_CAMERA');
  });

  it('SHELL_ASSET error when assetRefs point to non-可用 assets', () => {
    const input = goldenInput();
    input.assets = [
      { id: 'char-a', status: '空壳' },
      { id: 'loc-room', status: '可用' },
    ];
    const r = evaluateClipStoryboard(input);
    expect(r.pass).toBe(false);
    expect(errorCodes(r)).toContain('SHELL_ASSET');
  });

  it('COMBAT_CAUSALITY error when isCombat and combatBeats empty or lack →', () => {
    const emptyBeats = goldenInput();
    emptyBeats.clips[1].isCombat = true;
    emptyBeats.clips[1].combatBeats = [];
    expect(errorCodes(evaluateClipStoryboard(emptyBeats))).toContain('COMBAT_CAUSALITY');

    const noArrow = goldenInput();
    noArrow.clips[1].isCombat = true;
    noArrow.clips[1].combatBeats = ['A 打 B 然后赢了'];
    expect(errorCodes(evaluateClipStoryboard(noArrow))).toContain('COMBAT_CAUSALITY');

    const ok = goldenInput();
    ok.clips[1].isCombat = true;
    ok.clips[1].combatBeats = ['A→B 一记侧踢→B 倒地'];
    expect(errorCodes(evaluateClipStoryboard(ok))).not.toContain('COMBAT_CAUSALITY');
  });

  it('STEP_SKIP error when previousStepFormalPass === false; undefined skips', () => {
    const fail = goldenInput();
    fail.pipeline = { previousStepFormalPass: false };
    expect(errorCodes(evaluateClipStoryboard(fail))).toContain('STEP_SKIP');

    const skip = goldenInput();
    skip.pipeline = {};
    expect(errorCodes(evaluateClipStoryboard(skip))).not.toContain('STEP_SKIP');
  });

  it('REF_OVERFLOW and RELEASE_MISSING only in pre-gen mode', () => {
    const paper = goldenInput();
    paper.checkMode = 'paper';
    paper.pipeline = {
      previousStepFormalPass: true,
      maxRefImagesPerGen: 5,
      releasePhrasePresent: false,
    };
    const paperR = evaluateClipStoryboard(paper);
    expect(errorCodes(paperR)).not.toContain('REF_OVERFLOW');
    expect(errorCodes(paperR)).not.toContain('RELEASE_MISSING');

    const pre = goldenInput();
    pre.checkMode = 'pre-gen';
    pre.pipeline = {
      previousStepFormalPass: true,
      maxRefImagesPerGen: 3,
      releasePhrasePresent: false,
    };
    const preR = evaluateClipStoryboard(pre);
    expect(errorCodes(preR)).toContain('REF_OVERFLOW');
    expect(errorCodes(preR)).toContain('RELEASE_MISSING');
    expect(preR.pass).toBe(false);
  });

  it('DIALOGUE_RATE and CLIP_DURATION are warnings; pass can stay true', () => {
    const input = goldenInput();
    // duration far from 15
    input.clips[0].suggestedDurationSec = 25;
    // missing duration → CLIP_DURATION warning; dialogue vs default 15
    delete input.clips[1].suggestedDurationSec;
    // pack long dialogue into clip 0 (> 25*4 = 100 printable chars)
    const longLine = '这是一段故意写得很长很长的对白用来触发语速告警检查一二三四五六七八九十';
    input.clips[0].shots = sixShots({
      lines: [longLine, longLine, longLine, longLine, undefined, undefined],
      nailPoints: ['开场承接', '冲突升级', undefined, undefined, undefined, '收束钉'],
    });
    const r = evaluateClipStoryboard(input);
    expect(warnCodes(r)).toContain('CLIP_DURATION');
    expect(warnCodes(r)).toContain('DIALOGUE_RATE');
    expect(errorCodes(r)).toEqual([]);
    expect(r.pass).toBe(true);
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.warningCount).toBeGreaterThanOrEqual(2);
    expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
  });

  it('gates always NOT_EVALUATED even on FAIL (never forge G3 PASS)', () => {
    const r = evaluateClipStoryboard({ clips: [] });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(r.pass).toBe(false);
  });
});
