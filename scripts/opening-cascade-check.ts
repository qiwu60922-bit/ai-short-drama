/**
 * V12 Opening Cascade Gate CLI (offline).
 * npx tsx scripts/opening-cascade-check.ts SHOT_SPEC.json [--cascade-window 8] [--min-beats 2]
 * Checks 开场叠钩: ≥minCascadeBeats of hook|reversal|increment starting within cascadeWindowSec.
 * Exit 0 PASS · 28 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateOpeningCascade } from '@/agents/assembly/opening-cascade-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: opening-cascade-check SHOT_SPEC.json [--cascade-window 8] [--min-beats 2]\n',
  );
  process.exit(2);
}
const r = evaluateOpeningCascade(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--cascade-window') ? { cascadeWindowSec: Number(arg('--cascade-window')) } : {}),
  ...(arg('--min-beats') ? { minCascadeBeats: Number(arg('--min-beats')) } : {}),
});
const fails = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warns = r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);
process.stdout.write(
  `${r.verdict} cascade=${r.metrics.cascadeBeatCount}/${r.metrics.minCascadeBeats} ` +
    `window=${r.metrics.cascadeWindowSec}s roles=${r.metrics.cascadeRoles.join('+') || '-'}` +
    (fails.length ? ` FAIL:${fails.join(',')}` : '') +
    (warns.length ? ` WARN:${warns.join(',')}` : '') +
    '\n',
);
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 28);
