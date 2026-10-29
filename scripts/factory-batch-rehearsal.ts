/**
 * Offline two-episode factory rehearsal: EP01 (box SHOT_SPEC v2 90s) + EP02 (SYNTHETIC fixture).
 * Fake H3 + fake TTS; no money. ≠Final ≠G3.
 *
 * Usage:
 *   npx tsx scripts/factory-batch-rehearsal.ts <rootDir> [ep01Dir]
 *     [--story-ledger-gate off|warn|enforce] [--story-ledger PATH.json]
 *     [--shot-spec-gate off|warn|enforce] [--shot-spec-suite PATH.json]
 * Defaults: gate=warn and auto-load tests/fixtures/v12/*-suite.v12.json when present.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runFactoryBatch } from '@/agents/factory/factory-batch';
import { repoHandlers } from '@/agents/factory/repo-handlers';

type GateMode = 'off' | 'warn' | 'enforce';

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function parseGate(flag: string, fallback: GateMode = 'warn'): GateMode {
  const v = arg(flag);
  if (v == null) return fallback;
  if (v === 'off' || v === 'warn' || v === 'enforce') return v;
  console.error(`invalid ${flag} value: ${v} (expected off|warn|enforce)`);
  process.exit(2);
}

const positionals = process.argv.slice(2).filter((a) => !a.startsWith('--'));
// When flags take values, those values are also non-dash; strip known flag values.
const flagValueIdx = new Set<number>();
for (const f of ['--story-ledger-gate', '--story-ledger', '--shot-spec-gate', '--shot-spec-suite']) {
  const i = process.argv.indexOf(f);
  if (i >= 0) flagValueIdx.add(i + 1);
}
const roots = process.argv
  .map((a, i) => ({ a, i }))
  .filter(({ a, i }) => i >= 2 && !a.startsWith('--') && !flagValueIdx.has(i))
  .map(({ a }) => a);

const root = roots[0];
const ep01Dir = roots[1] ?? '/workspace/v11/wave14/ep01';
if (!root) {
  console.error(
    'usage: factory-batch-rehearsal <rootDir> [ep01Dir] [--story-ledger-gate off|warn|enforce] [--story-ledger PATH] [--shot-spec-gate off|warn|enforce] [--shot-spec-suite PATH]',
  );
  process.exit(2);
}

const storyLedgerGate = parseGate('--story-ledger-gate', 'warn');
const shotSpecGate = parseGate('--shot-spec-gate', 'warn');
const storyLedgerPath = arg('--story-ledger');
const shotSpecSuitePath = arg('--shot-spec-suite');

const j = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const loadOpt = (p: string | undefined) => {
  if (!p) return undefined;
  if (!existsSync(p)) {
    console.error(`file not found: ${p}`);
    process.exit(2);
  }
  return j(p);
};

const defaultStory = resolve('tests/fixtures/v12/story-ledger-suite.v12.json');
const defaultShot = resolve('tests/fixtures/v12/shot-spec-suite.v12.json');

const REF = j(`${ep01Dir}/pack/REF_INDEX.json`);
const storyLedger =
  loadOpt(storyLedgerPath) ??
  (storyLedgerGate !== 'off' && existsSync(defaultStory) ? j(defaultStory) : undefined);
const shotSpecSuite =
  loadOpt(shotSpecSuitePath) ??
  (shotSpecGate !== 'off' && existsSync(defaultShot) ? j(defaultShot) : undefined);

runFactoryBatch(
  root,
  [
    {
      episodeId: 'ep01',
      providers: { h3: 'fake', dub: 'fake' },
      handlers: repoHandlers({
        shotSpec: j(`${ep01Dir}/shots/SHOT_SPEC.json`),
        beatPlan: j(`${ep01Dir}/beatplan/WAVE14_EP01_BEATPLAN.json`),
        refIndex: REF,
        allowCandidatesForRehearsal: true,
      }),
    },
    {
      episodeId: 'ep02',
      providers: { h3: 'fake', dub: 'fake' },
      handlers: repoHandlers({
        shotSpec: j('tests/fixtures/wave14-ep01/SHOT_SPEC.ep02-SYNTHETIC.json'),
        refIndex: REF,
        allowCandidatesForRehearsal: true,
      }),
    },
  ],
  {
    storyLedger,
    storyLedgerGate,
    shotSpecSuite,
    shotSpecGate,
  },
).then((r) => {
  console.log(
    JSON.stringify(
      {
        exitCode: r.exitCode,
        stage: (r as { stage?: string }).stage,
        episodes: r.episodes,
        ledger: r.ledger,
        canPublish: r.canPublish,
        notes: r.notes,
        storyLedger: r.storyLedger
          ? { verdict: r.storyLedger.verdict, metrics: r.storyLedger.metrics }
          : undefined,
        shotSpecSuite: r.shotSpecSuite
          ? { verdict: r.shotSpecSuite.verdict, metrics: r.shotSpecSuite.metrics }
          : undefined,
      },
      null,
      2,
    ),
  );
  process.exit(r.exitCode);
});
