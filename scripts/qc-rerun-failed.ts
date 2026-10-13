/**
 * Plan (and optionally apply) "rerun only HUMAN_FAIL shots".
 * npx tsx scripts/qc-rerun-failed.ts --work-dir <rehearsal dir|run dir> [--apply]
 * Writes qc/review-summary.{md,json} + qc/rerun-failed.json. With --apply, marks those shots FAILED in
 * checkpoint.json (old QC record archived to qc/<shot>/history/); then rerun the same rehearsal/orchestrator
 * command with the same work dir to regenerate only them. Offline; G3 untouched.
 */
import { planRerunFailed } from '@/agents/assembly/qc-review-rerun';

const i = process.argv.indexOf('--work-dir');
const workDir = i > 0 ? process.argv[i + 1] : undefined;
if (!workDir) { process.stderr.write('usage: qc-rerun-failed --work-dir DIR [--apply]\n'); process.exit(2); }
planRerunFailed(workDir, { apply: process.argv.includes('--apply') })
  .then((p) => { process.stdout.write(JSON.stringify(p, null, 2) + '\n'); process.exit(0); })
  .catch((e) => { process.stderr.write(`${(e as Error).message}\n`); process.exit(60); });
