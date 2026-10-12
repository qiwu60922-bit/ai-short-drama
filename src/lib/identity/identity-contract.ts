const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;

export type IdentityGateStatus = 'PASS' | 'NC' | 'ERROR';

export interface IdentityScoreProvenance {
  readonly source: string;
  readonly version: string;
  readonly providerKey: string;
  readonly embeddingModelVersion: string;
}

export interface IdentityScore {
  readonly value: number;
  readonly provenance: IdentityScoreProvenance;
}

export interface IdentityThresholdPolicy {
  readonly policyId: string;
  readonly policyVersion: string;
  readonly minScore: number;
  readonly poseTolerance: number;
}

export interface IdentityReferenceBinding {
  readonly characterId: string;
  readonly artifactRevisionId: string;
  readonly contentSha256: string;
}

export interface IdentityContract {
  readonly id: string;
  readonly projectId: string;
  readonly policy: IdentityThresholdPolicy;
  readonly referenceBindings: readonly IdentityReferenceBinding[];
  readonly wardrobeConstraints: readonly string[];
  readonly propConstraints: readonly string[];
  readonly score: IdentityScore;
  readonly createdAt: string;
}

export type IdentityContractFailureCode =
  | 'INVALID_CONTRACT'
  | 'MISSING_SCORE_PROVENANCE'
  | 'MUTABLE_REFERENCE_URL'
  | 'MISSING_REFERENCE_BINDING'
  | 'BELOW_THRESHOLD';

export type IdentityContractResult =
  | { readonly ok: true; readonly value: IdentityContract; readonly status: IdentityGateStatus }
  | { readonly ok: false; readonly code: IdentityContractFailureCode };

function isIdentifier(value: unknown): value is string {
  return typeof value === 'string' && identifierPattern.test(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && sha256Pattern.test(value);
}

function isUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function isUnitInterval(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function looksLikeUrl(value: string): boolean {
  return /^(https?:|s3:|data:|javascript:)/i.test(value) || value.includes('://') || value.includes('\\');
}

function strictOwnKeys(input: unknown, allowed: readonly string[]): boolean {
  try {
    if (typeof input !== 'object' || input === null || Array.isArray(input) || Object.getPrototypeOf(input) !== Object.prototype) return false;
    const keys = Reflect.ownKeys(input);
    if (keys.length !== allowed.length) return false;
    const allowedSet = new Set(allowed);
    for (const key of keys) {
      if (typeof key !== 'string' || !allowedSet.has(key)) return false;
      const descriptor = Object.getOwnPropertyDescriptor(input, key);
      if (!descriptor || !descriptor.enumerable || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an identity contract. A score without source/version provenance is invalid.
 * Reference bindings must point at immutable artifact revision IDs, never mutable URLs.
 */
export function validateIdentityContract(input: unknown): IdentityContractResult {
  try {
    if (!strictOwnKeys(input, ['id', 'projectId', 'policy', 'referenceBindings', 'wardrobeConstraints', 'propConstraints', 'score', 'createdAt'])) {
      return { ok: false, code: 'INVALID_CONTRACT' };
    }
    const record = input as Record<string, unknown>;
    if (!isIdentifier(record.id) || !isIdentifier(record.projectId) || !isUtcTimestamp(record.createdAt)) {
      return { ok: false, code: 'INVALID_CONTRACT' };
    }

    if (!strictOwnKeys(record.policy, ['policyId', 'policyVersion', 'minScore', 'poseTolerance'])) {
      return { ok: false, code: 'INVALID_CONTRACT' };
    }
    const policy = record.policy as Record<string, unknown>;
    if (!isIdentifier(policy.policyId) || !isIdentifier(policy.policyVersion) || !isUnitInterval(policy.minScore) || !isUnitInterval(policy.poseTolerance)) {
      return { ok: false, code: 'INVALID_CONTRACT' };
    }

    if (!Array.isArray(record.referenceBindings) || record.referenceBindings.length < 1) {
      return { ok: false, code: 'MISSING_REFERENCE_BINDING' };
    }
    const bindings: IdentityReferenceBinding[] = [];
    for (const item of record.referenceBindings) {
      if (!strictOwnKeys(item, ['characterId', 'artifactRevisionId', 'contentSha256'])) {
        return { ok: false, code: 'INVALID_CONTRACT' };
      }
      const binding = item as Record<string, unknown>;
      if (typeof binding.characterId !== 'string' || typeof binding.artifactRevisionId !== 'string' || typeof binding.contentSha256 !== 'string') {
        return { ok: false, code: 'INVALID_CONTRACT' };
      }
      if (looksLikeUrl(binding.artifactRevisionId)) {
        return { ok: false, code: 'MUTABLE_REFERENCE_URL' };
      }
      if (!isIdentifier(binding.characterId) || !isIdentifier(binding.artifactRevisionId) || !isSha256(binding.contentSha256)) {
        return { ok: false, code: 'INVALID_CONTRACT' };
      }
      bindings.push({
        characterId: binding.characterId,
        artifactRevisionId: binding.artifactRevisionId,
        contentSha256: binding.contentSha256,
      });
    }

    if (!Array.isArray(record.wardrobeConstraints) || !Array.isArray(record.propConstraints)) {
      return { ok: false, code: 'INVALID_CONTRACT' };
    }
    for (const value of [...record.wardrobeConstraints, ...record.propConstraints]) {
      if (!isIdentifier(value)) return { ok: false, code: 'INVALID_CONTRACT' };
    }

    if (!strictOwnKeys(record.score, ['value', 'provenance'])) {
      return { ok: false, code: 'MISSING_SCORE_PROVENANCE' };
    }
    const score = record.score as Record<string, unknown>;
    if (!isUnitInterval(score.value)) return { ok: false, code: 'INVALID_CONTRACT' };
    if (!strictOwnKeys(score.provenance, ['source', 'version', 'providerKey', 'embeddingModelVersion'])) {
      return { ok: false, code: 'MISSING_SCORE_PROVENANCE' };
    }
    const provenance = score.provenance as Record<string, unknown>;
    if (
      !isIdentifier(provenance.source)
      || !isIdentifier(provenance.version)
      || !isIdentifier(provenance.providerKey)
      || !isIdentifier(provenance.embeddingModelVersion)
    ) {
      return { ok: false, code: 'MISSING_SCORE_PROVENANCE' };
    }

    const contract: IdentityContract = Object.freeze({
      id: record.id,
      projectId: record.projectId,
      policy: Object.freeze({
        policyId: policy.policyId,
        policyVersion: policy.policyVersion,
        minScore: policy.minScore,
        poseTolerance: policy.poseTolerance,
      }),
      referenceBindings: Object.freeze(bindings.map((binding) => Object.freeze(binding))),
      wardrobeConstraints: Object.freeze([...(record.wardrobeConstraints as string[])]),
      propConstraints: Object.freeze([...(record.propConstraints as string[])]),
      score: Object.freeze({
        value: score.value,
        provenance: Object.freeze({
          source: provenance.source,
          version: provenance.version,
          providerKey: provenance.providerKey,
          embeddingModelVersion: provenance.embeddingModelVersion,
        }),
      }),
      createdAt: record.createdAt,
    });

    if (contract.score.value < contract.policy.minScore) {
      return { ok: false, code: 'BELOW_THRESHOLD' };
    }
    return { ok: true, value: contract, status: 'PASS' };
  } catch {
    return { ok: false, code: 'INVALID_CONTRACT' };
  }
}
