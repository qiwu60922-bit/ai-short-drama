/** V12 item 1 · ledger wiring into multishot orchestrator. */
import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { runMultiShotOneClick, MULTISHOT_EXIT } from '@/agents/assembly/multishot-oneclick';
import { readLedger } from '@/agents/ledger/generation-ledger';
const SHA = 'c'.repeat(64);
const ref = (cid: string) => ({ characterId: cid, appearanceRevisionId: 'apr-1', refContentSha256: SHA, appearanceContentSha256: SHA, firstFramePath: 'refs/x.jpg' });
const list = (w: string, cid = 'qi-ye', n = 3) => ({ schemaVersion: 1, episodeId: 'ep01', mode: 'live', defaultRef: ref(cid), workDir: w, durationRange: { minSeconds: 1, maxSeconds: 90 },
  shots: Array.from({ length: n }, (_, i) => ({ shotId: `s${i}`, order: i, seed: String(40 + i), positivePrompt: `beat ${i}` })) });
function deps(fail = new Set<string>(), made = new Set<string>()) {
  let t = 0;
  const live = { probeReady: async () => true, enqueue: async (p: any) => { const id = String(p.shotSpecId);
    if (fail.has(id)) return { status: 'FAILED', message: 'boom' }; const path = `/fake/${id}.mp4`; made.add(path);
    return { status: 'SUCCEEDED', promptId: id, artifact: { filename: `${id}.mp4`, contentSha256: SHA, path } }; } } as any;
  const concat = { exists: async (p: string) => made.has(p) || p.endsWith('episode.mp4'), probe: async () => ({ width: 1344, height: 768, fps: 24, durationSeconds: 5 }),
    writeListFile: vi.fn(async () => {}), runFfmpeg: vi.fn(async () => ({ code: 0, stderr: '' })), sha256File: async () => SHA };
  return { env: { ONECLICK_LIVE: '1' }, live, concat, fileExists: async (p: string) => made.has(p), now: () => (t += 250) };
}
const tmp = () => mkdtempSync(join(tmpdir(), 'msl-'));
describe('multishot ledger wiring', () => {
  it('one ledger entry per successful generation with provider/model/seed/hash/sha/latency/cast', async () => {
    const w = tmp(); const L = join(w, 'LEDGER.jsonl');
    const r = await runMultiShotOneClick(list(w), { ...deps(), ledger: { path: L, provider: 'fake-h3', model: 'fake-v1', costPerShotUsd: 0 } });
    expect(r.exitCode).toBe(0);
    const es = readLedger(L);
    expect(es.map(e => e.shotId)).toEqual(['s0', 's1', 's2']);
    expect(es[0]).toMatchObject({ provider: 'fake-h3', model: 'fake-v1', costUsd: 0, seed: '40', outputSha256: SHA, cast: ['qi-ye'], episode: 'ep01' });
    expect(es[0].inputHash).toMatch(/^[0-9a-f]{64}$/); expect(es[0].inputHash).not.toBe(es[1].inputHash);
    expect(es[0].latencyMs).toBeGreaterThanOrEqual(0);
  });
  it('resume does not re-log already-succeeded shots', async () => {
    const w = tmp(); const L = join(w, 'L.jsonl'); const led = { path: L, provider: 'p', model: 'm' }; const made = new Set<string>();
    expect((await runMultiShotOneClick(list(w), { ...deps(new Set(['ep01-s1']), made), ledger: led })).ok).toBe(false);
    expect(readLedger(L).map(e => e.shotId)).toEqual(['s0']);
    await runMultiShotOneClick(list(w), { ...deps(new Set(), made), ledger: led });
    expect(readLedger(L).map(e => e.shotId)).toEqual(['s0', 's1', 's2']);
  });
  it('archived character (ye-yuan) blocked before any generation when ledger on', async () => {
    const w = tmp(); const d = deps(); const spy = vi.spyOn(d.live, 'enqueue');
    const r = await runMultiShotOneClick(list(w, 'ye-yuan'), { ...d, ledger: { path: join(w, 'L.jsonl'), provider: 'p', model: 'm' } });
    expect(r.exitCode).toBe(MULTISHOT_EXIT.CAST_REJECTED); expect(spy).not.toHaveBeenCalled();
  });
  it('no ledger dep → behaviour unchanged', async () => {
    expect((await runMultiShotOneClick(list(tmp(), 'ye-yuan'), deps())).exitCode).toBe(0);
  });
});
