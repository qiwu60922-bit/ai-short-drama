/**
 * Pure local mock Take generator — zero network / Comfy / paid APIs.
 * Tier style: local.mock.* (ADR-0004 local.* family; Wave6 seeds in tier-ids).
 */
import { createHash } from 'node:crypto';
import { ShotSpecSchema, type ShotSpec } from '@/schemas/shot-spec';
import { TakeSchema, type Take } from '@/schemas/take-manifest';
import {
  MOCK_GENERATOR_KEYS,
  type GenerationFailureCode,
  type GenerationResult,
  type MockGeneratorKey,
} from './types';

const PAID_PREFIXES = ['cn.ark.', 'cn.kling.', 'global.'] as const;

export interface GenerateTakesCommand {
  readonly shotSpec: ShotSpec | unknown;
  readonly count: number;
  readonly seed?: string;
  readonly takeManifestId: string;
  readonly generatorKey: string;
  readonly createdAt?: string;
  /** Starting ordinal (default 0). */
  readonly ordinalStart?: number;
}

export interface GeneratedTakeBundle {
  readonly takes: readonly Take[];
  /** Parallel synthetic content hashes (not on TakeSchema; used by attempt events). */
  readonly contentSha256s: readonly string[];
  readonly generatorKey: MockGeneratorKey;
  readonly seed: string;
}

function isPaidTierId(value: string): boolean {
  return PAID_PREFIXES.some((p) => value.startsWith(p));
}

function isMockGeneratorKey(value: string): value is MockGeneratorKey {
  return (MOCK_GENERATOR_KEYS as readonly string[]).includes(value);
}

function deterministicSha(parts: readonly string[]): string {
  return createHash('sha256').update(parts.join('|'), 'utf8').digest('hex');
}

function deterministicId(prefix: string, parts: readonly string[]): string {
  const digest = createHash('sha256').update(parts.join('|'), 'utf8').digest('hex').slice(0, 16);
  return `${prefix}-${digest}`;
}

/**
 * Create N Takes with synthetic artifactRevisionIds / contentSha256 (deterministic from seed).
 * Fail-closed on invalid ShotSpec, count < 1, or paid/unknown generator keys.
 */
export function generateTakes(cmd: GenerateTakesCommand): GenerationResult<GeneratedTakeBundle> {
  if (isPaidTierId(cmd.generatorKey)) {
    return { ok: false, code: 'PAID_TIER_REFUSED', message: `refused paid tier: ${cmd.generatorKey}` };
  }
  if (!isMockGeneratorKey(cmd.generatorKey)) {
    return { ok: false, code: 'UNKNOWN_GENERATOR', message: `expected local.mock.*; got ${cmd.generatorKey}` };
  }
  if (!Number.isInteger(cmd.count) || cmd.count < 1) {
    return { ok: false, code: 'INVALID_COUNT', message: 'count must be integer >= 1' };
  }

  const parsed = ShotSpecSchema.safeParse(cmd.shotSpec);
  if (!parsed.success) {
    return { ok: false, code: 'INVALID_SHOT_SPEC', message: parsed.error.message };
  }
  const shotSpec = parsed.data;

  const idCheck = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/;
  if (!idCheck.test(cmd.takeManifestId)) {
    return { ok: false, code: 'INVALID_INPUT', message: 'invalid takeManifestId' };
  }

  const seed = cmd.seed ?? 'mock-seed-0';
  const createdAt = cmd.createdAt ?? '2026-09-12T06:46:00.000Z';
  const ordinalStart = cmd.ordinalStart ?? 0;

  const takes: Take[] = [];
  const contentSha256s: string[] = [];

  for (let i = 0; i < cmd.count; i += 1) {
    const ordinal = ordinalStart + i;
    const contentSha256 = deterministicSha([
      seed,
      shotSpec.id,
      shotSpec.contentSha256,
      cmd.generatorKey,
      String(ordinal),
      'content',
    ]);
    const artifactRevisionId = deterministicId('art', [
      seed,
      shotSpec.id,
      cmd.generatorKey,
      String(ordinal),
      'artifact',
    ]);
    const takeId = deterministicId('take', [
      seed,
      cmd.takeManifestId,
      String(ordinal),
      'take',
    ]);

    const takeParsed = TakeSchema.safeParse({
      id: takeId,
      takeManifestId: cmd.takeManifestId,
      ordinal,
      artifactRevisionId,
      createdAt,
    });
    if (!takeParsed.success) {
      return { ok: false, code: 'INVALID_INPUT', message: takeParsed.error.message };
    }
    takes.push(Object.freeze({ ...takeParsed.data }));
    contentSha256s.push(contentSha256);
  }

  return {
    ok: true,
    value: {
      takes,
      contentSha256s,
      generatorKey: cmd.generatorKey,
      seed,
    },
  };
}

export type { GenerationFailureCode, ShotSpec, Take };
