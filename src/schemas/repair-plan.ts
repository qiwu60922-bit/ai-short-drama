/**
 * RepairPlan — V11 permanent object #11. Surgical only: subjectScope=shot.
 * Rejects episode scope; canon_lock is not regenable.
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  RepairLayerSchema,
  TimeWindowSchema,
} from './_primitives';

/** Expanded lock set — fail-closed; hashes required. No top-level voiceBible. */
export const PreserveLocksSchema = z
  .object({
    storyBibleRevisionId: identifierSchema,
    storyBibleContentSha256: sha256Schema,
    visualBibleRevisionId: identifierSchema,
    visualBibleContentSha256: sha256Schema,
    characterDnaRevisionIds: z.array(identifierSchema).min(1),
    characterDnaContentSha256s: z.array(sha256Schema).min(1),
    sceneBibleRevisionIds: z.array(identifierSchema).min(1),
    sceneBibleContentSha256s: z.array(sha256Schema).min(1),
    propBibleRevisionIds: z.array(identifierSchema).min(1),
    propBibleContentSha256s: z.array(sha256Schema).min(1),
    shotSpecId: identifierSchema,
    shotSpecContentSha256: sha256Schema,
    priorSceneStateId: identifierSchema.nullable(),
    priorSceneStateContentSha256: sha256Schema.nullable(),
  })
  .strict()
  .superRefine((locks, ctx) => {
    if (locks.characterDnaRevisionIds.length !== locks.characterDnaContentSha256s.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'DNA id/sha length mismatch' });
    }
    if (locks.sceneBibleRevisionIds.length !== locks.sceneBibleContentSha256s.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SceneBible id/sha length mismatch',
      });
    }
    if (locks.propBibleRevisionIds.length !== locks.propBibleContentSha256s.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PropBible id/sha length mismatch',
      });
    }
    const hasPrior = locks.priorSceneStateId !== null;
    const hasPriorSha = locks.priorSceneStateContentSha256 !== null;
    if (hasPrior !== hasPriorSha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'prior SceneState id/sha null mismatch',
      });
    }
  });

export const RepairSubjectScopeSchema = z.enum(['shot']);

export const RepairScopeSchema = z
  .object({
    subjectScope: RepairSubjectScopeSchema,
    shotId: identifierSchema,
    layers: z.array(RepairLayerSchema).min(1),
    timeWindow: TimeWindowSchema.optional(),
    seedPolicy: z.enum(['KEEP', 'RESEED']),
    providerIntent: identifierSchema,
    constraints: z.array(identifierSchema).default([]),
  })
  .superRefine((scope, ctx) => {
    if (scope.layers.includes('canon_lock')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'canon_lock is not regenable; escalate or fix locks first',
      });
    }
  });

export const RepairStrategySchema = z.enum([
  'SURGICAL_REGEN',
  'SELECT_ALT_TAKE',
  'PROMPT_PATCH',
  'AUDIO_ONLY',
  'ESCALATE_TO_HUMAN',
]);

export const RepairPlanSchema = z
  .object({
    id: identifierSchema,
    projectId: identifierSchema,
    /** Aligns to EpisodeManifest.id (design alias: episodeId). */
    episodeManifestId: identifierSchema,
    diagnosisId: identifierSchema,
    qcReportId: identifierSchema,
    strategy: RepairStrategySchema,
    scopes: z.array(RepairScopeSchema).min(1),
    maxCycles: z.number().int().min(1).max(5).default(2),
    budgetReservationId: identifierSchema.optional(),
    preserveLocks: PreserveLocksSchema,
    output: z.literal('NEW_TAKE'),
    takeManifestId: identifierSchema,
    createdAt: utcIsoSchema,
  })
  .superRefine((plan, ctx) => {
    for (const [i, scope] of plan.scopes.entries()) {
      if ((scope as { subjectScope?: string }).subjectScope === 'episode') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scopes', i, 'subjectScope'],
          message: 'subjectScope=episode rejected (surgical only)',
        });
      }
    }
  });

/**
 * Fail-closed helper: reject episode-level repair scopes before parse.
 */
export function assertSurgicalScope(input: unknown): {
  ok: true;
  value: z.infer<typeof RepairScopeSchema>;
} | {
  ok: false;
  code: 'EPISODE_SCOPE_FORBIDDEN' | 'INVALID_SCOPE' | 'CANON_LOCK_NOT_REGENABLE';
} {
  if (typeof input === 'object' && input !== null) {
    const rec = input as Record<string, unknown>;
    if (rec.subjectScope === 'episode' || rec.scope === 'episode' || rec.level === 'episode') {
      return { ok: false, code: 'EPISODE_SCOPE_FORBIDDEN' };
    }
  }
  const parsed = RepairScopeSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join('; ');
    if (msg.includes('canon_lock')) return { ok: false, code: 'CANON_LOCK_NOT_REGENABLE' };
    if (msg.toLowerCase().includes('episode')) return { ok: false, code: 'EPISODE_SCOPE_FORBIDDEN' };
    return { ok: false, code: 'INVALID_SCOPE' };
  }
  return { ok: true, value: parsed.data };
}

export type PreserveLocks = z.infer<typeof PreserveLocksSchema>;
export type RepairScope = z.infer<typeof RepairScopeSchema>;
export type RepairPlan = z.infer<typeof RepairPlanSchema>;
