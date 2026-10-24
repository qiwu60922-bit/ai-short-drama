/**
 * V12 Panelix Storyboard Gate CLI (offline).
 * npx tsx scripts/panelix-storyboard-check.ts PACKAGE.json
 *   [--min-panels 3] [--max-panels 36] [--max-chars 2]
 * Beats · panels · character sheets · WS/MS/CU · action · continuity WARN.
 * Exit 0 PASS · 35 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Method from MIT zjzforfb-jpg/panelix (no React/FastAPI/Gemini vendored).
 */
import { readFileSync } from 'node:fs';
import { evaluatePanelixStoryboard } from '@/agents/assembly/panelix-storyboard-gate';

const a = process.argv;
const arg = (k: string) => {
  const i = a.indexOf(k);
  return i > 0 ? a[i + 1] : undefined;
};
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write(
    'usage: panelix-storyboard-check PACKAGE.json [--min-panels 3] [--max-panels 36] [--max-chars 2]\n',
  );
  process.exit(2);
}

const r = evaluatePanelixStoryboard(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--min-panels') ? { minPanels: Number(arg('--min-panels')) } : {}),
  ...(arg('--max-panels') ? { maxPanels: Number(arg('--max-panels')) } : {}),
  ...(arg('--max-chars') ? { maxCharsPerPanel: Number(arg('--max-chars')) } : {}),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 35);
