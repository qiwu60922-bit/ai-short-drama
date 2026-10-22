/**
 * V12 Shot Contract Gate CLI (offline).
 * npx tsx scripts/shot-contract-check.ts BOARD.json [--rules RULES.json]
 *   [--min-duration 3] [--max-duration 15] [--max-rules 2]
 * Dramatic motive · 1–2 ruleRefs · spatial axis · negatives · beat timing.
 * Exit 0 PASS · 35 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Method from MIT tongxigogo-crypto/shot-contract (no media vendored).
 */
import { readFileSync } from 'node:fs';
import { evaluateShotContract } from '@/agents/assembly/shot-contract-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: shot-contract-check BOARD.json [--rules RULES.json] [--min-duration 3] [--max-duration 15] [--max-rules 2]\n',
  );
  process.exit(2);
}

let ruleset: unknown;
const rulesFile = arg('--rules');
if (rulesFile) {
  ruleset = JSON.parse(readFileSync(rulesFile, 'utf8'));
}

const r = evaluateShotContract(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--min-duration') ? { minDurationSec: Number(arg('--min-duration')) } : {}),
  ...(arg('--max-duration') ? { maxDurationSec: Number(arg('--max-duration')) } : {}),
  ...(arg('--max-rules') ? { maxRulesPerShot: Number(arg('--max-rules')) } : {}),
  ...(ruleset !== undefined ? { ruleset: ruleset as { rules?: Array<{ id?: string }> } } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 35);
