/** Offline two-episode factory rehearsal: EP01 (box SHOT_SPEC v2 90s) + EP02 (SYNTHETIC fixture). Fake H3 + fake TTS; no money. */
import { readFileSync } from 'node:fs';
import { runFactoryBatch } from '@/agents/factory/factory-batch';
import { repoHandlers } from '@/agents/factory/repo-handlers';
const [root, ep01Dir = '/workspace/v11/wave14/ep01'] = process.argv.slice(2);
if (!root) { console.error('usage: factory-batch-rehearsal <rootDir> [ep01Dir]'); process.exit(2); }
const j = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const REF = j(`${ep01Dir}/pack/REF_INDEX.json`);
runFactoryBatch(root, [
  { episodeId: 'ep01', providers: { h3: 'fake', dub: 'fake' }, handlers: repoHandlers({ shotSpec: j(`${ep01Dir}/shots/SHOT_SPEC.json`), beatPlan: j(`${ep01Dir}/beatplan/WAVE14_EP01_BEATPLAN.json`), refIndex: REF, allowCandidatesForRehearsal: true }) },
  { episodeId: 'ep02', providers: { h3: 'fake', dub: 'fake' }, handlers: repoHandlers({ shotSpec: j('tests/fixtures/wave14-ep01/SHOT_SPEC.ep02-SYNTHETIC.json'), refIndex: REF, allowCandidatesForRehearsal: true }) },
]).then(r => { console.log(JSON.stringify({ exitCode: r.exitCode, episodes: r.episodes, ledger: r.ledger, canPublish: r.canPublish }, null, 2)); process.exit(r.exitCode); });
