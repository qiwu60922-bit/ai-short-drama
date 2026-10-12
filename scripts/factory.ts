/** usage: factory --factory-run --episode ep01 --work-dir DIR [--h3 fake|<real>] [--dub fake|<real>] [--est-h3 USD] [--est-dub USD]
 *  Paid (non-fake) steps stop with exit 50 unless DIR/HUMAN_GO.json (v14/HumanGo/v1) covers them. Offline fakes by default. */
import { runFactory, fakeHandlers, FACTORY_EXIT } from '@/agents/factory/factory-run';
const a = process.argv.slice(2); const g = (k: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
if (!a.includes('--factory-run') || !g('--episode') || !g('--work-dir')) { console.error('usage: factory --factory-run --episode EP --work-dir DIR [--h3 fake] [--dub fake]'); process.exit(FACTORY_EXIT.USAGE); }
const est = { h3: g('--est-h3') ? Number(g('--est-h3')) : undefined, dub: g('--est-dub') ? Number(g('--est-dub')) : undefined };
runFactory({ episodeId: g('--episode')!, workDir: g('--work-dir')!, providers: { h3: g('--h3') ?? 'fake', dub: g('--dub') ?? 'fake' }, estimatedCostUsd: est }, fakeHandlers())
  .then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(r.exitCode); });
