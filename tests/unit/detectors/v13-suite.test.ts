/** V13 · detector suite aggregation (feeds rehearsal report). */
import { describe, it, expect } from 'vitest';
import { runV13Detectors, suiteShotsFromSpec } from '@/agents/detectors/v13-suite';
const shots = [
  { shotId: 'S01', takePath: 'a', midStill: 'a.png', cast: [], dialogue: false },
  { shotId: 'S09a', takePath: 'b', midStill: 'b.png', cast: ['qi-ye'], dialogue: true, audioPath: 'b.wav' },
  { shotId: 'S09b', takePath: 'c', midStill: 'c.png', cast: ['qi-ye'], dialogue: false, continuousWithPrev: true },
];
const g = new Uint8Array(1024).fill(100);
const okDeps = { grab: async () => g, score: async () => ({ lseC: 8, lseD: 6 }), embed: async () => Float32Array.from([1, 0]), load: async () => new Uint8Array(64 * 64 * 3).fill(90) };
describe('suiteShotsFromSpec', () => {
  it('maps cast/dialogue and infers continuity for S09b/S09c-style ids', () => {
    const s = suiteShotsFromSpec({ shots: [{ shotId: 'S09a', cast: [], dialogue: null }, { shotId: 'S09b', cast: ['qi-ye'], dialogue: 'x' }] }, (id) => `/t/${id}.mp4`, (id) => `/q/${id}/mid.png`);
    expect(s[1]).toMatchObject({ continuousWithPrev: true, dialogue: true, cast: ['qi-ye'], takePath: '/t/S09b.mp4' });
    expect(s[0].continuousWithPrev).toBe(false);
  });
});
describe('runV13Detectors', () => {
  it('without models/refs: identity/lipsync NOT_EVALUATED; overall never PASS; G3 NOT_EVALUATED', async () => {
    const r = await runV13Detectors({ episodeId: 'e', shots }, { grab: okDeps.grab, faceModelPath: '/nope', lipsyncScorer: '/nope' });
    expect(r.continuity.gate).toBe('MACHINE_OK');
    expect(r.identity.every(i => i.gate === 'NOT_EVALUATED')).toBe(true);
    expect(r.lipsync.gate).toBe('NOT_EVALUATED');
    expect(r.summary.overall).toBe('INCOMPLETE'); expect(r.summary.g3).toBe('NOT_EVALUATED');
    expect(JSON.stringify(r.summary)).not.toMatch(/"PASS"/);
  });
  it('any detector FAIL → overall FAIL, G3 BLOCKED, failing detectors listed', async () => {
    const r = await runV13Detectors({ episodeId: 'e', shots, packFaces: { 'qi-ye': ['p.png'] } },
      { ...okDeps, score: async () => ({ lseC: 1, lseD: 12 }) });
    expect(r.lipsync.g3).toBe('BLOCKED'); expect(r.summary.overall).toBe('FAIL'); expect(r.summary.g3).toBe('BLOCKED');
    expect(r.summary.failing).toContain('lipsync');
  });
  it('all available detectors ok + all evaluated → MACHINE_OK_AWAITING_HUMAN', async () => {
    const r = await runV13Detectors({ episodeId: 'e', shots, packFaces: { 'qi-ye': ['p.png'] }, sceneRefs: { S01: ['s.png'] }, costumeRefs: { 'qi-ye': ['c.png'] } }, okDeps);
    expect(r.summary.overall).toBe('MACHINE_OK_AWAITING_HUMAN'); expect(r.summary.g3).toBe('NOT_EVALUATED');
  });
});
