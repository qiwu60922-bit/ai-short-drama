/**
 * Wave12 · One-click single-shot CLI core (spec: WAVE12_ONECLICK_SINGLE_SHOT_CLI_SPEC.md).
 * Validate → canonical seed → stub/official guard → assertRefDna → dry-run plan | gated live.
 *
 * Offline by design: live requires ONECLICK_LIVE=1 / A1_EXECUTE=1 AND an injected
 * `live` port (the CLI ships none). Success = TECH only; identity PENDING_REVIEW, G3 NOT_EVALUATED.
 */
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { assertRefDnaOrThrow } from './assert-ref-dna';
/** Mirrors enqueue-h3-take H3_GENERATOR_KEY (not imported: that module pulls continuity deps). */
export const H3_GENERATOR_KEY = 'local.comfy.minimax_h3' as const;

export const ONECLICK_EXIT = {
  OK: 0, USAGE: 2, LIVE_FORBIDDEN: 3, REF_DNA: 20, SEED: 21, STUB_WORKFLOW: 22,
  GATE_CONFIG: 23, PROVIDER_FAILED: 40, NOT_READY: 50, TRANSPORT: 51, POLL_TIMEOUT: 52, INTERNAL: 60,
} as const;

const sha = z.string().regex(/^[a-f0-9]{64}$/i);

export const OneClickShotRequestSchema = z.object({
  schemaVersion: z.literal(1),
  mode: z.enum(['live', 'dry-run']),
  shot: z.object({
    shotSpecId: z.string().min(1),
    clientId: z.string().min(1).optional(),
    generatorKey: z.string().min(1).default(H3_GENERATOR_KEY),
  }),
  ref: z.object({
    characterId: z.string().min(1),
    appearanceRevisionId: z.string().min(1),
    refContentSha256: sha,
    appearanceContentSha256: sha.optional(),
    operatorKind: z.enum(['hero_portrait', 'dna_locked_export']).default('dna_locked_export'),
    approvedTemporary: z.object({ actor: z.string().min(1), reason: z.string().min(1) }).optional(),
    firstFramePath: z.string().min(1),
  }).optional(),
  render: z.object({
    width: z.number().int().positive().default(1344),
    height: z.number().int().positive().default(768),
    seed: z.string().min(1),
    positivePrompt: z.string().min(1),
    promptHardBansInline: z.boolean().default(true),
    workflowFormat: z.string().default('minimax_h3_i2v'),
  }),
  gates: z.object({
    requireAssertRefDna: z.boolean().default(true),
    requireCanonicalSeed: z.boolean().default(true),
    forbidComfySeed0Literal: z.boolean().default(true),
    forbidStubWorkflow: z.boolean().default(true),
    requireHumanLiveFlag: z.boolean().default(true),
  }).default({}),
  outDir: z.string().optional(),
});
export type OneClickShotRequest = z.infer<typeof OneClickShotRequestSchema>;

export interface OneClickShotResult {
  ok: boolean;
  exitCode: number;
  runId: string;
  mode: 'live' | 'dry-run' | 'unknown';
  seed?: string;
  noiseSeed?: number;
  canvas?: { width: number; height: number };
  refContentSha256?: string;
  promptId?: string;
  artifact?: { filename: string; contentSha256: string; path?: string };
  plan?: Record<string, unknown>;
  path: string;
  identity: { status: 'PENDING_REVIEW'; note: string };
  gates: { V11_G3: 'NOT_EVALUATED'; publish: 'FORBIDDEN' };
  error?: { code: string; message: string; rejectCode?: string };
  elapsed_s: number;
}

/** Injected live executor. Only path to a real submit; CLI provides none (offline). */
export interface OneClickLivePort {
  probeReady(): Promise<boolean>;
  enqueue(plan: Record<string, unknown>): Promise<
    | { status: 'SUCCEEDED'; promptId: string; artifact: { filename: string; contentSha256: string; path?: string } }
    | { status: 'FAILED'; promptId?: string; message: string }
    | { status: 'TIMEOUT'; promptId?: string }
  >;
}

export interface OneClickDeps {
  env?: Record<string, string | undefined>;
  live?: OneClickLivePort;
  now?: () => number;
  runId?: string;
}

const OFFICIAL_FORMATS = new Set(['minimax_h3_i2v']);
const CANONICAL_SEED = /^(0|[1-9][0-9]*)$/;
const MAX_SEED = 2 ** 53 - 1;

/** N1 seed normalization. Returns noise seed or reject reason. */
export function normalizeSeed(
  seed: string,
  opts: { requireCanonical: boolean; forbidSeed0Literal: boolean; mode: 'live' | 'dry-run' },
): { ok: true; noiseSeed: number } | { ok: false; reason: string } {
  if (seed === 'comfy-seed-0') {
    if (opts.forbidSeed0Literal && opts.mode === 'live') return { ok: false, reason: 'comfy-seed-0 literal forbidden in live; use explicit digits' };
    return { ok: true, noiseSeed: 0 };
  }
  if (opts.requireCanonical && !CANONICAL_SEED.test(seed)) return { ok: false, reason: `non-canonical seed "${seed}"` };
  const n = Number(seed);
  if (!Number.isSafeInteger(n) || n < 0 || n > MAX_SEED) return { ok: false, reason: `seed out of range "${seed}"` };
  return { ok: true, noiseSeed: n };
}

