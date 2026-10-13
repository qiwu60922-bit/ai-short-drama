/** V12 asset UUID index: shot → mp4/png/wav with stable UUID + sha256; supersede on content change. */
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
export type AssetKind = 'video' | 'image' | 'audio';
const KIND: Record<string, AssetKind> = { '.mp4': 'video', '.mov': 'video', '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.wav': 'audio' };
export interface AssetRecord { assetId: string; shotId: string; kind: AssetKind; path: string; sha256: string; bytes: number; registeredAt: string; supersededBy?: string }
export interface AssetIndex { schema: 'v12/AssetIndex/v1'; episode: string; assets: AssetRecord[]; stamps: { identity: 'PENDING_REVIEW'; V11_G3: 'NOT_EVALUATED'; publish: 'FORBIDDEN' } }
export const emptyIndex = (episode: string): AssetIndex => ({ schema: 'v12/AssetIndex/v1', episode, assets: [], stamps: { identity: 'PENDING_REVIEW', V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN' } });
const shaFile = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex');
export function registerAsset(ix: AssetIndex, a: { shotId: string; path: string }): AssetRecord {
  const path = resolve(a.path); const kind = KIND[extname(path).toLowerCase()];
  if (!kind) throw new Error(`unsupported asset kind for ${path}`);
  const sha256 = shaFile(path);
  const live = ix.assets.find(x => x.path === path && x.shotId === a.shotId && !x.supersededBy);
  if (live && live.sha256 === sha256) return live;
  const rec: AssetRecord = { assetId: randomUUID(), shotId: a.shotId, kind, path, sha256, bytes: statSync(path).size, registeredAt: new Date().toISOString() };
  if (live) live.supersededBy = rec.assetId;
  ix.assets.push(rec); return rec;
}
export const assetsForShot = (ix: AssetIndex, shotId: string) => ix.assets.filter(a => a.shotId === shotId && !a.supersededBy);
export function verifyIndex(ix: AssetIndex) {
  const problems: { assetId: string; path: string; problem: 'MISSING' | 'SHA_DRIFT' }[] = [];
  for (const a of ix.assets.filter(x => !x.supersededBy)) {
    if (!existsSync(a.path)) problems.push({ assetId: a.assetId, path: a.path, problem: 'MISSING' });
    else if (shaFile(a.path) !== a.sha256) problems.push({ assetId: a.assetId, path: a.path, problem: 'SHA_DRIFT' });
  }
  return { ok: problems.length === 0, problems };
}
export const saveIndex = (p: string, ix: AssetIndex) => writeFileSync(p, JSON.stringify(ix, null, 2));
export const loadIndex = (p: string): AssetIndex => JSON.parse(readFileSync(p, 'utf8'));
/** takes/<ep>-<shot>.mp4 · qc/<shot>/*.png · audio/<shot>*.wav */
export function scanEpisodeDir(dir: string, episode: string, ix: AssetIndex = emptyIndex(episode)): AssetIndex {
  const ls = (d: string) => (existsSync(d) ? readdirSync(d) : []);
  for (const f of ls(join(dir, 'takes'))) if (KIND[extname(f).toLowerCase()]) registerAsset(ix, { shotId: basename(f, extname(f)).replace(new RegExp(`^${episode}-`), ''), path: join(dir, 'takes', f) });
  for (const s of ls(join(dir, 'qc'))) if (statSync(join(dir, 'qc', s)).isDirectory()) for (const f of ls(join(dir, 'qc', s))) if (KIND[extname(f).toLowerCase()]) registerAsset(ix, { shotId: s, path: join(dir, 'qc', s, f) });
  for (const f of ls(join(dir, 'audio'))) if (extname(f).toLowerCase() === '.wav') registerAsset(ix, { shotId: basename(f, '.wav').split(/[._]/)[0], path: join(dir, 'audio', f) });
  return ix;
}
