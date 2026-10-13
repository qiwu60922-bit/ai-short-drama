/** Wave14 ep01 ShotSpec/BeatPlan → MultiShotList converter (pure, offline). */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { convertShotSpecToMultiShot, buildShotPrompt } from '@/agents/assembly/beatplan-to-multishot';

const fx = (n: string) => JSON.parse(readFileSync(resolve(__dirname, '../../fixtures/wave14-ep01', n), 'utf8'));
const SPEC = fx('SHOT_SPEC.json');
const BEAT = fx('WAVE14_EP01_BEATPLAN.json');
const bind = (id: string, c: string) => ({ characterId: id, appearanceRevisionId: `apr-${id}-r1`, refContentSha256: c.repeat(64), appearanceContentSha256: c.repeat(64), firstFramePath: `refs/${id}.png` });
const bindings = { 'qi-ye': bind('qi-ye', 'a'), 'fei-yue-li': bind('fei-yue-li', 'b'), 'zhui-yu-shitu': bind('zhui-yu-shitu', 'c') };
const sceneRef = bind('scene-academy-night', 'd');

describe('ShotSpec → MultiShotList', () => {
  it('ep01 real fixture converts: 16 shots, 90s (v2 方案A), range from BeatPlan 60–90', () => {
    const r = convertShotSpecToMultiShot(SPEC, BEAT, { workDir: '/w', bindings, sceneRef });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.list.shots).toHaveLength(16);
    expect(r.list.episodeId).toBe('ep01');
    expect(r.list.durationRange).toEqual({ minSeconds: 60, maxSeconds: 90 });
    expect(r.list.shots.filter((x) => ['S01', 'S03'].includes(x.shotId))).toHaveLength(2);
    expect(r.list.mode).toBe('dry-run');
    expect(r.list.shots.map((s) => s.order)).toEqual([...Array(16).keys()]);
    expect(r.list.shots[0].seed).toBe('1000');
    expect(r.leadByShot.S01).toBeNull();
    expect(r.leadByShot.S10).toBe('zhui-yu-shitu');
    expect(r.list.shots.find((s) => s.shotId === 'S07')?.ref?.characterId).toBe('fei-yue-li');
    expect(r.list.shots.find((s) => s.shotId === 'S01')?.ref?.characterId).toBe('scene-academy-night');
  });
  it('missing character binding / sceneRef → problems, nothing guessed', () => {
    const r = convertShotSpecToMultiShot(SPEC, BEAT, { workDir: '/w', bindings: { 'qi-ye': bindings['qi-ye'] } });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const ids = r.problems.filter((p) => p.code === 'NO_REF_BINDING').map((p) => p.shotId);
    expect(ids).toEqual(expect.arrayContaining(['S01', 'S05', 'S06', 'S07', 'S14']));
    expect(ids).not.toContain('S02');
  });
  it('BeatPlan/ShotSpec inconsistencies are reported', () => {
    const beat = structuredClone(BEAT);
    beat.beats[8].shots = ['S09a', 'S09b'];
    beat.beats[0].dur = 7;
    const spec = structuredClone(SPEC);
    spec.shots[1].beatId = 'B99';
    const r = convertShotSpecToMultiShot(spec, beat, { workDir: '/w', bindings, sceneRef });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const codes = r.problems.map((p) => p.code);
    expect(codes).toEqual(expect.arrayContaining(['BEAT_SHOT_MISMATCH', 'BEAT_DURATION_MISMATCH', 'UNKNOWN_BEAT']));
  });
  it('v1 96s spec: default 60–90 rejects; override respected', () => {
    const SPEC = fx('SHOT_SPEC.v1-96s.json');
    const r = convertShotSpecToMultiShot(SPEC, undefined, { workDir: '/w', bindings, sceneRef });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.problems[0]).toMatchObject({ code: 'DURATION_OUT_OF_RANGE' });
    const r2 = convertShotSpecToMultiShot(SPEC, undefined, { workDir: '/w', bindings, sceneRef, durationRange: { minSeconds: 60, maxSeconds: 80 } });
    expect(r2.ok).toBe(false);
    const r3 = convertShotSpecToMultiShot(SPEC, undefined, { workDir: '/w', bindings, sceneRef, durationRange: { minSeconds: 90, maxSeconds: 100 } });
    expect(r3.ok).toBe(true);
  });
  it('prompt carries camera/action/state/dialogue/vo/bans', () => {
    const p = buildShotPrompt({ shotId: 'S08', durSec: 8, camera: 'CU', action: 'stand', cast: ['a', 'b'], state: 'daily', dialogue: ['退后。', '你是谁？'], vo: 'v' }, ['no sword']);
    expect(p).toContain('Camera: CU');
    expect(p).toContain('退后。 / 你是谁？');
    expect(p).toContain('Hard bans: no sword');
    expect(buildShotPrompt({ shotId: 'x', durSec: 1, cast: [] })).toContain('scenery');
  });
  it('bad schema → SCHEMA problem', () => {
    const r = convertShotSpecToMultiShot({ episode: 'x' }, undefined, { workDir: '/w', bindings });
    expect(r.ok).toBe(false);
  });
});
