/**
 * V12 Cliffhanger Handoff Gate CLI (offline).
 * npx tsx scripts/cliffhanger-handoff-check.ts PREV.json NEXT.json [--hook-window 3] [--tail-tolerance 3]
 * Checks 季末悬念 → 下季开篇承接 via ShotSpec `beatRole`. Exit 0 PASS · 28 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateCliffhangerHandoff } from '@/agents/assembly/cliffhanger-handoff-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const prevFile = a[2];
const nextFile = a[3];
if (!prevFile || !nextFile || prevFile.startsWith('--') || nextFile.startsWith('--')) {
  process.stderr.write(
    'usage: cliffhanger-handoff-check PREV_SHOT_SPEC.json NEXT_SHOT_SPEC.json [--hook-window 3] [--tail-tolerance 3]\n',
  );
  process.exit(2);
}
const r = evaluateCliffhangerHandoff(
  JSON.parse(readFileSync(prevFile, 'utf8')),
  JSON.parse(readFileSync(nextFile, 'utf8')),
  {
    ...(arg('--hook-window') ? { hookWindowSec: Number(arg('--hook-window')) } : {}),
    ...(arg('--tail-tolerance') ? { tailToleranceSec: Number(arg('--tail-tolerance')) } : {}),
  },
);
const fails = r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warns = r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);
process.stdout.write(
  `${r.verdict} prevCliff=${r.metrics.prevCliffEndsAtSec} nextHook=${r.metrics.nextHookAtSec} shared=${r.metrics.sharedTokenCount}` +
    (fails.length ? ` FAIL:${fails.join(',')}` : '') +
    (warns.length ? ` WARN:${warns.join(',')}` : '') +
    '\n',
);
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 28);
