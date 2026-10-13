/** V12 generation ledger: append-only JSONL, one entry per generation attempt. */
import { createHash, randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { assertCastWritable } from './character-registry';
const sha = z.string().regex(/^[0-9a-f]{64}$/);
export const LedgerInputSchema = z.object({
  shotId: z.string().min(1), provider: z.string().min(1), model: z.string().min(1),
  costUsd: z.number().nonnegative(), latencyMs: z.number().nonnegative(),
  seed: z.union([z.number().int(), z.string(), z.null()]),
  inputHash: sha, outputSha256: sha, outputPath: z.string().optional(),
  cast: z.array(z.string()).default([]), episode: z.string().optional(), note: z.string().optional(),
});
export type LedgerInput = z.input<typeof LedgerInputSchema>;
export const LEDGER_SCHEMA = 'v12/GenerationLedger/v1';
const stamps = { identity: 'PENDING_REVIEW', V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN' } as const;
export type LedgerEntry = z.output<typeof LedgerInputSchema> & { schema: string; entryId: string; recordedAt: string; stamps: typeof stamps };
const stable = (v: unknown): unknown => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v as object).sort().map(k => [k, stable((v as any)[k])])) : v;
export const hashInputs = (v: unknown) => createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
export function appendLedgerEntry(path: string, input: LedgerInput): LedgerEntry {
  const p = LedgerInputSchema.parse(input);
  const e: LedgerEntry = { schema: LEDGER_SCHEMA, entryId: randomUUID(), recordedAt: new Date().toISOString(), ...p, cast: assertCastWritable(p.cast), stamps };
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(e) + '\n');
  return e;
}
export function readLedger(path: string): LedgerEntry[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').map((l, i) => [l, i] as const).filter(([l]) => l.trim()).map(([l, i]) => {
    try { return JSON.parse(l) as LedgerEntry; } catch { throw new Error(`ledger corrupted at line ${i + 1}`); }
  });
}
export function summarizeLedger(es: LedgerEntry[]) {
  const byProvider: Record<string, { count: number; costUsd: number; latencyMs: number }> = {};
  for (const e of es) { const b = (byProvider[e.provider] ??= { count: 0, costUsd: 0, latencyMs: 0 }); b.count++; b.costUsd += e.costUsd; b.latencyMs += e.latencyMs; }
  return { count: es.length, totalCostUsd: es.reduce((a, e) => a + e.costUsd, 0), byProvider };
}
