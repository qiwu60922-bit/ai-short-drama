/**
 * Offline fake H3 provider: renders a local ffmpeg testsrc clip per shot. No network, no cost.
 * For tests and CLI demos only (--fake-provider). Never a stand-in for identity/G3 evidence.
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { OneClickLivePort } from '@/agents/generation/oneclick-shot';

export interface FakeH3Options { outDir: string; seconds?: number; secondsByShotSpecId?: Record<string, number>; failShotSpecIds?: Set<string>; preset?: string; }

export function createFakeH3Provider(opts: FakeH3Options): OneClickLivePort & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    probeReady: async () => true,
    async enqueue(plan) {
      const id = String(plan.shotSpecId);
      calls.push(id);
      if (opts.failShotSpecIds?.has(id)) return { status: 'FAILED', promptId: `fake-${id}`, message: 'fake provider injected failure' };
      const canvas = plan.canvas as { width: number; height: number };
      await mkdir(opts.outDir, { recursive: true });
      const path = join(opts.outDir, `FAKE_H3_${id}.mp4`);
      await new Promise<void>((res, rej) => execFile('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i',
        `testsrc=size=${canvas.width}x${canvas.height}:rate=24:duration=${opts.secondsByShotSpecId?.[id] ?? opts.seconds ?? 5.2}`, '-c:v', 'libx264', '-preset', opts.preset ?? 'medium', '-pix_fmt', 'yuv420p', path],
        (err) => (err ? rej(err) : res())));
      const contentSha256 = createHash('sha256').update(await readFile(path)).digest('hex');
      return { status: 'SUCCEEDED', promptId: `fake-${id}`, artifact: { filename: `FAKE_H3_${id}.mp4`, contentSha256, path } };
    },
  };
}
