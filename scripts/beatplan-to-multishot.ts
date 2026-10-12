/**
 * ShotSpec (+BeatPlan) → multi-shot list. Usage:
 *   npx tsx scripts/beatplan-to-multishot.ts --shot-spec SHOT_SPEC.json [--beatplan BEATPLAN.json] --bindings bindings.json --work-dir DIR [--out list.json]
 * bindings.json: { "bindings": { "<characterId>": RefBinding }, "sceneRef"?: RefBinding, "baseSeed"?: number }
 * Exit 0 ok, 2 usage, 24 conversion problems (listed; nothing guessed).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { convertShotSpecToMultiShot } from '@/agents/assembly/beatplan-to-multishot';

const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const shotSpec = arg('--shot-spec'), beatplan = arg('--beatplan'), bindings = arg('--bindings'), workDir = arg('--work-dir'), out = arg('--out');
if (!shotSpec || !bindings || !workDir) { process.stderr.write('usage: see header\n'); process.exit(2); }
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const b = read(bindings);
const r = convertShotSpecToMultiShot(read(shotSpec), beatplan ? read(beatplan) : undefined, { workDir, bindings: b.bindings ?? {}, sceneRef: b.sceneRef, baseSeed: b.baseSeed });
const text = JSON.stringify(r.ok ? r.list : r, null, 2) + '\n';
if (r.ok && out) writeFileSync(out, text);
process.stdout.write(text);
process.exit(r.ok ? 0 : 24);
