/** V13 · AuraFace per-character calibration + locked refs (read-only). FAIL stays FAIL; never PASS; G3 untouched. */
import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { IDENTITY_CALIBRATION, runIdentityCheck, pythonFaceEmbed } from '@/agents/detectors/identity-detector';
import { LOCKED_REFS, lockedPackFaces } from '@/agents/detectors/locked-refs';
const v = (...x: number[]) => Float32Array.from(x);
const unit = (a: number) => v(Math.cos(a), Math.sin(a), 0);
describe('identity calibration (frozen)', () => {
  it('table frozen; qi-ye calibrated, zhui-yu-shitu / fei-yue-li uncalibrated', () => {
    expect(Object.isFrozen(IDENTITY_CALIBRATION)).toBe(true);
    expect(IDENTITY_CALIBRATION['qi-ye']).toEqual({ cosineMin: 0.67, margin: 0.1 });
    expect(IDENTITY_CALIBRATION['zhui-yu-shitu']).toBeNull(); expect(IDENTITY_CALIBRATION['fei-yue-li']).toBeNull();
  });
  const emb: Record<string, Float32Array> = { qref: unit(0), zref: unit(1.2), q_ok: unit(0.3), q_low: unit(0.9), q_close: unit(0.55), zlike_q: unit(0.2) };
  const deps = { embed: async (p: string) => emb[p] ?? null, modelId: 'toy' };
  it('qi-ye: ≥0.67 with margin → MACHINE_OK; below → FAIL; margin too small → FAIL', async () => {
    const r = await runIdentityCheck({ characterId: 'qi-ye', packFaces: ['qref'], otherPacks: { 'zhui-yu-shitu': ['zref'] },
      frames: [{ shotId: 'A', path: 'q_ok' }, { shotId: 'B', path: 'q_low' }] }, deps);
    expect(r.frames.map(f => f.verdict)).toEqual(['MACHINE_OK', 'FAIL']); expect(r.gate).toBe('FAIL');
    const m = await runIdentityCheck({ characterId: 'qi-ye', packFaces: ['qref'], otherPacks: { x: ['q_close'] }, frames: [{ shotId: 'C', path: 'q_ok' }] }, { ...deps, embed: async (p) => p === 'q_close' ? unit(0.25) : emb[p] });
    expect(m.frames[0].reason).toMatch(/margin/); expect(m.gate).toBe('FAIL');
  });
  it('zhui-yu-shitu: never MACHINE_OK (NOT_EVALUATED); a qi-ye face in a zhui shot → FAIL', async () => {
    const r = await runIdentityCheck({ characterId: 'zhui-yu-shitu', packFaces: ['zref'], otherPacks: { 'qi-ye': ['qref'] },
      frames: [{ shotId: 'Z1', path: 'zref' }] }, deps);
    expect(r.frames[0].verdict).toBe('UNCALIBRATED'); expect(r.gate).toBe('NOT_EVALUATED');
    const f = await runIdentityCheck({ characterId: 'zhui-yu-shitu', packFaces: ['zref'], otherPacks: { 'qi-ye': ['qref'] }, frames: [{ shotId: 'Z2', path: 'zlike_q' }] }, deps);
    expect(f.frames[0].verdict).toBe('FAIL'); expect(f.frames[0].reason).toMatch(/qi-ye/); expect(f.gate).toBe('FAIL');
    expect(JSON.stringify([r, f])).not.toMatch(/"PASS"/);
  });
  it('locked refs map is frozen and read-only by construction', () => {
    expect(Object.isFrozen(LOCKED_REFS)).toBe(true); expect(LOCKED_REFS['qi-ye'].lock).toBe('HUMAN_LOCK'); expect(LOCKED_REFS['fei-yue-li'].lock).toBe('LOCK_CANDIDATE');
    expect(lockedPackFaces('/nonexistent')).toEqual({ 'qi-ye': [], 'fei-yue-li': [], 'zhui-yu-shitu': [] });
  });
});
const M = '/workspace/v11/models/face/glintr100.onnx', PY = '/workspace/v11/venv/bin/python';
const R = '/workspace/v11/wave14/ep01/refs', TURN = '/workspace/v11/character-pack/ye-qi-ep01/qi-ye-awakened/TURNAROUND.png';
const real = [M, PY, `${R}/qi-ye/SHEET_FULL_DAILY_AWAKENED.png`, `${R}/zhui-yu-shitu/rooftop_gothic.png`, TURN].every(existsSync);
describe.skipIf(!real)('real AuraFace on locked refs', () => {
  it('zhui-yu-shitu / black-feather faces claimed as qi-ye → FAIL; zhui claim stays NOT_EVALUATED; refs untouched', async () => {
    process.env.V13_PYTHON = PY; const packs = lockedPackFaces(R); const before = packs['qi-ye'].concat(packs['zhui-yu-shitu']).map(p => statSync(p).mtimeMs);
    const embed = pythonFaceEmbed(M);
    const asQi = await runIdentityCheck({ characterId: 'qi-ye', packFaces: packs['qi-ye'], otherPacks: packs,
      frames: [{ shotId: 'zhui-gothic', path: `${R}/zhui-yu-shitu/rooftop_gothic.png` }, { shotId: 'black-feather-turnaround', path: TURN }] }, { embed });
    expect(asQi.frames.every(f => f.verdict === 'FAIL')).toBe(true); expect(asQi.frames.every(f => (f.similarity ?? 0) < 0.67)).toBe(true);
    const asZ = await runIdentityCheck({ characterId: 'zhui-yu-shitu', packFaces: [packs['zhui-yu-shitu'][0]], otherPacks: packs, frames: [{ shotId: 'zm', path: `${R}/zhui-yu-shitu/rooftop_modern.png` }] }, { embed });
    expect(asZ.gate).not.toBe('MACHINE_OK'); expect(asQi.gates.V11_G3).toBe('NOT_EVALUATED');
    expect(packs['qi-ye'].concat(packs['zhui-yu-shitu']).map(p => statSync(p).mtimeMs)).toEqual(before);
    console.log('V13_CAL', JSON.stringify([...asQi.frames, ...asZ.frames].map(f => [f.shotId, f.similarity, f.nearestOther, f.verdict])));
  }, 180000);
});
describe('suite wiring', () => {
  it('useLockedRefs feeds pack refs + otherPacks into identity', async () => {
    const { runV13Detectors } = await import('@/agents/detectors/v13-suite');
    const seen: string[] = [];
    const r = await runV13Detectors({ episodeId: 'ep', useLockedRefs: true, packFaces: { 'qi-ye': ['qref'], 'zhui-yu-shitu': ['zref'] }, costumeRefs: {},
      shots: [{ shotId: 'S1', takePath: 't', midStill: 'zlike_q', cast: ['zhui-yu-shitu'], dialogue: false }] },
      { embed: async (p) => { seen.push(p); return ({ qref: unit(0), zref: unit(1.2), zlike_q: unit(0.2) } as Record<string, Float32Array>)[p] ?? null; }, grab: async () => new Uint8Array(12) });
    expect(seen).toContain('qref'); expect(r.identity[0].gate).toBe('FAIL'); expect(r.summary.g3).toBe('BLOCKED');
  });
});
describe('scene: layout-aware grid score', () => {
  it('same colours, swapped layout → lower than global hist; identical → 1', async () => {
    const { sceneScore, histIntersection, colorHistogram } = await import('@/agents/detectors/appearance-detector');
    const mk = (top: number[], bot: number[]) => { const a = new Uint8Array(64 * 64 * 3); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const c = y < 32 ? top : bot; a.set(c, (y * 64 + x) * 3); } return a; };
    const sky = mk([20, 20, 200], [90, 90, 90]), flipped = mk([90, 90, 90], [20, 20, 200]);
    expect(sceneScore(sky, sky)).toBeCloseTo(1); expect(histIntersection(colorHistogram(sky), colorHistogram(flipped))).toBeCloseTo(1);
    expect(sceneScore(sky, flipped)).toBeLessThan(0.1);
  });
  it('real demo frames: different scenes now FAIL', async () => {
    const { runAppearanceCheck } = await import('@/agents/detectors/appearance-detector');
    const r = await runAppearanceCheck({ kind: 'scene', refId: 'demo', refImages: ['assets/demo-romance.png'], frames: [{ shotId: 'same', path: 'assets/demo-romance.png' }, { shotId: 'other', path: 'assets/demo-anime.png' }] });
    console.log('V13_SCENE', JSON.stringify(r.frames.map(f => [f.shotId, f.score, f.verdict])));
    expect(r.frames.map(f => f.verdict)).toEqual(['MACHINE_OK', 'FAIL']); expect(r.method).toBe('rgb-hist-8x8x8+grid2x2');
  });
});
