/**
 * EP01 one-command offline rehearsal (fake provider only).
 * npx tsx scripts/ep01-offline-rehearsal.ts --shot-spec S.json [--beatplan B.json] --ref-index R.json --work-dir DIR
 *   [--duration-range 90-96] [--allow-candidates-for-dry-run] [--scene-ref img.png] [--verify-ref-sha] [--rhythm-gate warn|enforce] [--no-detectors]
 * Re-running with the same --work-dir resumes from checkpoint.
 */
import { readFileSync } from 'node:fs';
import { runEp01Rehearsal } from '@/agents/assembly/ep01-rehearsal';

const a = process.argv;
const arg = (k: string) => { const i = a.indexOf(k); return i > 0 ? a[i + 1] : undefined; };
const shotSpec = arg('--shot-spec'), refIndex = arg('--ref-index'), workDir = arg('--work-dir');
if (!shotSpec || !refIndex || !workDir) { process.stderr.write('usage: see header\n'); process.exit(2); }
let durationRange: { minSeconds: number; maxSeconds: number } | undefined;
const dr = arg('--duration-range');
if (dr) {
  const m = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(dr);
  if (!m || Number(m[1]) > Number(m[2])) { process.stderr.write('--duration-range must be MIN-MAX, e.g. 90-96\n'); process.exit(2); }
  durationRange = { minSeconds: Number(m[1]), maxSeconds: Number(m[2]) };
}
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const bp = arg('--beatplan');
runEp01Rehearsal({
  shotSpec: read(shotSpec), beatPlan: bp ? read(bp) : undefined, refIndex: read(refIndex), workDir, durationRange,
  allowCandidatesForDryRun: a.includes('--allow-candidates-for-dry-run'), sceneRefPath: arg('--scene-ref'), verifyRefShaOnDisk: a.includes('--verify-ref-sha'),
  rhythmGate: arg('--rhythm-gate') === 'enforce' ? 'enforce' : 'warn',
  detectors: process.argv.includes('--no-detectors') ? 'off' : 'report',
}).then((r) => {
  const { run, ...rest } = r;
  process.stdout.write(JSON.stringify({ ...rest, run: run && { ok: run.ok, exitCode: run.exitCode, failedShotId: run.failedShotId, totalSeconds: run.concat?.totalSeconds, output: run.output, error: run.error } }, null, 2) + '\n');
  process.exit(r.exitCode);
});
