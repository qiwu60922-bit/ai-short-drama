/**
 * V12 Shot Prompt Gate CLI (offline). npx tsx scripts/shot-prompt-check.ts SHOT_SPEC.json [--strict-five-lines] [--hard-chars 2000] [--max-cps 6]
 * Per-shot 字数闸门 · 流程违禁词 · 台词语速 · 导演五线. Exit 0 PASS · 29 FAIL · 2 usage. PASS ≠ Final ≠ G3.
 * Ideas adapted from MIT skills 2395300049-sys/anti-prompt and workerpro666-ctrl/aigc-director-five-lines.
 */
import { readFileSync } from 'node:fs';
import { evaluateShotPrompts } from '@/agents/assembly/shot-prompt-gate';

const a = process.argv; const arg = (k: string) => { const i = a.indexOf(k); return i > 0 ? a[i + 1] : undefined; };
const file = a[2];
if (!file || file.startsWith('--')) { process.stderr.write('usage: shot-prompt-check SHOT_SPEC.json [opts]\n'); process.exit(2); }
const r = evaluateShotPrompts(JSON.parse(readFileSync(file, 'utf8')), {
  ...(arg('--hard-chars') ? { hardChars: Number(arg('--hard-chars')) } : {}),
  ...(arg('--max-cps') ? { maxUnitsPerSec: Number(arg('--max-cps')) } : {}),
  strictFiveLines: a.includes('--strict-five-lines'),
});
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 29);
