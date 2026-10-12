/**
 * aidrama-oneclick-shot · offline single-shot CLI (Wave12 spec).
 * Usage: npx tsx scripts/oneclick-shot.ts <request.json|-> [--out-dir DIR]
 * No live port is wired here: mode=live exits 3 even with ONECLICK_LIVE=1 (paid runs paused).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runOneClickShot, ONECLICK_EXIT } from '@/agents/generation/oneclick-shot';

async function main(argv: string[]): Promise<number> {
  const args = argv.slice(2);
  const oi = args.indexOf('--out-dir');
  let outDir: string | undefined;
  if (oi >= 0) { outDir = args[oi + 1]; args.splice(oi, 2); }
  const src = args[0];
  if (!src) { process.stderr.write('usage: oneclick-shot <request.json|-> [--out-dir DIR]\n'); return ONECLICK_EXIT.USAGE; }
  let raw: unknown;
  try { raw = JSON.parse(src === '-' ? readFileSync(0, 'utf8') : readFileSync(src, 'utf8')); }
  catch (e) { process.stderr.write(`bad input: ${(e as Error).message}\n`); return ONECLICK_EXIT.USAGE; }
  const result = await runOneClickShot(raw, { env: process.env });
  const dir = outDir ?? (raw as { outDir?: string })?.outDir;
  if (dir) {
    mkdirSync(dir, { recursive: true });
    if (result.plan) writeFileSync(join(dir, 'plan.json'), JSON.stringify(result.plan, null, 2));
    writeFileSync(join(dir, 'result.json'), JSON.stringify(result, null, 2));
  }
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  return result.exitCode;
}

main(process.argv).then((c) => process.exit(c));
