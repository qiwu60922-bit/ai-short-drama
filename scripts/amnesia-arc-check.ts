/**
 * V12 Amnesia-Arc Gate CLI (offline).
 * npx tsx scripts/amnesia-arc-check.ts LEDGER.json
 * 失忆/记忆断裂弧账本. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3. Reverse-engineered from 2026-10-27 hits
 * 《反派拿捏！第三季》《后妈只想苟，老公非要凑第二季》《退役归来，这个保镖不好惹》.
 */
import { readFileSync } from 'node:fs';
import { evaluateAmnesiaArc } from '@/agents/assembly/amnesia-arc-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: amnesia-arc-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateAmnesiaArc(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
