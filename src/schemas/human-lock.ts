/**
 * HumanLock — human-approved revision lock (support type; Prisma V11HumanLock).
 * Fail-closed: identifier + sha256 + UTC lockedAt required.
 * Wave3: subjectType documents lock subject enum (still identifier-shaped).
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
} from './_primitives';

/** Canonical HumanLock subject types (Wave3). */
export const HumanLockSubjectTypeSchema = z.enum([
  'story_bible',
  'visual_bible',
  'character_dna',
  'scene_bible',
  'prop_bible',
  'shot_spec',
  'episode_manifest',
]);

export const HumanLockSchema = z.object({
  id: identifierSchema,
  /** Prefer HumanLockSubjectTypeSchema values; identifier kept for forward-compat. */
  subjectType: identifierSchema,
  subjectId: identifierSchema,
  revisionId: identifierSchema,
  contentSha256: sha256Schema,
  lockedBy: identifierSchema,
  lockedAt: utcIsoSchema,
});

export type HumanLock = z.infer<typeof HumanLockSchema>;
export type HumanLockSubjectTypeZod = z.infer<typeof HumanLockSubjectTypeSchema>;
