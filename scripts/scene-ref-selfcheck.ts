/**
 * Scene ref pre-lock self-check (read-only).
 * npx tsx scripts/scene-ref-selfcheck.ts --ref-index REF_INDEX.json [--out report.json]
 * Exit 0 all READY_FOR_HUMAN_LOCK · 26 any BLOCKED · 2 usage. Never edits REF_INDEX; person check NOT_CHECKED.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { selfCheckSceneEntries } from '@/agents/assembly/scene-ref-selfcheck';

const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const idx = arg('--ref-index'), out = arg('--out');
if (!idx) { process.stderr.write('usage: scene-ref-selfcheck --ref-index FILE [--out FILE]\n'); process.exit(2); }
const r = selfCheckSceneEntries(JSON.parse(readFileSync(idx, 'utf8')));
const text = JSON.stringify({ checkedAt: new Date().toISOString(), autoLock: 'FORBIDDEN', results: r }, null, 2) + '\n';
if (out) writeFileSync(out, text);
process.stdout.write(text);
process.exit(r.length && r.every((x) => x.verdict === 'READY_FOR_HUMAN_LOCK') ? 0 : 26);
