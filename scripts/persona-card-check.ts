/**
 * V12 Persona-Card Gate CLI (offline).
 * npx tsx scripts/persona-card-check.ts CARD.json
 * Character-card integrity · anchors · fiction-no-unknown · wardrobe.
 * Exit 0 PASS · 35 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Method from MIT huihui308/ai-persona-studio (no prompts/APIs vendored).
 */
import { readFileSync } from 'node:fs';
import { evaluatePersonaCard } from '@/agents/assembly/persona-card-gate';

const file = process.argv[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: persona-card-check CARD.json\n');
  process.exit(2);
}

const r = evaluatePersonaCard(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 35);
