/**
 * V12 Dialogue Exposition Gate CLI (offline).
 * npx tsx scripts/dialogue-exposition-check.ts SHOT_SPEC.json [--min-action 8]
 * Exit 0 PASS · 28 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateDialogueExposition } from '@/agents/assembly/dialogue-exposition-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: dialogue-exposition-check SHOT_SPEC.json [--min-action 8]\n');
  process.exit(2);
}
const r = evaluateDialogueExposition(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--min-action') ? { minActionChars: Number(arg('--min-action')) } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 28);
