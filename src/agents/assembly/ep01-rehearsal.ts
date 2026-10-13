/**
 * Wave14 · EP01 one-command OFFLINE rehearsal:
 * SHOT_SPEC (+BEATPLAN) + REF_INDEX → bindings (never auto-lock) → multi-shot list → FAKE generation
 * → concat → per-shot QC stills → QC summary page. Fake provider only; no network, no cost. ≠G3.
 * Duration policy default is unchanged (60–90); `durationRange` is an explicit per-run override.
 */
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { bindingsFromRefIndex, sceneRefsFromRefIndex, type BindingDecision, type SceneDecision } from './ref-index-bindings';
import { summarizeQcReview, type ReviewSummary } from './qc-review-rerun';
import { evaluateStoryRhythm, type RhythmReport, type RhythmOptions } from './story-rhythm-gate';
import { convertShotSpecToMultiShot, type CharacterRefBinding, type ConvertProblem } from './beatplan-to-multishot';
import { runMultiShotOneClick, type MultiShotResult } from './multishot-oneclick';
import { createFakeH3Provider } from './fake-h3-provider';
import { writeQcSummary } from './qc-summary-page';
import { runV13Detectors, suiteShotsFromSpec, type SuiteDeps } from '@/agents/detectors/v13-suite';

export interface RehearsalInput {
  shotSpec: unknown; beatPlan?: unknown; refIndex: Record<string, unknown>;
  workDir: string;
  durationRange?: { minSeconds: number; maxSeconds: number };
  allowCandidatesForDryRun?: boolean;
  /** Scenery ref; when absent a synthetic placeholder is rendered (approvedTemporary, rehearsal only). */
  sceneRefPath?: string;
  canvas?: { width: number; height: number; fps: number };
  verifyRefShaOnDisk?: boolean;
  ffmpegPreset?: string;
  /** V12 Story Rhythm Gate: 'warn' (default, report only) or 'enforce' (FAIL stops before generation, exit 27). */
  rhythmGate?: 'warn' | 'enforce';
  rhythmOptions?: RhythmOptions;
  /** V13: run detector suite after generation and write detectors-report.json (default 'report'). Never PASS. */
  detectors?: 'off' | 'report';
  detectorDeps?: SuiteDeps;
}

export interface RehearsalReport {
  ok: boolean; exitCode: number; stage: 'bindings' | 'rhythm' | 'convert' | 'generate' | 'done'; rhythm?: RhythmReport;
  decisions: BindingDecision[]; sceneDecisions?: SceneDecision[]; reviewSummary?: ReviewSummary; problems?: ConvertProblem[];
  listPath?: string; run?: MultiShotResult; episodeMp4?: string; qcHtml?: string; qcMd?: string;
  durationRange?: { minSeconds: number; maxSeconds: number }; plannedSeconds?: number;
  detectors?: { reportPath: string; overall: string; g3: 'BLOCKED' | 'NOT_EVALUATED'; failing: string[]; incomplete: string[] };
  notes: string[];
}

const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex');

