/**
 * V12 Auto Edit Worker CLI. npx tsx scripts/auto-edit.ts PLAN.json --out OUT.mp4 --work-dir DIR [--render]
 * Dry-run default (prints table). Exit 0 ok · 2 invalid · 4 protected output · 70 ffmpeg failed. ≠G3.
 */
import { readFileSync } from 'node:fs';
import { runAutoEdit } from '@/agents/assembly/auto-edit-worker';

const a = process.argv; const arg = (k: string) => { const i = a.indexOf(k); return i > 0 ? a[i + 1] : undefined; };
const planPath = a[2], out = arg('--out'), workDir = arg('--work-dir');
if (!planPath || planPath.startsWith('--') || !out || !workDir) { process.stderr.write('usage: auto-edit PLAN.json --out OUT.mp4 --work-dir DIR [--render]\n'); process.exit(2); }
runAutoEdit(JSON.parse(readFileSync(planPath, 'utf8')), { outPath: out, workDir, render: a.includes('--render') })
  .then((r) => { process.stdout.write(JSON.stringify(r, null, 2) + '\n'); process.exit(r.exitCode); });
