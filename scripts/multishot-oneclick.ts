/**
 * Wave12 multi-shot one-click CLI. Usage:
 *   npx tsx scripts/multishot-oneclick.ts <list.json|-> [--fake-provider]
 * dry-run: plans every shot (zero submit). live: needs ONECLICK_LIVE=1 AND --fake-provider (no real provider wired; paid runs paused).
 * Re-run the same command to resume from <workDir>/checkpoint.json.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runMultiShotOneClick, MULTISHOT_EXIT } from '@/agents/assembly/multishot-oneclick';
import { createFakeH3Provider } from '@/agents/assembly/fake-h3-provider';

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const fake = args.includes('--fake-provider');
  const src = args.find((a) => !a.startsWith('--'));
  if (!src) { process.stderr.write('usage: multishot-oneclick <list.json|-> [--fake-provider] [--ledger LEDGER.jsonl]\n'); return MULTISHOT_EXIT.USAGE; }
  let raw: { workDir?: string };
  try { raw = JSON.parse(readFileSync(src === '-' ? 0 : src, 'utf8')); }
  catch (e) { process.stderr.write(`bad input: ${(e as Error).message}\n`); return MULTISHOT_EXIT.USAGE; }
  const live = fake && raw.workDir ? createFakeH3Provider({ outDir: join(raw.workDir, 'takes') }) : undefined;
  const li = args.indexOf('--ledger');
  const ledger = li >= 0 ? { path: args[li + 1], provider: fake ? 'fake-h3' : 'local.comfy.minimax_h3', model: fake ? 'fake-h3-v1' : 'minimax_h3', costPerShotUsd: 0 } : undefined;
  const r = await runMultiShotOneClick(raw, { env: process.env, live, ledger });
  process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  return r.exitCode;
}
main().then((c) => process.exit(c));
