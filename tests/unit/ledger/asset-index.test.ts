import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { emptyIndex, registerAsset, assetsForShot, verifyIndex, saveIndex, loadIndex, scanEpisodeDir } from '@/agents/ledger/asset-index';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const tmp = () => mkdtempSync(join(tmpdir(), 'aix-'));
describe('asset UUID index', () => {
  it('registers mp4/png/wav with uuid, sha, kind; idempotent per path+sha', () => {
    const d = tmp(); const f = join(d, 'S01.mp4'); writeFileSync(f, 'v1');
    const ix = emptyIndex('ep01');
    const a = registerAsset(ix, { shotId: 'S01', path: f });
    expect(a.assetId).toMatch(UUID); expect(a.kind).toBe('video'); expect(a.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(registerAsset(ix, { shotId: 'S01', path: f }).assetId).toBe(a.assetId);
    writeFileSync(f, 'v2');
    const b = registerAsset(ix, { shotId: 'S01', path: f });
    expect(b.assetId).not.toBe(a.assetId); expect(ix.assets.find(x => x.assetId === a.assetId)!.supersededBy).toBe(b.assetId);
    expect(assetsForShot(ix, 'S01').map(x => x.assetId)).toEqual([b.assetId]);
  });
  it('rejects unknown extensions', () => {
    const d = tmp(); const f = join(d, 'x.txt'); writeFileSync(f, 'x');
    expect(() => registerAsset(emptyIndex('e'), { shotId: 'S', path: f })).toThrow(/kind/);
  });
  it('verify flags missing and sha drift; round-trips', () => {
    const d = tmp(); const f = join(d, 'a.wav'); const g = join(d, 'b.png'); writeFileSync(f, 'a'); writeFileSync(g, 'b');
    const ix = emptyIndex('e'); registerAsset(ix, { shotId: 'S1', path: f }); registerAsset(ix, { shotId: 'S1', path: g });
    const p = join(d, 'ASSET_INDEX.json'); saveIndex(p, ix); const back = loadIndex(p);
    expect(back.assets).toHaveLength(2);
    writeFileSync(f, 'changed'); require('node:fs').rmSync(g);
    const v = verifyIndex(back);
    expect(v.ok).toBe(false); expect(v.problems.map(x => x.problem).sort()).toEqual(['MISSING', 'SHA_DRIFT']);
  });
  it('scans takes/ + qc/<shot>/ + audio/ into shot→assets', () => {
    const d = tmp(); mkdirSync(join(d, 'takes')); mkdirSync(join(d, 'qc', 'S02'), { recursive: true }); mkdirSync(join(d, 'audio'));
    writeFileSync(join(d, 'takes', 'ep01-S02.mp4'), 'm'); writeFileSync(join(d, 'qc', 'S02', 'first.png'), 'p'); writeFileSync(join(d, 'audio', 'S02.wav'), 'w');
    const ix = scanEpisodeDir(d, 'ep01');
    expect(assetsForShot(ix, 'S02').map(a => a.kind).sort()).toEqual(['audio', 'image', 'video']);
    expect(ix.stamps.publish).toBe('FORBIDDEN');
  });
});
