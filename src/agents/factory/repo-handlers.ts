/**
 * V14 factory handlers backed by real repo modules (offline; fake H3 provider + fake TTS tone).
 * script: rhythm gate · pack_lock: REF_INDEX bindings (HUMAN_LOCK; candidates only with explicit rehearsal opt-in)
 * h3: multishot (fake H3, QC stills, ledger) · dub: fake TTS wav per dialogue shot (ledger) · sub: SRT
 * stitch: re-encode concat + DTS verify + audio mux · qc: V13 detector suite + QC page + human review receipt (if a human review file exists) + asset index.
 * Nothing here can PASS; G3 stays NOT_EVALUATED (or BLOCKED on detector FAIL).
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { evaluateStoryRhythm } from '@/agents/assembly/story-rhythm-gate';
import { bindingsFromRefIndex, sceneRefsFromRefIndex } from '@/agents/assembly/ref-index-bindings';
import { convertShotSpecToMultiShot, type CharacterRefBinding } from '@/agents/assembly/beatplan-to-multishot';
import { createFakeH3Provider } from '@/agents/assembly/fake-h3-provider';
import { runMultiShotOneClick } from '@/agents/assembly/multishot-oneclick';
import { runMultiShotConcat } from '@/agents/assembly/ffmpeg-concat-worker';
import { writeQcSummary } from '@/agents/assembly/qc-summary-page';
import { importQcReview } from '@/agents/assembly/qc-human-review';
import { runV13Detectors, suiteShotsFromSpec } from '@/agents/detectors/v13-suite';
import { appendLedgerEntry, hashInputs } from '@/agents/ledger/generation-ledger';
import { scanEpisodeDir, saveIndex } from '@/agents/ledger/asset-index';
import type { Handlers } from './factory-run';

export interface RepoHandlerOptions {
  shotSpec: any; beatPlan?: unknown; refIndex: Record<string, unknown>;
  canvas?: { width: number; height: number; fps: number }; durationRange?: { minSeconds: number; maxSeconds: number };
  /** Rehearsal-only: allow LOCK_CANDIDATE refs (recorded as CANDIDATES_REHEARSAL_ONLY). Real runs must leave this off. */
  allowCandidatesForRehearsal?: boolean; rhythmGate?: 'warn' | 'enforce'; ffmpegPreset?: string;
}
const ff = (args: string[]) => new Promise<void>((res, rej) => execFile('ffmpeg', ['-v', 'error', '-y', ...args], (e, _o, se) => (e ? rej(new Error(String(se).trim() || e.message)) : res())));
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');
const safe = (id: string) => id.replace(/[^A-Za-z0-9._-]/g, '_');
const pad = (n: number, l = 2) => String(n).padStart(l, '0');
const ts = (s: number) => { const ms = Math.round(s * 1000); return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`; };
const lineOf = (s: any) => [s.dialogue].flat().filter(Boolean).join(' / ') || s.vo || '';

export function repoHandlers(o: RepoHandlerOptions): Handlers {
  const canvas = o.canvas ?? { width: 1344, height: 768, fps: 24 };
  const spec = o.shotSpec as { episode: string; shots: any[] };
  return {
    script: async ({ dir }) => {
      const r = evaluateStoryRhythm(spec);
      writeFileSync(join(dir, 'SHOT_SPEC.json'), JSON.stringify(spec, null, 2)); writeFileSync(join(dir, 'rhythm-report.json'), JSON.stringify(r, null, 2));
      if (r.verdict === 'FAIL' && o.rhythmGate === 'enforce') throw new Error('story rhythm gate FAIL (enforce)');
      return { shots: spec.shots.length, plannedSec: spec.shots.reduce((a, s) => a + s.durSec, 0), rhythm: r.verdict === 'PASS' ? 'RHYTHM_OK' : r.verdict };
    },
    pack_lock: async ({ dir }) => {
      const { bindings, decisions } = bindingsFromRefIndex(o.refIndex, { allowCandidatesForDryRun: o.allowCandidatesForRehearsal });
      const cast = [...new Set(spec.shots.flatMap(s => s.cast ?? []))] as string[];
      const missing = cast.filter(c => !bindings[c]);
      writeFileSync(join(dir, 'bindings.json'), JSON.stringify({ bindings, decisions }, null, 2));
      if (missing.length) throw new Error(`no HUMAN_LOCK ref for: ${missing.join(', ')} (machine never locks)`);
      const usedCandidates = Object.values(bindings).some((b: any) => b.approvedTemporary);
      return { packStatus: usedCandidates ? 'CANDIDATES_REHEARSAL_ONLY' : 'HUMAN_LOCK', cast };
    },
    h3: async ({ cfg, dir }) => {
      const { bindings } = bindingsFromRefIndex(o.refIndex, { allowCandidatesForDryRun: o.allowCandidatesForRehearsal });
      const scenes = sceneRefsFromRefIndex(o.refIndex);
      const ph = join(dir, 'scene-placeholder.png');
      if (!existsSync(ph)) await ff(['-f', 'lavfi', '-i', `color=c=0x101830:s=${canvas.width}x${canvas.height}`, '-frames:v', '1', ph]);
      const sSha = sha(ph);
      const sceneRef: CharacterRefBinding = { characterId: `scene-${cfg.episodeId}`, appearanceRevisionId: `apr-scene-${sSha.slice(0, 8)}`, refContentSha256: sSha, operatorKind: 'hero_portrait',
        firstFramePath: ph, approvedTemporary: { actor: 'factory-rehearsal', reason: 'scenery placeholder, fake provider only' } };
      const runDir = join(dir, 'run');
      const conv = convertShotSpecToMultiShot(spec, o.beatPlan, { workDir: runDir, mode: 'live', bindings, sceneRef, sceneRefsByShot: scenes.byShot, canvas, durationRange: o.durationRange });
      if (!conv.ok) throw new Error(`convert: ${conv.problems.map(p => `${p.shotId ?? ''} ${p.code}`).join('; ')}`);
      const secondsByShotSpecId = Object.fromEntries(spec.shots.map(s => [`${conv.list.episodeId}-${safe(s.shotId)}`, s.durSec]));
      const live = createFakeH3Provider({ outDir: join(runDir, 'takes'), secondsByShotSpecId, preset: o.ffmpegPreset ?? 'ultrafast' });
      const castByShot = Object.fromEntries(spec.shots.map(s => [safe(s.shotId), s.cast ?? []]));
      const r = await runMultiShotOneClick(conv.list, { env: { ONECLICK_LIVE: '1' }, live, qc: { enabled: true },
        ledger: { path: join(cfg.workDir, 'LEDGER.jsonl'), provider: `${cfg.providers.h3}-h3`, model: 'fake-h3-testsrc', costPerShotUsd: 0, castByShot } });
      if (!r.ok) throw new Error(`multishot exit ${r.exitCode}: ${r.error?.message ?? ''}`);
      const takes = spec.shots.map((s, i) => ({ shotId: safe(s.shotId), order: i, takePath: join(runDir, 'takes', `FAKE_H3_${conv.list.episodeId}-${safe(s.shotId)}.mp4`) }));
      return { runDir, qcDir: join(runDir, 'qc'), takes, multishotExit: r.exitCode, episodeIdForFiles: conv.list.episodeId };
    },
    dub: async ({ cfg, dir }) => {
      const aDir = join(dir, 'audio'); mkdirSync(aDir, { recursive: true });
      const items = [];
      for (const [i, s] of spec.shots.entries()) {
        const line = lineOf(s); const p = join(aDir, `${safe(s.shotId)}.wav`); const t0 = Date.now();
        // fake TTS: dialogue/vo → 440Hz tone, others → silence; always exactly durSec, 48k mono s16
        await ff(['-f', 'lavfi', '-i', line ? `sine=f=${300 + (i % 5) * 60}:d=${s.durSec}:sample_rate=48000` : `anullsrc=r=48000:cl=mono:d=${s.durSec}`, '-t', String(s.durSec), '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', p]);
        if (line) appendLedgerEntry(join(cfg.workDir, 'LEDGER.jsonl'), { shotId: safe(s.shotId), episode: cfg.episodeId, provider: `${cfg.providers.dub}-tts`, model: 'fake-tone', costUsd: 0,
          latencyMs: Date.now() - t0, seed: null, inputHash: hashInputs({ line, shot: s.shotId }), outputSha256: sha(p), outputPath: p, cast: s.cast ?? [] });
        items.push({ shotId: safe(s.shotId), wav: p, hasLine: !!line });
      }
      writeFileSync(join(dir, 'DUB_MANIFEST.json'), JSON.stringify(items, null, 2));
      return { audioDir: aDir, items };
    },
    sub: async ({ cfg, dir }) => {
      let t = 0; let n = 0; const cues: string[] = [];
      for (const s of spec.shots) { const a = t; t += s.durSec; const l = lineOf(s); if (l) cues.push(`${++n}\n${ts(a)} --> ${ts(t)}\n${l}\n`); }
      const p = join(dir, `${cfg.episodeId}.srt`); writeFileSync(p, cues.join('\n')); return { srt: p, cues: n };
    },
    stitch: async ({ cfg, dir, outputs }) => {
      const h3 = outputs.h3; const dub = outputs.dub;
      const video = join(dir, 'episode_video.mp4');
      const c = await runMultiShotConcat({ schemaVersion: 1, episodeId: cfg.episodeId, canvas, durationRange: o.durationRange ?? { minSeconds: 60, maxSeconds: 90 },
        shots: h3.takes, outPath: video, encode: 'reencode' });
      if (!c.ok) throw new Error(`stitch concat exit ${c.exitCode}: ${c.error?.message}`);
      const list = join(dir, 'audio.concat.txt'); writeFileSync(list, dub.items.map((x: any) => `file '${x.wav.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
      const wav = join(dir, 'episode_audio.wav'); await ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', wav]);
      const out = join(dir, 'episode.mp4'); await ff(['-i', video, '-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
      return { episodeMp4: out, sha256: sha(out), totalSec: c.totalSeconds, encode: 'reencode', dtsOk: c.dts?.ok ?? null };
    },
    qc: async ({ cfg, dir, outputs }) => {
      const h3 = outputs.h3; const dub = outputs.dub;
      const suite = await runV13Detectors({ episodeId: cfg.episodeId, shots: suiteShotsFromSpec(spec as never,
        (id) => join(h3.runDir, 'takes', `FAKE_H3_${h3.episodeIdForFiles}-${safe(id)}.mp4`), (id) => join(h3.qcDir, safe(id), 'mid.png'))
        .map(s => ({ ...s, audioPath: dub.items.find((x: any) => x.shotId === safe(s.shotId) && x.hasLine)?.wav })) });
      writeFileSync(join(dir, 'detectors-report.json'), JSON.stringify(suite, null, 2));
      const page = await writeQcSummary(h3.qcDir, { review: true, title: `${cfg.episodeId} 工厂离线演练 · QC 三帧`, order: spec.shots.map(s => safe(s.shotId)) });
      let review: Record<string, unknown> = { status: 'PENDING_HUMAN', note: 'export review from QC page, save as HUMAN_REVIEW.json in workDir, rerun' };
      const rf = join(cfg.workDir, 'HUMAN_REVIEW.json');
      if (existsSync(rf)) {
        const r = await importQcReview(h3.qcDir, JSON.parse(readFileSync(rf, 'utf8')), { receiptDir: join(dir, 'receipts') });
        if (!r.ok) throw new Error(`human review import failed: ${r.errors.join('; ')}`);
        review = { status: 'HUMAN_REVIEWED', receiptPath: r.receiptPath, applied: r.applied };
      }
      const ix = scanEpisodeDir(h3.runDir, cfg.episodeId); scanEpisodeDir(outputs.dub.audioDir.replace(/audio$/, ''), cfg.episodeId, ix);
      const ixPath = join(dir, 'ASSET_INDEX.json'); saveIndex(ixPath, ix);
      return { detectors: suite.summary.overall, g3: suite.summary.g3, identity: 'PENDING_REVIEW', review, qcHtml: page.html, assetIndex: ixPath, assets: ix.assets.length };
    },
  };
}
