/**
 * V12 Shot-Spec Suite CLI (offline) — hook / cascade / cut-timeline 旁路.
 * npx tsx scripts/shot-spec-suite-check.ts BUNDLE.json
 * Exit 0 PASS · 36 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 */
import { readFileSync } from 'node:fs';
import { evaluateShotSpecSuite } from '@/agents/assembly/shot-spec-suite';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: shot-spec-suite-check BUNDLE.json\n');
  process.exit(2);
}
const r = evaluateShotSpecSuite(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
