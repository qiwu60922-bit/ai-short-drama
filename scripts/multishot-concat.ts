/**
 * Wave12 multi-shot ffmpeg concat Worker CLI (local ffmpeg only, no network).
 * Usage: npx tsx scripts/multishot-concat.ts <request.json|->
 */
import { readFileSync } from 'node:fs';
import { runMultiShotConcat, CONCAT_EXIT } from '@/agents/assembly/ffmpeg-concat-worker';

async function main(): Promise<number> {
  const src = process.argv[2];
  if (!src) { process.stderr.write('usage: multishot-concat <request.json|->\n'); return CONCAT_EXIT.USAGE; }
  let raw: unknown;
  try { raw = JSON.parse(readFileSync(src === '-' ? 0 : src, 'utf8')); }
  catch (e) { process.stderr.write(`bad input: ${(e as Error).message}\n`); return CONCAT_EXIT.USAGE; }
  const r = await runMultiShotConcat(raw);
  process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  return r.exitCode;
}
main().then((c) => process.exit(c));
