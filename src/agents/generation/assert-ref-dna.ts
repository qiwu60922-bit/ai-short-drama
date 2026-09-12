/**
 * Wave12-B · IR-20…22 DNA/RefBinding fail-closed gate for enqueueH3Take.
 * Missing/invalid binding ⇒ refuse before any Comfy submit.
 * Unlock ≠ G3 PASS ≠ publish (W12B-03).
 */
import {
  RefBindingSchema,
  type RefBinding,
  type RefDnaGateInput,
} from '@/schemas/ref-binding';
import type { GenerationFailureCode, GenerationResult } from './types';

export type RefDnaRefuseCode =
  | 'COMFY_I2V_REF_NO_DNA'
  | 'COMFY_I2V_REF_SHA_MISMATCH'
  | 'COMFY_I2V_REF_ROLE_GAP';

const REFUSE_AS_FAILURE: Record<RefDnaRefuseCode, GenerationFailureCode> = {
  COMFY_I2V_REF_NO_DNA: 'INVALID_INPUT',
  COMFY_I2V_REF_SHA_MISMATCH: 'INVALID_INPUT',
  COMFY_I2V_REF_ROLE_GAP: 'INVALID_INPUT',
};

export function refDnaRefuse(
  refuse: RefDnaRefuseCode,
  detail: string,
): GenerationResult<never> {
  return {
    ok: false,
    code: REFUSE_AS_FAILURE[refuse],
    message: `${refuse}:${detail}`,
  };
}

/**
 * Assert IR-20…22 RefBinding before Comfy submit.
 * Returns null when OK; otherwise a failed GenerationResult (caller must not submit).
 */
export function assertRefDnaOrThrow(
  input: RefDnaGateInput | undefined | null,
): GenerationResult<never> | null {
  if (!input || !Array.isArray(input.bindings) || input.bindings.length === 0) {
    return refDnaRefuse(
      'COMFY_I2V_REF_NO_DNA',
      'missing RefBinding[] (IR-20 characterId+appearanceRevisionId+refContentSha256)',
    );
  }

  for (const raw of input.bindings as readonly Record<string, unknown>[]) {
    if (
      raw &&
      typeof raw === 'object' &&
      'visualBibleRevisionId' in raw &&
      raw.visualBibleRevisionId != null &&
      String(raw.visualBibleRevisionId).length > 0
    ) {
      return refDnaRefuse(
        'COMFY_I2V_REF_NO_DNA',
        'visualBibleRevisionId must not stand in for appearance (NM-R02)',
      );
    }
    if (
      raw &&
      typeof raw === 'object' &&
      (raw as { operatorKind?: string }).operatorKind === 'smoke_placeholder'
    ) {
      return refDnaRefuse(
        'COMFY_I2V_REF_NO_DNA',
        'operatorKind smoke_placeholder cannot unlock factory enqueue (U5)',
      );
    }
  }

  const parsedBindings: RefBinding[] = [];
  for (const raw of input.bindings) {
    const parsed = RefBindingSchema.safeParse(raw);
    if (!parsed.success) {
      return refDnaRefuse(
        'COMFY_I2V_REF_NO_DNA',
        `RefBinding Zod failed: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      );
    }
    parsedBindings.push(parsed.data);
  }

  for (const b of parsedBindings) {
    if (b.appearanceContentSha256) {
      const match =
        b.refContentSha256.toLowerCase() ===
        b.appearanceContentSha256.toLowerCase();
      if (!match && !b.approvedTemporary) {
        return refDnaRefuse(
          'COMFY_I2V_REF_SHA_MISMATCH',
          `refContentSha256≠appearanceContentSha256 for characterId=${b.characterId}`,
        );
      }
    } else if (!b.approvedTemporary) {
      return refDnaRefuse(
        'COMFY_I2V_REF_SHA_MISMATCH',
        `missing appearanceContentSha256 and approvedTemporary for characterId=${b.characterId}`,
      );
    }
  }

  const visible = input.visibleCharacterIds ?? [];
  if (visible.length > 1 && input.leadOnly !== true) {
    const bound = new Set(parsedBindings.map((b) => b.characterId));
    const missing = visible.filter((id) => !bound.has(id));
    if (missing.length > 0) {
      return refDnaRefuse(
        'COMFY_I2V_REF_ROLE_GAP',
        `visible characters missing RefBinding: ${missing.join(',')}`,
      );
    }
  }

  return null;
}
