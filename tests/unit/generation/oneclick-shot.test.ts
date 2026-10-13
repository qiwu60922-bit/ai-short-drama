/**
 * Wave12 · oneclick single-shot CLI acceptance OC-1…OC-6 (offline, mock live port only).
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runOneClickShot, normalizeSeed, ONECLICK_EXIT, type OneClickLivePort } from '@/agents/generation/oneclick-shot';

const SHA = 'a'.repeat(64);
const req = (over: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  mode: 'dry-run',
  shot: { shotSpecId: 'shot-spec-ye-yuan-a1-1', generatorKey: 'local.comfy.minimax_h3' },
  ref: { characterId: 'ye-yuan', appearanceRevisionId: 'apr-ye-yuan-r1', refContentSha256: SHA, appearanceContentSha256: SHA, firstFramePath: 'refs/ye.jpg' },
  render: { width: 1344, height: 768, seed: '45', positivePrompt: 'p' },
  ...over,
});
const mockPort = (over: Partial<OneClickLivePort> = {}): OneClickLivePort => ({
  probeReady: vi.fn(async () => true),
  enqueue: vi.fn(async () => ({ status: 'SUCCEEDED' as const, promptId: 'p1', artifact: { filename: 'MiniMax_H3_x.mp4', contentSha256: SHA } })),
  ...over,
});
const LIVE_ENV = { ONECLICK_LIVE: '1' };

describe('oneclick single-shot', () => {
  it('OC-1 dry-run: plan, exit 0, zero submit', async () => {
    const port = mockPort();
    const r = await runOneClickShot(req(), { live: port, runId: 'ocr-t' });
    expect(r.exitCode).toBe(0);
    expect(r.ok).toBe(true);
    expect(r.plan).toMatchObject({ noiseSeed: 45, firstFrameUploadName: 'ye.jpg', canvas: { width: 1344, height: 768 } });
    expect(port.enqueue).not.toHaveBeenCalled();
    expect(port.probeReady).not.toHaveBeenCalled();
  });
  it('OC-2 missing RefDNA → 20', async () => {
    const r = await runOneClickShot(req({ ref: undefined }));
    expect(r.exitCode).toBe(ONECLICK_EXIT.REF_DNA);
    expect(r.error?.rejectCode).toBe('COMFY_I2V_REF_NO_DNA');
  });
  it('OC-2b sha mismatch → 20', async () => {
    const r = await runOneClickShot(req({ ref: { ...req().ref, appearanceContentSha256: 'b'.repeat(64) } }));
    expect(r.exitCode).toBe(20);
    expect(r.error?.rejectCode).toBe('COMFY_I2V_REF_SHA_MISMATCH');
  });
  it.each(['-1', '045', '4.5', 'abc', '9007199254740993'])('OC-3 illegal seed %s → 21', async (seed) => {
    const r = await runOneClickShot(req({ render: { seed, positivePrompt: 'p' } }));
    expect(r.exitCode).toBe(ONECLICK_EXIT.SEED);
    expect(r.error?.rejectCode).toBe('COMFY_H3_SEED_INVALID');
  });
  it('comfy-seed-0 maps to 0 in dry-run, rejected in live', async () => {
    expect(normalizeSeed('comfy-seed-0', { requireCanonical: true, forbidSeed0Literal: true, mode: 'dry-run' })).toEqual({ ok: true, noiseSeed: 0 });
    const r = await runOneClickShot(req({ mode: 'live', render: { seed: 'comfy-seed-0', positivePrompt: 'p' } }), { env: LIVE_ENV, live: mockPort() });
    expect(r.exitCode).toBe(21);
  });
  it('OC-4 live without flag → 3, zero submit', async () => {
    const port = mockPort();
    const r = await runOneClickShot(req({ mode: 'live' }), { env: {}, live: port });
    expect(r.exitCode).toBe(ONECLICK_EXIT.LIVE_FORBIDDEN);
    expect(port.enqueue).not.toHaveBeenCalled();
  });
  it('live with flag but no port (offline build) → 3', async () => {
    const r = await runOneClickShot(req({ mode: 'live' }), { env: LIVE_ENV });
    expect(r.exitCode).toBe(3);
    expect(r.error?.code).toBe('LIVE_NOT_WIRED');
  });
  it('OC-5 mock live success carries PENDING_REVIEW + G3 NOT_EVALUATED', async () => {
    const port = mockPort();
    const r = await runOneClickShot(req({ mode: 'live' }), { env: LIVE_ENV, live: port });
    expect(r.exitCode).toBe(0);
    expect(r.identity.status).toBe('PENDING_REVIEW');
    expect(r.gates).toEqual({ V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN' });
    expect(r.artifact?.filename).toBe('MiniMax_H3_x.mp4');
    expect(port.enqueue).toHaveBeenCalledTimes(1);
  });
  it('stub workflow → 22; bad generatorKey/schema → 2', async () => {
    expect((await runOneClickShot(req({ render: { seed: '1', positivePrompt: 'p', workflowFormat: 'smoke_stub' } }))).exitCode).toBe(22);
    expect((await runOneClickShot(req({ shot: { shotSpecId: 's', generatorKey: 'cloud.x' } }))).exitCode).toBe(2);
    expect((await runOneClickShot({ schemaVersion: 2 })).exitCode).toBe(2);
  });
  it('live disabling human flag → 23', async () => {
    const r = await runOneClickShot(req({ mode: 'live', gates: { requireHumanLiveFlag: false } }), { live: mockPort() });
    expect(r.exitCode).toBe(23);
  });
  it('provider outcomes map to 50/51/40/52', async () => {
    const run = (p: Partial<OneClickLivePort>) => runOneClickShot(req({ mode: 'live' }), { env: LIVE_ENV, live: mockPort(p) });
    expect((await run({ probeReady: async () => false })).exitCode).toBe(50);
    expect((await run({ enqueue: async () => { throw new Error('ECONNRESET'); } })).exitCode).toBe(51);
    expect((await run({ enqueue: async () => ({ status: 'FAILED', message: 'x' }) })).exitCode).toBe(40);
    expect((await run({ enqueue: async () => ({ status: 'TIMEOUT' }) })).exitCode).toBe(52);
  });
  it('OC-6 CLI has no second runner path (no comfy/fetch/smoke imports)', () => {
    const cli = readFileSync(resolve(__dirname, '../../../scripts/oneclick-shot.ts'), 'utf8');
    const core = readFileSync(resolve(__dirname, '../../../src/agents/generation/oneclick-shot.ts'), 'utf8');
    for (const src of [cli, core]) {
      expect(src).not.toMatch(/fetch\(|providers\/comfy|run-local-comfy|smoke.*\.sh|live-h3-enqueue/);
    }
  });
});
