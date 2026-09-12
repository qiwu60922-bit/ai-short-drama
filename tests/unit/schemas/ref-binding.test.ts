/**
 * W12A-01 · RefBinding Zod missing fields refuse
 * Wave12-B companion · ≠ G3
 */
import { describe, expect, it } from 'vitest';
import { RefBindingSchema, RefDnaGateInputSchema } from '@/schemas/ref-binding';

const sha = 'a'.repeat(64);

describe('ref-binding schema (W12A-01)', () => {
  it('rejects missing characterId / appearanceRevisionId / refContentSha256', () => {
    const bad = RefBindingSchema.safeParse({
      operatorKind: 'hero_portrait',
    });
    expect(bad.success).toBe(false);
  });

  it('accepts minimal IR-20 binding', () => {
    const ok = RefBindingSchema.safeParse({
      characterId: 'char-1',
      appearanceRevisionId: 'app-1',
      refContentSha256: sha,
      appearanceContentSha256: sha,
      operatorKind: 'dna_locked_export',
    });
    expect(ok.success).toBe(true);
  });

  it('rejects empty bindings array for gate input', () => {
    const bad = RefDnaGateInputSchema.safeParse({ bindings: [] });
    expect(bad.success).toBe(false);
  });
});
