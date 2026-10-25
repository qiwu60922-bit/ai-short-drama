/**
 * V12 Manju Editorial Gate CLI (offline).
 * npx tsx scripts/manju-editorial-check.ts PLAN.json
 * Pronunciation lexicon · referential integrity · state continuity · shot-line timing.
 * Exit 0 PASS · 35 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Method from MIT w1nterdec/ai-manju-engineering (no Python/TTS vendored).
 */
import { readFileSync } from 'node:fs';
import { evaluateManjuEditorial } from '@/agents/assembly/manju-editorial-gate';

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: manju-editorial-check PLAN.json\n');
  process.exit(2);
}

const r = evaluateManjuEditorial(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 35);
