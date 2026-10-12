/**
 * After human QC review: page regeneration with list order/prompts, review summary report,
 * and "rerun only HUMAN_FAIL shots" plan (optionally applied to checkpoint.json so the next
 * orchestrator run regenerates just those shots). Offline; never changes G3 or verdicts.
 */
import { copyFile, mkdir, readFile, writeFile, rename, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadQcRecords, writeQcSummary } from './qc-summary-page';
import type { Checkpoint } from './multishot-oneclick';

export interface ListInfo { path: string; order: string[]; prompts: Record<string, string>; episodeId?: string; }

/** Look for multishot-list.json in qcDir, its parent (run/) and grandparent (rehearsal workDir). */
export async function findMultishotList(qcDir: string, explicit?: string): Promise<ListInfo | null> {
  const cands = explicit ? [explicit] : [qcDir, dirname(qcDir), dirname(dirname(qcDir))].map((d) => join(d, 'multishot-list.json'));
  for (const p of cands) {
    if (!existsSync(p)) continue;
    const l = JSON.parse(await readFile(p, 'utf8')) as { episodeId?: string; shots?: { shotId: string; order: number; positivePrompt?: string }[] };
    const shots = [...(l.shots ?? [])].sort((a, b) => a.order - b.order);
    return { path: p, order: shots.map((s) => s.shotId), prompts: Object.fromEntries(shots.filter((s) => s.positivePrompt).map((s) => [s.shotId, s.positivePrompt!])), episodeId: l.episodeId };
  }
  return null;
}

export async function regenerateQcPage(qcDir: string, opts: { listPath?: string; title?: string } = {}) {
  const l = await findMultishotList(qcDir, opts.listPath);
  return writeQcSummary(qcDir, { review: true, title: opts.title ?? `${l?.episodeId ?? ''} QC 三帧 · 人工复核`.trim(), order: l?.order, prompts: l?.prompts });
}

export interface ReviewSummary {
  total: number; pass: number; fail: number; pending: number;
  failed: { shotId: string; note: string; reviewer: string | null; reviewedAt: string | null }[];
  pendingShots: string[];
  /** PENDING shots regenerated after a HUMAN_FAIL (archived in qc/<shot>/history/). */
  rerunAwaiting: { shotId: string; previousNote: string; rerunCount: number }[];
  g3: 'NOT_EVALUATED';
}