export async function runOneClickShot(raw: unknown, deps: OneClickDeps = {}): Promise<OneClickShotResult> {
  const now = deps.now ?? Date.now;
  const t0 = now();
  const env = deps.env ?? {};
  const runId = deps.runId ?? `ocr-${randomUUID().slice(0, 12)}`;
  const base = {
    runId,
    path: 'oneclick→assertRefDna→plan',
    identity: { status: 'PENDING_REVIEW' as const, note: 'TECH only; Continuity three-frame gate separate' },
    gates: { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const },
  };
  const fail = (exitCode: number, code: string, message: string, extra: Partial<OneClickShotResult> = {}, rejectCode?: string): OneClickShotResult => ({
    ...base, mode: 'unknown', ...extra, ok: false, exitCode,
    error: { code, message, ...(rejectCode ? { rejectCode } : {}) },
    elapsed_s: (now() - t0) / 1000,
  });

  try {
    const parsed = OneClickShotRequestSchema.safeParse(raw);
    if (!parsed.success) return fail(ONECLICK_EXIT.USAGE, 'USAGE', parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    const req = parsed.data;
    const mode = req.mode;
    const ctx = { mode, canvas: { width: req.render.width, height: req.render.height }, seed: req.render.seed };

    if (req.shot.generatorKey !== H3_GENERATOR_KEY) return fail(ONECLICK_EXIT.USAGE, 'USAGE', `generatorKey must be ${H3_GENERATOR_KEY}`, ctx);

    if (mode === 'live' && req.gates.requireHumanLiveFlag && env.ONECLICK_LIVE !== '1' && env.A1_EXECUTE !== '1')
      return fail(ONECLICK_EXIT.LIVE_FORBIDDEN, 'LIVE_FORBIDDEN', 'live requires ONECLICK_LIVE=1 or A1_EXECUTE=1 (human order)', ctx);
    if (mode === 'live' && !req.gates.requireHumanLiveFlag)
      return fail(ONECLICK_EXIT.GATE_CONFIG, 'GATE_CONFIG', 'requireHumanLiveFlag cannot be disabled for live', ctx);

    const s = normalizeSeed(req.render.seed, { requireCanonical: req.gates.requireCanonicalSeed, forbidSeed0Literal: req.gates.forbidComfySeed0Literal, mode });
    if (!s.ok) return fail(ONECLICK_EXIT.SEED, 'SEED_INVALID', s.reason, ctx, 'COMFY_H3_SEED_INVALID');

    if (req.gates.forbidStubWorkflow && !OFFICIAL_FORMATS.has(req.render.workflowFormat))
      return fail(ONECLICK_EXIT.STUB_WORKFLOW, 'STUB_WORKFLOW', `non-official workflow format "${req.render.workflowFormat}"`, ctx);

    if (req.gates.requireAssertRefDna || mode === 'live') {
      const refused = assertRefDnaOrThrow(req.ref ? {
        bindings: [{
          characterId: req.ref.characterId,
          appearanceRevisionId: req.ref.appearanceRevisionId,
          refContentSha256: req.ref.refContentSha256,
          ...(req.ref.appearanceContentSha256 ? { appearanceContentSha256: req.ref.appearanceContentSha256 } : {}),
          operatorKind: req.ref.operatorKind,
          ...(req.ref.approvedTemporary ? { approvedTemporary: req.ref.approvedTemporary } : {}),
        }],
      } : null);
      if (refused && !refused.ok) {
        const rejectCode = refused.message.split(':')[0];
        return fail(ONECLICK_EXIT.REF_DNA, 'REF_DNA', refused.message, ctx, rejectCode);
      }
    }

    const plan = {
      runId, shotSpecId: req.shot.shotSpecId,
      clientId: req.shot.clientId ?? `aidrama-h3-${req.shot.shotSpecId}`,
      generatorKey: req.shot.generatorKey, workflowFormat: req.render.workflowFormat,
      canvas: ctx.canvas, seed: req.render.seed, noiseSeed: s.noiseSeed,
      firstFrameUploadName: req.ref ? req.ref.firstFramePath.split(/[\\/]/).pop() : undefined,
      refContentSha256: req.ref?.refContentSha256,
      positivePromptSha256: createHash('sha256').update(req.render.positivePrompt).digest('hex'),
      promptHardBansInline: req.render.promptHardBansInline,
    };
    const ok = { ...base, ...ctx, noiseSeed: s.noiseSeed, refContentSha256: req.ref?.refContentSha256, plan };

    if (mode === 'dry-run') return { ...ok, ok: true, exitCode: ONECLICK_EXIT.OK, elapsed_s: (now() - t0) / 1000 };

    if (!deps.live) return fail(ONECLICK_EXIT.LIVE_FORBIDDEN, 'LIVE_NOT_WIRED', 'no live port injected (offline build; paid runs paused)', ok);
    if (!(await deps.live.probeReady())) return fail(ONECLICK_EXIT.NOT_READY, 'NOT_READY', 'provider not ready', ok);
    let r;
    try { r = await deps.live.enqueue(plan); } catch (e) {
      return fail(ONECLICK_EXIT.TRANSPORT, 'TRANSPORT', (e as Error).message, ok);
    }
    const livePath = 'oneclick→assertRefDna→livePort.enqueue';
    if (r.status === 'FAILED') return fail(ONECLICK_EXIT.PROVIDER_FAILED, 'PROVIDER_FAILED', r.message, { ...ok, path: livePath, promptId: r.promptId });
    if (r.status === 'TIMEOUT') return fail(ONECLICK_EXIT.POLL_TIMEOUT, 'POLL_TIMEOUT', 'poll timeout', { ...ok, path: livePath, promptId: r.promptId });
    return { ...ok, path: livePath, ok: true, exitCode: ONECLICK_EXIT.OK, promptId: r.promptId, artifact: r.artifact, elapsed_s: (now() - t0) / 1000 };
  } catch (e) {
    return fail(ONECLICK_EXIT.INTERNAL, 'INTERNAL', (e as Error).message);
  }
}
