/**
 * ShotContinuityLock — ← V6 ShotContinuityBinding (Continuity v2 naming).
 * Prisma: V11ShotContinuityLock (bindingJson + contentSha256).
 * Uses StoryBible / SceneBible / appearance* — never StoryWorld / LocationBible.
 * Wave3: priorSceneStateContentSha256 required when priorSceneStateId is set.
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
} from './_primitives';

export const ShotContinuityLockSchema = z
  .object({
    id: identifierSchema,
    shotSpecId: identifierSchema,
    storyBibleRevisionId: identifierSchema,
    storyBibleContentSha256: sha256Schema,
    appearanceRevisionId: identifierSchema,
    appearanceContentSha256: sha256Schema,
    sceneBibleRevisionId: identifierSchema,
    sceneBibleContentSha256: sha256Schema,
    voiceRevisionId: identifierSchema,
    voiceContentSha256: sha256Schema,
    priorSceneStateId: identifierSchema.nullable(),
    priorSceneStateContentSha256: sha256Schema.nullable(),
    contentSha256: sha256Schema,
    createdAt: utcIsoSchema,
  })
  .strict()
  .superRefine((lock, ctx) => {
    const hasPrior = lock.priorSceneStateId !== null;
    const hasPriorSha = lock.priorSceneStateContentSha256 !== null;
    if (hasPrior !== hasPriorSha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'prior SceneState id/sha null mismatch',
        path: hasPrior ? ['priorSceneStateContentSha256'] : ['priorSceneStateId'],
      });
    }
    if (hasPrior && !hasPriorSha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'prior SceneState sha required when priorSceneStateId is set',
        path: ['priorSceneStateContentSha256'],
      });
    }
  });

export type ShotContinuityLock = z.infer<typeof ShotContinuityLockSchema>;