export async function summarizeQcReview(qcDir: string, opts: { listPath?: string } = {}): Promise<ReviewSummary> {
  const l = await findMultishotList(qcDir, opts.listPath);
  const recs = await loadQcRecords(qcDir, l?.order);
  const failedRecs = recs.filter((r) => r.identity.status === 'HUMAN_FAIL');
  const rerunAwaiting: ReviewSummary['rerunAwaiting'] = [];
  for (const r of recs.filter((x) => x.identity.status === 'PENDING_REVIEW')) {
    const hdir = join(qcDir, r.shotId, 'history');
    if (!existsSync(hdir)) continue;
    const files = (await readdir(hdir)).filter((f) => f.endsWith('.json')).sort();
    const hist = await Promise.all(files.map(async (f) => JSON.parse(await readFile(join(hdir, f), 'utf8')) as { identity?: { status?: string; note?: string } }));
    const fails = hist.filter((h) => h.identity?.status === 'HUMAN_FAIL');
    if (fails.length) rerunAwaiting.push({ shotId: r.shotId, previousNote: fails[fails.length - 1].identity?.note ?? '', rerunCount: files.length });
  }
  const awaitingIds = new Set(rerunAwaiting.map((a) => a.shotId));
  const s: ReviewSummary = {
    total: recs.length,
    pass: recs.filter((r) => r.identity.status === 'HUMAN_PASS').length,
    fail: failedRecs.length,
    pending: recs.filter((r) => r.identity.status === 'PENDING_REVIEW').length,
    failed: failedRecs.map((r) => ({ shotId: r.shotId, note: r.identity.note, reviewer: r.identity.reviewer, reviewedAt: r.identity.reviewedAt })),
    pendingShots: recs.filter((r) => r.identity.status === 'PENDING_REVIEW' && !awaitingIds.has(r.shotId)).map((r) => r.shotId),
    rerunAwaiting,
    g3: 'NOT_EVALUATED',
  };
  const md = [
    '# QC 人工复核汇总', '', `> 共 ${s.total} 镜 · 通过 ${s.pass} · 不通过 ${s.fail} · 待复核 ${s.pending} · V11_G3 = NOT_EVALUATED · publish = FORBIDDEN`, '',
    '## 不通过', '', s.failed.length ? '| 镜头 | 备注 | 审核人 | 时间 |\n|---|---|---|---|\n' + s.failed.map((f) => `| ${f.shotId} | ${f.note.replace(/\|/g, '\\|')} | ${f.reviewer ?? ''} | ${f.reviewedAt ?? ''} |`).join('\n') : '（无）', '',
    '## 已重做，待再审', '', s.rerunAwaiting.length ? '| 镜头 | 上次不通过备注 | 重做次数 |\n|---|---|---|\n' + s.rerunAwaiting.map((a) => `| ${a.shotId} | ${a.previousNote.replace(/\|/g, '\\|')} | ${a.rerunCount} |`).join('\n') : '（无）', '',
    '## 待复核（首次）', '', s.pendingShots.length ? s.pendingShots.join(', ') : '（无）', '',
    '续跑：`npm run qc:rerun-failed -- --work-dir <演练目录> --apply`，再用同一目录重跑演练，仅重做不通过的镜头。', '',
  ].join('\n');
  await writeFile(join(qcDir, 'review-summary.md'), md);
  await writeFile(join(qcDir, 'review-summary.json'), JSON.stringify(s, null, 2));
  return s;
}

/** Resolve run dir: accepts rehearsal workDir (with run/) or the run dir itself. */
const runDirOf = (dir: string) => (existsSync(join(dir, 'run', 'checkpoint.json')) ? join(dir, 'run') : dir);

export async function planRerunFailed(workDir: string, opts: { apply: boolean; now?: () => string }) {
  const run = runDirOf(workDir);
  const qcDir = join(run, 'qc');
  const cpPath = join(run, 'checkpoint.json');
  const summary = await summarizeQcReview(qcDir);
  const shots = summary.failed.map((f) => f.shotId);
  const now = (opts.now ?? (() => new Date().toISOString()))();
  const plan = { createdAt: now, checkpoint: cpPath, shots, notes: Object.fromEntries(summary.failed.map((f) => [f.shotId, f.note])), applied: false };
  if (opts.apply && shots.length) {
    const cp = JSON.parse(await readFile(cpPath, 'utf8')) as Checkpoint;
    for (const id of shots) {
      const prev = cp.shots[id];
      if (!prev) throw new Error(`shot ${id} not in checkpoint`);
      const recPath = join(qcDir, id, 'qc-record.json');
      if (existsSync(recPath)) {
        await mkdir(join(qcDir, id, 'history'), { recursive: true });
        await copyFile(recPath, join(qcDir, id, 'history', `qc-record-${now.replace(/[:.]/g, '-')}.json`));
      }
      cp.shots[id] = { status: 'FAILED', exitCode: prev.exitCode, attempts: prev.attempts, error: `HUMAN_FAIL review: ${plan.notes[id] ?? ''} — queued for regeneration` };
    }
    await writeFile(`${cpPath}.tmp`, JSON.stringify(cp, null, 2));
    await rename(`${cpPath}.tmp`, cpPath);
    plan.applied = true;
  }
  await writeFile(join(qcDir, 'rerun-failed.json'), JSON.stringify(plan, null, 2));
  return plan;
}
