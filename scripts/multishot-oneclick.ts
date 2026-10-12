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
  if (!src) { process.stderr.write('usage: multishot-oneclick <list.json|-> [--fake-provider]\n'); return MULTISHOT_EXIT.USAGE; }
  let raw: { workDir?: string };
  try { raw = JSON.parse(readFileSync(src === '-' ? 0 : src, 'utf8')); }
  catch (e) { process.stderr.write(`bad input: ${(e as Error).message}\n`); return MULTISHOT_EXIT.USAGE; }
  const live = fake && raw.workDir ? createFakeH3Provider({ outDir: join(raw.workDir, 'takes') }) : undefined;
  const r = await runMultiShotOneClick(raw, { env: process.env, live });
  process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  return r.exitCode;
}
main().then((c) => process.exit(c));
