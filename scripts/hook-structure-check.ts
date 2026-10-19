/**
 * V12 Hook Structure Gate CLI (offline).
 * npx tsx scripts/hook-structure-check.ts SHOT_SPEC.json [--hook-window 3] [--tail-tolerance 3] [--require-all-tagged] [--require-hook-kind]
 * Checks 钩子(≤3s)·增量/反转(中段)·悬念(结尾) via ShotSpec `beatRole`.
 * Optional hookKind (face|detail_cu|action|dialogue|situation): detail_cu = 局部特写可当钩子，不强制正脸.
 * Exit 0 PASS · 28 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateHookStructure } from '@/agents/assembly/hook-structure-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: hook-structure-check SHOT_SPEC.json [--hook-window 3] [--tail-tolerance 3] [--require-all-tagged] [--require-hook-kind]\n',
  );
  process.exit(2);
}
const r = evaluateHookStructure(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--hook-window') ? { hookWindowSec: Number(arg('--hook-window')) } : {}),
  ...(arg('--tail-tolerance') ? { tailToleranceSec: Number(arg('--tail-tolerance')) } : {}),
  requireAllTagged: a.includes('--require-all-tagged'),
  requireHookKind: a.includes('--require-hook-kind'),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 28);