async function scenePlaceholder(workDir: string, canvas: { width: number; height: number }): Promise<string> {
  const p = join(workDir, 'refs', 'scene-placeholder.png');
  await mkdir(join(workDir, 'refs'), { recursive: true });
  await new Promise<void>((res, rej) => execFile('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=0x101830:s=${canvas.width}x${canvas.height}`, '-frames:v', '1', p], (e) => (e ? rej(e) : res())));
  return p;
}

export async function runEp01Rehearsal(input: RehearsalInput): Promise<RehearsalReport> {
  const notes: string[] = ['FAKE provider (ffmpeg testsrc) — not real generation; identity PENDING_REVIEW; V11_G3 NOT_EVALUATED'];
  await mkdir(input.workDir, { recursive: true });
  const rhythm = evaluateStoryRhythm(input.shotSpec, input.rhythmOptions);
  await writeFile(join(input.workDir, 'rhythm-report.json'), JSON.stringify(rhythm, null, 2));
  if (rhythm.verdict === 'FAIL' && input.rhythmGate === 'enforce') return { ok: false, exitCode: 27, stage: 'rhythm', rhythm, decisions: [], notes };
  const canvas = input.canvas ?? { width: 1344, height: 768, fps: 24 };

  const { bindings, decisions } = bindingsFromRefIndex(input.refIndex, {
    allowCandidatesForDryRun: input.allowCandidatesForDryRun,
    verifySha: input.verifyRefShaOnDisk ? (p) => (existsSync(p) ? sha256(readFileSync(p)) : null) : undefined,
  });
  await writeFile(join(input.workDir, 'bindings.json'), JSON.stringify({ bindings, decisions }, null, 2));

  const scenes = sceneRefsFromRefIndex(input.refIndex, {
    verifySha: input.verifyRefShaOnDisk ? (p) => (existsSync(p) ? sha256(readFileSync(p)) : null) : undefined,
  });
  const scenePath = input.sceneRefPath ?? (await scenePlaceholder(input.workDir, canvas));
  if (!input.sceneRefPath) notes.push(`scenery shots use synthetic placeholder ${scenePath} (approvedTemporary, rehearsal only)`);
  const sceneSha = sha256(await readFile(scenePath));
  const sceneRef: CharacterRefBinding = { characterId: 'scene-ep01', appearanceRevisionId: `apr-scene-${sceneSha.slice(0, 8)}`, refContentSha256: sceneSha,
    operatorKind: 'hero_portrait', firstFramePath: scenePath, approvedTemporary: { actor: 'ep01-rehearsal', reason: 'scenery ref for fake-provider rehearsal only' } };

  const conv = convertShotSpecToMultiShot(input.shotSpec, input.beatPlan, { workDir: join(input.workDir, 'run'), mode: 'live', bindings, sceneRef, sceneRefsByShot: scenes.byShot, canvas, durationRange: input.durationRange });
  if (!conv.ok) return { ok: false, exitCode: 24, stage: 'convert', rhythm, decisions, problems: conv.problems, notes };
  const listPath = join(input.workDir, 'multishot-list.json');
  await writeFile(listPath, JSON.stringify(conv.list, null, 2));

  const spec = input.shotSpec as { shots: { shotId: string; durSec: number }[] };
  const secondsByShotSpecId = Object.fromEntries(spec.shots.map((s) => [`${conv.list.episodeId}-${s.shotId.replace(/[^A-Za-z0-9._-]/g, '_')}`, s.durSec]));
  const plannedSeconds = spec.shots.reduce((a, s) => a + s.durSec, 0);
  const live = createFakeH3Provider({ outDir: join(input.workDir, 'run', 'takes'), secondsByShotSpecId, preset: input.ffmpegPreset ?? 'ultrafast' });
  const run = await runMultiShotOneClick(conv.list, { env: { ONECLICK_LIVE: '1' }, live, qc: { enabled: true } });

  const qcDir = join(input.workDir, 'run', 'qc');
  let qcHtml: string | undefined, qcMd: string | undefined;
  if (existsSync(qcDir)) {
    const prompts = Object.fromEntries(conv.list.shots.map((s) => [s.shotId, s.positivePrompt]));
    const q = await writeQcSummary(qcDir, { review: true, title: `${conv.list.episodeId} 离线演练 · QC 三帧`, order: conv.list.shots.map((s) => s.shotId), prompts });
    qcHtml = q.html; qcMd = q.md;
  }
  const reviewSummary = existsSync(qcDir) ? await summarizeQcReview(qcDir, { listPath }) : undefined;
  let detectors: RehearsalReport['detectors'];
  if (run.ok && (input.detectors ?? 'report') === 'report') {
    const cpTake = (id: string) => { const safe = id.replace(/[^A-Za-z0-9._-]/g, '_'); return join(input.workDir, 'run', 'takes', `FAKE_H3_${conv.list.episodeId}-${safe}.mp4`); };
    const suite = await runV13Detectors({ episodeId: conv.list.episodeId, shots: suiteShotsFromSpec(input.shotSpec as never, cpTake, (id) => join(qcDir, id.replace(/[^A-Za-z0-9._-]/g, '_'), 'mid.png')) }, input.detectorDeps);
    const reportPath = join(input.workDir, 'detectors-report.json');
    await writeFile(reportPath, JSON.stringify(suite, null, 2));
    detectors = { reportPath, overall: suite.summary.overall, g3: suite.summary.g3, failing: suite.summary.failing, incomplete: suite.summary.incomplete };
    notes.push(`V13 detectors: ${suite.summary.overall} (G3 ${suite.summary.g3}; fake-provider material — numbers are not quality evidence)`);
  }
  const report: RehearsalReport = { detectors, ok: run.ok, exitCode: run.exitCode, stage: run.ok ? 'done' : 'generate', rhythm, decisions, sceneDecisions: scenes.decisions, reviewSummary, listPath, run,
    episodeMp4: run.output?.path, qcHtml, qcMd, durationRange: conv.list.durationRange, plannedSeconds, notes };
  await writeFile(join(input.workDir, 'rehearsal-report.json'), JSON.stringify(report, null, 2));
  return report;
}
