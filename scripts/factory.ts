/** usage: factory --factory-run --episode ep01 --work-dir DIR [--h3 fake|<real>] [--dub fake|<real>] [--est-h3 USD] [--est-dub USD]
 *    [--shot-spec S.json --ref-index R.json [--beatplan B.json] [--allow-candidates-for-rehearsal] [--canvas 160x96]]
 *  With --shot-spec: real repo modules (multishot+fake H3, fake TTS, SRT, reencode stitch, V13 detectors, receipts, ledger, asset index).
 *  Paid (non-fake) steps stop with exit 50 unless DIR/HUMAN_GO.json (v14/HumanGo/v1) covers them. */
import { readFileSync } from 'node:fs';
import { runFactory, fakeHandlers, FACTORY_EXIT } from '@/agents/factory/factory-run';
import { repoHandlers } from '@/agents/factory/repo-handlers';
const a = process.argv.slice(2); const g = (k: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
if (!a.includes('--factory-run') || !g('--episode') || !g('--work-dir')) { console.error('usage: see header'); process.exit(FACTORY_EXIT.USAGE); }
const est = { h3: g('--est-h3') ? Number(g('--est-h3')) : undefined, dub: g('--est-dub') ? Number(g('--est-dub')) : undefined };
const j = (p?: string) => (p ? JSON.parse(readFileSync(p, 'utf8')) : undefined);
const cv = g('--canvas')?.match(/^(\d+)x(\d+)$/);
const handlers = g('--shot-spec') ? repoHandlers({ shotSpec: j(g('--shot-spec')), beatPlan: j(g('--beatplan')), refIndex: j(g('--ref-index')) ?? {},
  allowCandidatesForRehearsal: a.includes('--allow-candidates-for-rehearsal'), canvas: cv ? { width: +cv[1], height: +cv[2], fps: 24 } : undefined }) : fakeHandlers();
runFactory({ episodeId: g('--episode')!, workDir: g('--work-dir')!, providers: { h3: g('--h3') ?? 'fake', dub: g('--dub') ?? 'fake' }, estimatedCostUsd: est }, handlers)
  .then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(r.exitCode); });
