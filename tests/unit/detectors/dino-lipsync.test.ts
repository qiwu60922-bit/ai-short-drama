/** V13 · DINOv2 character/scene + coarse lip-sync (FAIL-only). Never PASS; G3 untouched. */
import { describe, it, expect } from 'vitest';
import { existsSync, statSync, mkdtempSync } from 'node:fs'; import { execFileSync } from 'node:child_process'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { CHARACTER_EMBED_CALIBRATION, DINO_SCENE_THRESHOLD, runCharacterEmbedCheck, runDinoSceneCheck, pythonDino } from '@/agents/detectors/dino-embed';
import { COARSE_LIPSYNC, judgeCoarse, bestLagCorr, runCoarseLipsync, pythonMeasure } from '@/agents/detectors/lipsync-coarse';
import { lockedPackFaces } from '@/agents/detectors/locked-refs';
const u = (a: number) => Float32Array.from([Math.cos(a), Math.sin(a), 0]);
describe('character embed (zhui-yu-shitu)', () => {
  it('frozen calibration', () => { expect(Object.isFrozen(CHARACTER_EMBED_CALIBRATION)).toBe(true); expect(CHARACTER_EMBED_CALIBRATION['zhui-yu-shitu']).toEqual({ cosineMin: 0.66, margin: 0.1 }); });
  const E: Record<string, Float32Array> = { z1: u(0), z2: u(0.3), q1: u(1.4), zf: u(0.2), qf: u(1.35), mid: u(0.85) };
  const embed = async (p: string[]) => Object.fromEntries(p.map(x => [x, E[x] ?? null]));
  it('zhui frame OK; qi-ye frame FAIL; ambiguous FAIL; uncalibrated char NOT_EVALUATED', async () => {
    const r = await runCharacterEmbedCheck({ characterId: 'zhui-yu-shitu', packs: { 'zhui-yu-shitu': ['z1', 'z2'], 'qi-ye': ['q1'] },
      frames: [{ shotId: 'A', path: 'zf' }, { shotId: 'B', path: 'qf' }, { shotId: 'C', path: 'mid' }] }, { embed });
    expect(r.frames.map(f => f.verdict)).toEqual(['MACHINE_OK', 'FAIL', 'FAIL']); expect(r.gate).toBe('FAIL'); expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
    const n = await runCharacterEmbedCheck({ characterId: 'fei-yue-li', packs: {}, frames: [] }, { embed }); expect(n.gate).toBe('NOT_EVALUATED');
    await expect(runCharacterEmbedCheck({ characterId: 'zhui-yu-shitu', packs: {}, frames: [], threshold: 0 } as any)).rejects.toThrow(/frozen/);
  });
  it('scene: dino threshold frozen at 0.68', async () => {
    expect(DINO_SCENE_THRESHOLD).toBe(0.68);
    const r = await runDinoSceneCheck({ refId: 's', refImages: ['z1'], frames: [{ shotId: 'a', path: 'zf' }, { shotId: 'b', path: 'q1' }] }, { embed });
    expect(r.frames.map(f => f.verdict)).toEqual(['MACHINE_OK', 'FAIL']);
  });
});
describe('coarse lip-sync (never MACHINE_OK)', () => {
  const n = 50, speech = Array.from({ length: n }, (_, i) => 0.05 + 0.04 * Math.sin(i / 2));
  it('static mouth during speech → FAIL; anti-correlated → FAIL; correlated → NOT_EVALUATED; no face → NOT_EVALUATED', () => {
    expect(Object.isFrozen(COARSE_LIPSYNC)).toBe(true);
    expect(judgeCoarse({ fps: 25, mouth: Array(n).fill(0.08), energy: speech }).verdict).toBe('FAIL');
    const good = speech.map(e => e * 2); expect(bestLagCorr(good, speech)).toBeGreaterThan(0.99);
    const r = judgeCoarse({ fps: 25, mouth: good, energy: speech }); expect(r.verdict).toBe('NOT_EVALUATED'); expect(r.reason).toMatch(/human/);
    expect(judgeCoarse({ fps: 25, mouth: speech.map(e => 0.3 - e * 2), energy: speech.map((e, i) => (i % 14 < 7 ? e : e)) }).verdict).toBe('FAIL');
    expect(judgeCoarse({ fps: 25, mouth: Array(n).fill(null), energy: speech }).verdict).toBe('NOT_EVALUATED');
  });
  it('report gate: FAIL blocks G3; otherwise NOT_EVALUATED; never MACHINE_OK/PASS', async () => {
    const r = await runCoarseLipsync({ episodeId: 'e', shots: [{ shotId: 'S1', takePath: 'v', audioPath: 'a', hasDialogue: true }] }, { measure: async () => ({ fps: 25, mouth: speech.map(e => e * 2), energy: speech }) });
    expect(r.gate).toBe('NOT_EVALUATED'); expect(JSON.stringify(r)).not.toMatch(/MACHINE_OK|"PASS"/);
    const f = await runCoarseLipsync({ episodeId: 'e', shots: [{ shotId: 'S1', takePath: 'v', hasDialogue: true }] }, { measure: async () => { throw new Error('x'); } });
    expect(f.gate).toBe('FAIL'); expect(f.g3).toBe('BLOCKED');
  });
});
const PY = '/workspace/v11/venv/bin/python', R = '/workspace/v11/wave14/ep01/refs', DM = '/workspace/v11/models/dinov2/dinov2-small.onnx', LM = '/workspace/v11/models/mediapipe/face_landmarker.task';
const real = [PY, DM, `${R}/zhui-yu-shitu/rooftop_gothic.png`, `${R}/qi-ye/SHEET_FULL_DAILY_AWAKENED.png`].every(existsSync);
describe.skipIf(!real)('real DINOv2 on locked refs', () => {
  it('zhui-yu-shitu refs (leave-one-out) MACHINE_OK; qi-ye sheet claimed as zhui → FAIL; refs untouched', async () => {
    process.env.V13_PYTHON = PY; const packs = lockedPackFaces(R); const mt = Object.values(packs).flat().map(p => statSync(p).mtimeMs);
    const r = await runCharacterEmbedCheck({ characterId: 'zhui-yu-shitu', packs, frames: [...packs['zhui-yu-shitu'].map((p, i) => ({ shotId: `z${i}`, path: p })), { shotId: 'qi-ye-sheet', path: packs['qi-ye'][0] }] }, { embed: pythonDino(DM, true) });
    console.log('V13_DINO', JSON.stringify(r.frames.map(f => [f.shotId, f.similarity, f.nearestOther, f.verdict])));
    expect(r.frames.slice(0, -1).every(f => f.verdict === 'MACHINE_OK')).toBe(true); expect(r.frames.at(-1)!.verdict).toBe('FAIL');
    expect(Object.values(packs).flat().map(p => statSync(p).mtimeMs)).toEqual(mt);
  }, 180000);
  it('scene: demo different scene FAIL with margin; same scene variant OK', async () => {
    const d = mkdtempSync(join(tmpdir(), 'v13s-')); execFileSync('ffmpeg', ['-v', 'error', '-i', 'assets/demo-romance.png', '-vf', 'crop=iw*0.8:ih*0.8', join(d, 'crop.png')]);
    const r = await runDinoSceneCheck({ refId: 'demo', refImages: ['assets/demo-romance.png'], frames: [{ shotId: 'crop', path: join(d, 'crop.png') }, { shotId: 'other', path: 'assets/demo-anime.png' }] }, { embed: pythonDino(DM) });
    console.log('V13_DSCENE', JSON.stringify(r.frames.map(f => [f.shotId, f.score, f.verdict])));
    expect(r.frames.map(f => f.verdict)).toEqual(['MACHINE_OK', 'FAIL']);
  }, 120000);
});
describe.skipIf(!(real && existsSync(LM)))('real coarse lip-sync', () => {
  it('still image + tone → static mouth FAIL', async () => {
    const d = mkdtempSync(join(tmpdir(), 'v13l-')); const v = join(d, 's.mp4'), a = join(d, 't.wav');
    execFileSync('ffmpeg', ['-v', 'error', '-loop', '1', '-i', `${R}/fei-yue-li/portrait_hero.png`, '-t', '2', '-r', '25', '-vf', 'scale=480:-2', '-pix_fmt', 'yuv420p', v]);
    execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'sine=f=220:d=2', a]);
    const r = await runCoarseLipsync({ episodeId: 'e', shots: [{ shotId: 'S', takePath: v, audioPath: a, hasDialogue: true }] }, { measure: pythonMeasure(LM) });
    console.log('V13_LIP', JSON.stringify(r.shots)); expect(r.gate).toBe('FAIL'); expect(r.shots[0].reason).toMatch(/static/);
  }, 120000);
});
describe('suite wiring', () => {
  it('zhui identity falls back to DINO; coarse lipsync FAIL blocks G3; overall never PASS', async () => {
    const { runV13Detectors } = await import('@/agents/detectors/v13-suite');
    const E: Record<string, Float32Array> = { z1: u(0), q1: u(1.4), zf: u(0.1) };
    const r = await runV13Detectors({ episodeId: 'e', packFaces: { 'zhui-yu-shitu': ['z1'], 'qi-ye': ['q1'] }, costumeRefs: {},
      shots: [{ shotId: 'S1', takePath: 't', midStill: 'zf', cast: ['zhui-yu-shitu'], dialogue: true, audioPath: 'a' }] },
      { embed: async (p) => E[p] ?? null, charEmbed: async (ps) => Object.fromEntries(ps.map(p => [p, E[p] ?? null])), grab: async () => new Uint8Array(12),
        coarseMeasure: async () => ({ fps: 25, mouth: Array(50).fill(0.08), energy: Array(50).fill(0.1) }) });
    expect(r.identity.map(i => i.gate)).toEqual(['NOT_EVALUATED', 'MACHINE_OK']);
    expect(r.lipsyncCoarse!.gate).toBe('FAIL'); expect(r.summary.g3).toBe('BLOCKED'); expect(r.summary.overall).toBe('FAIL');
  });
});
