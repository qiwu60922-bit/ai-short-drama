import { readFileSync, writeFileSync } from 'node:fs';
import { proposeCuts } from '@/agents/assembly/duration-budgeter';
const a = process.argv.slice(2); const g = (k: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const r = proposeCuts(JSON.parse(readFileSync(a[0], 'utf8')), { maxSec: Number(g('--max') ?? 90), protectedShots: (g('--protect') ?? '').split(',').filter(Boolean), allowDialogue: a.includes('--allow-dialogue') });
const out = g('--out'); if (out) writeFileSync(out, JSON.stringify(r, null, 2));
console.log(`${r.status} total=${r.totalSec}s → ${r.newTotalSec}s (max ${r.maxSec})`);
for (const c of r.cuts) console.log(`  ${c.shotId} ${c.fromSec}→${c.toSec}s risk=${c.risk} ${c.riskNote}`);
console.log('建议仅供人工确认，未写回 SHOT_SPEC。'); process.exit(r.status === 'INFEASIBLE' ? 3 : 0);
