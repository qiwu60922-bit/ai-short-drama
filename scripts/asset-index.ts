import { existsSync } from 'node:fs'; import { join } from 'node:path';
import { loadIndex, saveIndex, scanEpisodeDir, verifyIndex, emptyIndex } from '@/agents/ledger/asset-index';
const [dir, episode, ...rest] = process.argv.slice(2);
if (!dir || !episode) { console.error('usage: asset-index <episodeDir> <episodeId> [--verify]'); process.exit(2); }
const p = join(dir, 'ASSET_INDEX.json');
const ix = existsSync(p) ? loadIndex(p) : emptyIndex(episode);
if (rest.includes('--verify')) { const v = verifyIndex(ix); console.log(JSON.stringify(v, null, 2)); process.exit(v.ok ? 0 : 5); }
saveIndex(p, scanEpisodeDir(dir, episode, ix)); console.log(`${p}: ${ix.assets.filter(a => !a.supersededBy).length} live assets`);
