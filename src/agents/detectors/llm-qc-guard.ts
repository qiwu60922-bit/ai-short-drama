/** V13 LLM QC assist guard: LLM output is advisory only; any g3/pass/verdict/identity claim is rejected. */
import { z } from 'zod';
const FORBIDDEN_KEY = /^(g3|v11_g3|pass|verdict|identity|status|autopass|canpublish|publish|lock)$/i;
const FORBIDDEN_VAL = /\b(PASS|HUMAN_PASS|G3_PASS|LOCKED)\b/;
function scan(v: unknown, path: string) {
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
    if (FORBIDDEN_KEY.test(k)) throw new Error(`LLM QC may not set "${path}${k}" (advisory only; G3 is human-only)`);
    scan(x, `${path}${k}.`);
  } else if (typeof v === 'string' && FORBIDDEN_VAL.test(v) && !path.startsWith('notes')) throw new Error(`LLM QC may not assert "${v}" at ${path}`);
}
const Advice = z.object({ shotId: z.string().min(1), notes: z.array(z.string()).default([]), suggestedAction: z.enum(['NONE', 'HUMAN_LOOK', 'RERUN_SUGGESTED']).default('HUMAN_LOOK') }).passthrough();
export function parseLlmQcAdvice(raw: unknown) {
  scan(raw, '');
  const a = Advice.parse(raw);
  return { ...a, role: 'ADVISORY_ONLY' as const, gates: { V11_G3: 'NOT_EVALUATED' as const, publish: 'FORBIDDEN' as const, autoPass: 'FORBIDDEN' as const } };
}
