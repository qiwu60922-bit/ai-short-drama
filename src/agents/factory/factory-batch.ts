/** V14 multi-episode batch: each episode its own workDir/queue/ledger; blocked or failed episodes don't stop others. Never PASS; canPublish false.
 * Optional storyLedgerGate + shotSpecGate (symmetric off|warn|enforce) before episodes. $0; ≠G3.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runFactory, loadQueue, type Handlers } from './factory-run';
import { readLedger, summarizeLedger } from '@/agents/ledger/generation-ledger';
import {
  evaluateStoryLedgerSuite,
  type StoryLedgerSuiteReport,
} from '@/agents/assembly/story-ledger-suite';
import {
  evaluateShotSpecSuite,
  type ShotSpecSuiteReport,
} from '@/agents/assembly/shot-spec-suite';

export interface BatchEpisode {
  episodeId: string;
  providers: { h3: string; dub: string };
  handlers: Handlers;
  estimatedCostUsd?: Record<string, number>;
}

export interface FactoryBatchOptions {
  /** V12 Story-Ledger Suite bundle (#71–#76+). Default ignored when gate is off. */
  storyLedger?: unknown;
  /** 'off' (default) · 'warn' (report only) · 'enforce' (FAIL → exit 36, skip episodes). */
  storyLedgerGate?: 'off' | 'warn' | 'enforce';
  /** V12 Shot-Spec Suite 旁路 (hook / opening-cascade / cut-timeline). */
  shotSpecSuite?: unknown;
  /** 'off' (default) · 'warn' · 'enforce' (FAIL → exit 36, skip episodes). */
  shotSpecGate?: 'off' | 'warn' | 'enforce';
}

type GateMode = 'off' | 'warn' | 'enforce';

function blockedSummary(
  rootDir: string,
  stage: 'storyLedger' | 'shotSpec',
  notes: string[],
  extras: {
    storyLedger?: StoryLedgerSuiteReport;
    shotSpecSuite?: ShotSpecSuiteReport;
  },
) {
  const out = {
    schema: 'v14/FactoryBatch/v1' as const,
    rootDir,
    exitCode: 36,
    stage,
    episodes: [] as Array<Record<string, unknown>>,
    ledger: summarizeLedger([]),
    storyLedger: extras.storyLedger,
    shotSpecSuite: extras.shotSpecSuite,
    notes,
    canPublish: false as const,
    g3: 'NOT_EVALUATED' as const,
    note: `canPublish requires per-episode G3 by human review receipt (V15); ${stage}Gate=enforce blocked batch`,
  };
  writeFileSync(join(rootDir, 'BATCH_SUMMARY.json'), JSON.stringify(out, null, 2));
  return out;
}

export async function runFactoryBatch(
  rootDir: string,
  eps: BatchEpisode[],
  opts: FactoryBatchOptions = {},
) {
  const ids = eps.map((e) => e.episodeId);
  if (new Set(ids).size !== ids.length) throw new Error('duplicate episodeId in batch');
  mkdirSync(rootDir, { recursive: true });

  const storyMode: GateMode = opts.storyLedgerGate ?? 'off';
  const shotMode: GateMode = opts.shotSpecGate ?? 'off';
  let storyLedger: StoryLedgerSuiteReport | undefined;
  let shotSpec: ShotSpecSuiteReport | undefined;
  const notes: string[] = [];

  if (opts.storyLedger != null && storyMode !== 'off') {
    storyLedger = evaluateStoryLedgerSuite(opts.storyLedger);
    writeFileSync(
      join(rootDir, 'story-ledger-suite-report.json'),
      JSON.stringify(storyLedger, null, 2),
    );
    notes.push(
      `story-ledger-suite: ${storyLedger.verdict} (ran=${storyLedger.metrics.ran} passed=${storyLedger.metrics.passed} failed=${storyLedger.metrics.failed} skipped=${storyLedger.metrics.skipped})`,
    );
    if (storyLedger.verdict === 'FAIL' && storyMode === 'enforce') {
      return blockedSummary(rootDir, 'storyLedger', notes, { storyLedger });
    }
  }

  if (opts.shotSpecSuite != null && shotMode !== 'off') {
    shotSpec = evaluateShotSpecSuite(opts.shotSpecSuite);
    writeFileSync(
      join(rootDir, 'shot-spec-suite-report.json'),
      JSON.stringify(shotSpec, null, 2),
    );
    notes.push(
      `shot-spec-suite: ${shotSpec.verdict} (ran=${shotSpec.metrics.ran} passed=${shotSpec.metrics.passed} failed=${shotSpec.metrics.failed} skipped=${shotSpec.metrics.skipped})`,
    );
    if (shotSpec.verdict === 'FAIL' && shotMode === 'enforce') {
      return blockedSummary(rootDir, 'shotSpec', notes, {
        storyLedger,
        shotSpecSuite: shotSpec,
      });
    }
  }

  const episodes = [];
  for (const e of eps) {
    const workDir = join(rootDir, e.episodeId);
    const r = await runFactory(
      { episodeId: e.episodeId, workDir, providers: e.providers, estimatedCostUsd: e.estimatedCostUsd },
      e.handlers,
    );
    const st = existsSync(join(workDir, 'FACTORY_QUEUE.json'))
      ? loadQueue(workDir).tasks.find((t) => t.step === 'stitch')?.output
      : undefined;
    episodes.push({
      episodeId: e.episodeId,
      workDir,
      status: r.status,
      exitCode: r.exitCode,
      stoppedAt: (r as { stoppedAt?: string }).stoppedAt,
      reason: (r as { reason?: string }).reason,
      totalSec: st?.totalSec,
      episodeMp4: st?.episodeMp4,
    });
  }
  const all = eps.flatMap((e) => readLedger(join(rootDir, e.episodeId, 'LEDGER.jsonl')));
  const ledger = summarizeLedger(all);
  const exitCode = episodes.find((e) => e.exitCode !== 0)?.exitCode ?? 0;
  const out = {
    schema: 'v14/FactoryBatch/v1' as const,
    rootDir,
    exitCode,
    episodes,
    ledger,
    storyLedger,
    shotSpecSuite: shotSpec,
    notes,
    canPublish: false as const,
    g3: 'NOT_EVALUATED' as const,
    note: 'canPublish requires per-episode G3 by human review receipt (V15)',
  };
  writeFileSync(join(rootDir, 'BATCH_SUMMARY.json'), JSON.stringify(out, null, 2));
  return out;
}
