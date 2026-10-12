/**
 * V14 factory orchestration: script → pack_lock → h3 → dub → sub → stitch → qc.
 * Persistent task queue (FACTORY_QUEUE.json, resumable). A step is "paid" when its provider is not 'fake';
 * paid steps require HUMAN_GO.json (named human, episode+step, unexpired, within budget) — otherwise the run stops there.
 * No step may claim PASS / g3; final status is DONE_AWAITING_HUMAN_REVIEW.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NON_HUMAN_REVIEWER } from '@/agents/assembly/qc-human-review';
export type StepId = 'script' | 'pack_lock' | 'h3' | 'dub' | 'sub' | 'stitch' | 'qc';
export const FACTORY_STEPS: readonly { id: StepId; providerKey?: 'h3' | 'dub' }[] = Object.freeze([
  { id: 'script' }, { id: 'pack_lock' }, { id: 'h3', providerKey: 'h3' }, { id: 'dub', providerKey: 'dub' }, { id: 'sub' }, { id: 'stitch' }, { id: 'qc' }]);
export const FACTORY_EXIT = { OK: 0, USAGE: 2, STEP_FAILED: 51, AWAITING_HUMAN_GO: 50 } as const;
export interface FactoryConfig { episodeId: string; workDir: string; providers: { h3: string; dub: string }; estimatedCostUsd?: Partial<Record<StepId, number>> }
export interface Task { step: StepId; status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'BLOCKED_HUMAN_GO'; attempts: number; paid: boolean; provider?: string;
  output?: any; error?: string; humanGo?: { approver: string; approvedAt: string }; updatedAt?: string }
export interface Queue { schema: 'v14/FactoryQueue/v1'; episodeId: string; tasks: Task[] }
export type StepCtx = { cfg: FactoryConfig; dir: string; outputs: Partial<Record<StepId, any>> };
export type Handlers = Record<StepId, (c: StepCtx) => Promise<Record<string, unknown>>>;
const qPath = (w: string) => join(w, 'FACTORY_QUEUE.json');
export const loadQueue = (w: string): Queue => JSON.parse(readFileSync(qPath(w), 'utf8'));
const save = (w: string, q: Queue) => { writeFileSync(qPath(w) + '.tmp', JSON.stringify(q, null, 2)); renameSync(qPath(w) + '.tmp', qPath(w)); };
export function readHumanGo(w: string, episodeId: string, step: StepId, costUsd: number): { ok: boolean; reason?: string; approver?: string; approvedAt?: string } {
  const p = join(w, 'HUMAN_GO.json'); if (!existsSync(p)) return { ok: false, reason: 'HUMAN_GO.json absent' };
  let g: any; try { g = JSON.parse(readFileSync(p, 'utf8')); } catch { return { ok: false, reason: 'HUMAN_GO.json unreadable' }; }
  if (g.schema !== 'v14/HumanGo/v1') return { ok: false, reason: 'bad schema' };
  if (!g.approver?.trim() || NON_HUMAN_REVIEWER.test(g.approver.trim())) return { ok: false, reason: 'approver must be a named human' };
  if (g.episodeId !== episodeId || !Array.isArray(g.steps) || !g.steps.includes(step)) return { ok: false, reason: `HUMAN_GO does not cover ${episodeId}/${step}` };
  if (!(Date.parse(g.expiresAt) > Date.now())) return { ok: false, reason: 'HUMAN_GO expired' };
  if (!(typeof g.maxCostUsd === 'number' && costUsd <= g.maxCostUsd)) return { ok: false, reason: `estimated $${costUsd} exceeds HUMAN_GO max $${g.maxCostUsd}` };
  return { ok: true, approver: g.approver, approvedAt: g.approvedAt };
}
const claimsPass = (o: unknown) => /"(g3|V11_G3|verdict|status)"\s*:\s*("(PASS|HUMAN_PASS|G3_PASS)"|true)/.test(JSON.stringify(o ?? {}));
export async function runFactory(cfg: FactoryConfig, h: Handlers) {
  mkdirSync(cfg.workDir, { recursive: true });
  const q: Queue = existsSync(qPath(cfg.workDir)) ? loadQueue(cfg.workDir)
    : { schema: 'v14/FactoryQueue/v1', episodeId: cfg.episodeId, tasks: FACTORY_STEPS.map(s => ({ step: s.id, status: 'PENDING', attempts: 0, paid: false })) };
  const outputs: StepCtx['outputs'] = Object.fromEntries(q.tasks.filter(t => t.status === 'DONE').map(t => [t.step, t.output]));
  for (const s of FACTORY_STEPS) {
    const t = q.tasks.find(x => x.step === s.id)!;
    if (t.status === 'DONE') continue;
    const provider = s.providerKey ? cfg.providers[s.providerKey] : 'local';
    t.provider = provider; t.paid = provider !== 'fake' && provider !== 'local';
    if (t.paid) {
      const go = readHumanGo(cfg.workDir, cfg.episodeId, s.id, cfg.estimatedCostUsd?.[s.id] ?? Number.POSITIVE_INFINITY);
      if (!go.ok) { t.status = 'BLOCKED_HUMAN_GO'; t.error = go.reason; t.updatedAt = new Date().toISOString(); save(cfg.workDir, q);
        return { exitCode: FACTORY_EXIT.AWAITING_HUMAN_GO, status: 'AWAITING_HUMAN_GO' as const, stoppedAt: s.id, reason: go.reason, queuePath: qPath(cfg.workDir) }; }
      t.humanGo = { approver: go.approver!, approvedAt: go.approvedAt! };
    }
    t.status = 'RUNNING'; t.attempts++; delete t.error; save(cfg.workDir, q);
    const dir = join(cfg.workDir, s.id); mkdirSync(dir, { recursive: true });
    try {
      const out = await h[s.id]({ cfg, dir, outputs });
      if (claimsPass(out)) throw new Error('step output claims PASS/g3; machine may not pass (G3 is human-only)');
      t.output = out; t.status = 'DONE'; outputs[s.id] = out;
    } catch (e) {
      t.status = 'FAILED'; t.error = (e as Error).message; t.updatedAt = new Date().toISOString(); save(cfg.workDir, q);
      return { exitCode: FACTORY_EXIT.STEP_FAILED, status: 'STEP_FAILED' as const, stoppedAt: s.id, reason: t.error, queuePath: qPath(cfg.workDir) };
    }
    t.updatedAt = new Date().toISOString(); save(cfg.workDir, q);
  }
  return { exitCode: FACTORY_EXIT.OK, status: 'DONE_AWAITING_HUMAN_REVIEW' as const, queuePath: qPath(cfg.workDir), g3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const };
}
/** Offline fake handlers: write real (small) artifacts; no network, no money. */
export function fakeHandlers(o: { packStatus?: string; shots?: { shotId: string; durSec: number; line?: string }[] } = {}): Handlers {
  const shots = o.shots ?? [{ shotId: 'S01', durSec: 4, line: '夜澜市的夜，从来不只是夜。' }, { shotId: 'S02', durSec: 6, line: '你来了。' }];
  const w = (p: string, v: unknown) => { writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2)); return p; };
  const ts = (s: number) => { const ms = Math.round(s * 1000); const p = (n: number, l = 2) => String(n).padStart(l, '0');
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
  return {
    script: async ({ dir, cfg }) => ({ path: w(join(dir, 'SCRIPT.json'), { episodeId: cfg.episodeId, shots }), shots: shots.length }),
    pack_lock: async () => { const st = o.packStatus ?? 'HUMAN_LOCK'; if (st !== 'HUMAN_LOCK') throw new Error(`pack is ${st}; factory requires HUMAN_LOCK (machine never locks)`); return { packStatus: st }; },
    h3: async ({ dir, cfg }) => ({ provider: cfg.providers.h3, manifest: w(join(dir, 'H3_MANIFEST.json'), shots.map(s => ({ shotId: s.shotId, take: `takes/${s.shotId}.mp4`, fake: true }))) }),
    dub: async ({ dir, cfg }) => ({ provider: cfg.providers.dub, manifest: w(join(dir, 'DUB_MANIFEST.json'), shots.filter(s => s.line).map(s => ({ shotId: s.shotId, wav: `${s.shotId}.wav`, fake: true }))) }),
    sub: async ({ dir, cfg }) => { let t = 0; const cues = shots.map((s, i) => { const a = t; t += s.durSec; return s.line ? `${i + 1}\n${ts(a)} --> ${ts(t)}\n${s.line}\n` : ''; }).filter(Boolean);
      return { srt: w(join(dir, `${cfg.episodeId}.srt`), cues.join('\n')) }; },
    stitch: async ({ dir }) => ({ manifest: w(join(dir, 'STITCH_MANIFEST.json'), { encode: 'reencode', totalSec: shots.reduce((a, s) => a + s.durSec, 0), fake: true }) }),
    qc: async ({ dir }) => ({ summary: w(join(dir, 'QC_SUMMARY.json'), { detectors: 'INCOMPLETE', humanReview: 'PENDING' }), g3: 'NOT_EVALUATED', identity: 'PENDING_REVIEW' }),
  };
}
