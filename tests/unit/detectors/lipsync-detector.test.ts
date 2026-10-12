/** V13 · lipsync detector (LatentSync/SyncNet LSE-C/LSE-D). Code ready, awaiting real material. */
import { describe, it, expect } from 'vitest';
import { LIPSYNC_THRESHOLDS, runLipsyncCheck } from '@/agents/detectors/lipsync-detector';
const shots = [{ shotId: 'S02', takePath: 'a.mp4', audioPath: 'a.wav', hasDialogue: true }, { shotId: 'S03', takePath: 'b.mp4', hasDialogue: false }, { shotId: 'S04', takePath: 'c.mp4', audioPath: 'c.wav', hasDialogue: true }];
describe('lipsync detector', () => {
  it('frozen thresholds; override forbidden', async () => {
    expect(Object.isFrozen(LIPSYNC_THRESHOLDS)).toBe(true);
    await expect(runLipsyncCheck({ episodeId: 'e', shots, thresholds: {} } as any)).rejects.toThrow(/frozen/);
  });
  it('no local scorer → NOT_EVALUATED; G3 stays NOT_EVALUATED (not PASS)', async () => {
    const r = await runLipsyncCheck({ episodeId: 'e', shots }, { scorerCmd: '/nope/latentsync_score.py' });
    expect(r.gate).toBe('NOT_EVALUATED'); expect(r.g3).toBe('NOT_EVALUATED'); expect(r.readiness).toBe('CODE_READY_AWAITING_REAL_MATERIAL');
  });
  it('only dialogue shots scored; one FAIL → gate FAIL and G3 BLOCKED', async () => {
    const sc: Record<string, { lseC: number; lseD: number }> = { 'a.mp4': { lseC: 7.5, lseD: 6.8 }, 'c.mp4': { lseC: 2.1, lseD: 11.3 } };
    const r = await runLipsyncCheck({ episodeId: 'e', shots }, { score: async (v) => sc[v] });
    expect(r.shots.map(s => [s.shotId, s.verdict])).toEqual([['S02', 'MACHINE_OK'], ['S04', 'FAIL']]);
    expect(r.gate).toBe('FAIL'); expect(r.g3).toBe('BLOCKED'); expect(r.gates.publish).toBe('FORBIDDEN');
  });
  it('dialogue shot without audio → FAIL (cannot verify) and BLOCKED', async () => {
    const r = await runLipsyncCheck({ episodeId: 'e', shots: [{ shotId: 'S9', takePath: 'x.mp4', hasDialogue: true }] }, { score: async () => ({ lseC: 9, lseD: 5 }) });
    expect(r.shots[0].verdict).toBe('FAIL'); expect(r.g3).toBe('BLOCKED');
  });
  it('all ok → MACHINE_OK, G3 still NOT_EVALUATED (human-only)', async () => {
    const r = await runLipsyncCheck({ episodeId: 'e', shots }, { score: async () => ({ lseC: 8, lseD: 6 }) });
    expect(r.gate).toBe('MACHINE_OK'); expect(r.g3).toBe('NOT_EVALUATED');
  });
  it('scorer crash → ERROR and BLOCKED', async () => {
    const r = await runLipsyncCheck({ episodeId: 'e', shots }, { score: async () => { throw new Error('cuda'); } });
    expect(r.gate).toBe('ERROR'); expect(r.g3).toBe('BLOCKED');
  });
});
