/** usage: continuity-check <input.json {episodeId, shots:[{shotId,takePath,continuousWithPrev?}], mode?}> [--out report.json] */
import { readFileSync, writeFileSync } from 'node:fs';
import { runContinuityCheck } from '@/agents/detectors/continuity-detector';
const a = process.argv.slice(2); const oi = a.indexOf('--out');
if (!a[0]) { console.error('usage: continuity-check <input.json> [--out report.json]'); process.exit(2); }
runContinuityCheck(JSON.parse(readFileSync(a[0], 'utf8'))).then(r => {
  if (oi >= 0) writeFileSync(a[oi + 1], JSON.stringify(r, null, 2));
  for (const p of r.pairs) console.log(`${p.from}→${p.to} mad=${p.mad} dhash=${p.dhash} ${p.verdict}`);
  console.log(`gate=${r.gate} (G3 NOT_EVALUATED)`); process.exit({ MACHINE_OK: 0, NOT_APPLICABLE: 0, FAIL: 40, ERROR: 41 }[r.gate]);
});
