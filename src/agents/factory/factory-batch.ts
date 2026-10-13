/** V14 multi-episode batch: each episode its own workDir/queue/ledger; blocked or failed episodes don't stop others. Never PASS; canPublish false. */
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runFactory, loadQueue, type Handlers } from './factory-run';
import { readLedger, summarizeLedger } from '@/agents/ledger/generation-ledger';
export interface BatchEpisode { episodeId: string; providers: { h3: string; dub: string }; handlers: Handlers; estimatedCostUsd?: Record<string, number> }
export async function runFactoryBatch(rootDir: string, eps: BatchEpisode[]) {
  const ids = eps.map(e => e.episodeId); if (new Set(ids).size !== ids.length) throw new Error('duplicate episodeId in batch');
  const episodes = [];
  for (const e of eps) {
    const workDir = join(rootDir, e.episodeId);
    const r = await runFactory({ episodeId: e.episodeId, workDir, providers: e.providers, estimatedCostUsd: e.estimatedCostUsd }, e.handlers);
    const st = existsSync(join(workDir, 'FACTORY_QUEUE.json')) ? loadQueue(workDir).tasks.find(t => t.step === 'stitch')?.output : undefined;
    episodes.push({ episodeId: e.episodeId, workDir, status: r.status, exitCode: r.exitCode, stoppedAt: (r as any).stoppedAt, reason: (r as any).reason, totalSec: st?.totalSec, episodeMp4: st?.episodeMp4 });
  }
  const all = eps.flatMap(e => readLedger(join(rootDir, e.episodeId, 'LEDGER.jsonl')));
  const ledger = summarizeLedger(all);
  const exitCode = episodes.find(e => e.exitCode !== 0)?.exitCode ?? 0;
  const out = { schema: 'v14/FactoryBatch/v1' as const, rootDir, exitCode, episodes, ledger, canPublish: false as const, g3: 'NOT_EVALUATED' as const,
    note: 'canPublish requires per-episode G3 by human review receipt (V15)' };
  writeFileSync(join(rootDir, 'BATCH_SUMMARY.json'), JSON.stringify(out, null, 2));
  return out;
}
