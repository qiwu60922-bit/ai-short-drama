/**
 * EP01 one-command offline rehearsal (fake provider only).
 * npx tsx scripts/ep01-offline-rehearsal.ts --shot-spec S.json [--beatplan B.json] --ref-index R.json --work-dir DIR
 *   [--duration-range 90-96] [--allow-candidates-for-dry-run] [--scene-ref img.png] [--verify-ref-sha]
 *   [--rhythm-gate warn|enforce] [--no-detectors]
 *   [--story-ledger-gate off|warn|enforce] [--story-ledger PATH.json]
 *   [--shot-spec-gate off|warn|enforce] [--shot-spec-suite PATH.json]
 * Re-running with the same --work-dir resumes from checkpoint.
 * When --story-ledger / --shot-spec-suite omitted but gate is warn|enforce, loads
 * tests/fixtures/v12/story-ledger-suite.v12.json / shot-spec-suite.v12.json if present.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runEp01Rehearsal } from '@/agents/assembly/ep01-rehearsal';

type GateMode = 'off' | 'warn' | 'enforce';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};

function parseGate(flag: string, fallback: GateMode = 'off'): GateMode {
  const v = arg(flag);
  if (v == null) return fallback;
  if (v === 'off' || v === 'warn' || v === 'enforce') return v;
  process.stderr.write(`invalid ${flag} value: ${v} (expected off|warn|enforce)\n`);
  process.exit(2);
}

const shotSpec = arg('--shot-spec');
const refIndex = arg('--ref-index');
const workDir = arg('--work-dir');
if (!shotSpec || !refIndex || !workDir) {
  process.stderr.write('usage: see header\n');
  process.exit(2);
}

let durationRange: { minSeconds: number; maxSeconds: number } | undefined;
const dr = arg('--duration-range');
if (dr) {
  const m = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(dr);
  if (!m || Number(m[1]) > Number(m[2])) {
    process.stderr.write('--duration-range must be MIN-MAX, e.g. 90-96\n');
    process.exit(2);
  }
  durationRange = { minSeconds: Number(m[1]), maxSeconds: Number(m[2]) };
}

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const loadOpt = (p: string | undefined) => {
  if (!p) return undefined;
  if (!existsSync(p)) {
    process.stderr.write(`file not found: ${p}\n`);
    process.exit(2);
  }
  return read(p);
};

const defaultStoryV13 = resolve('tests/fixtures/v13/story-ledger-suite.v13.json');
const defaultShotV13 = resolve('tests/fixtures/v13/shot-spec-suite.v13.json');
const defaultStoryV12 = resolve('tests/fixtures/v12/story-ledger-suite.v12.json');
const defaultShotV12 = resolve('tests/fixtures/v12/shot-spec-suite.v12.json');
const defaultStory = existsSync(defaultStoryV13) ? defaultStoryV13 : defaultStoryV12;
const defaultShot = existsSync(defaultShotV13) ? defaultShotV13 : defaultShotV12;

const storyLedgerGate = parseGate('--story-ledger-gate', 'warn');
const shotSpecGate = parseGate('--shot-spec-gate', 'warn');
const storyLedgerPath = arg('--story-ledger');
const shotSpecSuitePath = arg('--shot-spec-suite');

const storyLedger =
  loadOpt(storyLedgerPath) ??
  (storyLedgerGate !== 'off' && existsSync(defaultStory) ? read(defaultStory) : undefined);
const shotSpecSuite =
  loadOpt(shotSpecSuitePath) ??
  (shotSpecGate !== 'off' && existsSync(defaultShot) ? read(defaultShot) : undefined);

const bp = arg('--beatplan');
runEp01Rehearsal({
  shotSpec: read(shotSpec),
  beatPlan: bp ? read(bp) : undefined,
  refIndex: read(refIndex),
  workDir,
  durationRange,
  allowCandidatesForDryRun: a.includes('--allow-candidates-for-dry-run'),
  sceneRefPath: arg('--scene-ref'),
  verifyRefShaOnDisk: a.includes('--verify-ref-sha'),
  rhythmGate: arg('--rhythm-gate') === 'enforce' ? 'enforce' : 'warn',
  detectors: process.argv.includes('--no-detectors') ? 'off' : 'report',
  storyLedger,
  storyLedgerGate,
  shotSpecSuite,
  shotSpecGate,
}).then((r) => {
  const { run, ...rest } = r;
  process.stdout.write(
    JSON.stringify(
      {
        ...rest,
        run: run && {
          ok: run.ok,
          exitCode: run.exitCode,
          failedShotId: run.failedShotId,
          totalSeconds: run.concat?.totalSeconds,
          output: run.output,
          error: run.error,
        },
      },
      null,
      2,
    ) + '\n',
  );
  process.exit(r.exitCode);
});
