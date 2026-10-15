import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { proposeCuts, voMinSec } from '@/agents/assembly/duration-budgeter';
const v1 = JSON.parse(readFileSync('tests/fixtures/wave14-ep01/SHOT_SPEC.v1-96s.json', 'utf8'));
const v2 = JSON.parse(readFileSync('tests/fixtures/wave14-ep01/SHOT_SPEC.json', 'utf8'));
const mk = (shots: any[]) => ({ schema: 'x', episode: 'T', shots });
describe('duration budgeter', () => {
  it('96s EP01 → reproduces 方案 A (S01 6→4, S03 6→4, S05 8→6)', () => {
    const r = proposeCuts(v1, { maxSec: 90, protectedShots: ['S08', 'S10'] });
    expect(r.status).toBe('PROPOSED');
    expect(r.cuts.map(c => [c.shotId, c.fromSec, c.toSec])).toEqual([['S01', 6, 4], ['S03', 6, 4], ['S05', 8, 6]]);
    expect(r.newTotalSec).toBe(90);
    expect(r.cuts.every(c => c.riskNote.length > 0)).toBe(true);
  });
  it('already within budget → NO_CUT_NEEDED', () => {
    expect(proposeCuts(v2, { maxSec: 90 }).status).toBe('NO_CUT_NEEDED');
  });
  it('never touches protected shots or dialogue unless allowed', () => {
    const r = proposeCuts(v1, { maxSec: 80, protectedShots: ['S08', 'S10'] });
    expect(r.cuts.some(c => ['S08', 'S10'].includes(c.shotId))).toBe(false);
    for (const c of r.cuts) expect(c.toSec).toBeGreaterThanOrEqual(3);
  });
  it('infeasible → INFEASIBLE with shortfall, never auto-applied', () => {
    const r = proposeCuts(mk([{ shotId: 'A', durSec: 10, dialogue: 'x' }]), { maxSec: 2, protectedShots: ['A'] });
    expect(r.status).toBe('INFEASIBLE');
    expect(r.shortfallSec).toBe(8);
    expect(r.applied).toBe(false);
  });
  it('vo floor respected', () => {
    expect(voMinSec('一二三四五六七八九十一二')).toBe(3);
    const r = proposeCuts(mk([{ shotId: 'A', durSec: 8, vo: '一'.repeat(24) }, { shotId: 'B', durSec: 8 }]), { maxSec: 12 });
    const a = r.cuts.find(c => c.shotId === 'A');
    if (a) expect(a.toSec).toBeGreaterThanOrEqual(6);
  });
  it('carries review stamps', () => {
    const r = proposeCuts(v1, { maxSec: 90 });
    expect(r.stamps).toEqual({ identity: 'PENDING_REVIEW', V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN' });
  });
});

// 2026-10-15 爆款反推：《魔神人生：弃子问天》515 集共 6h38m（均 ≈46s/集）、《天幕直播》S1 148 集 2h55m（≈71s/集）。
// 集越短越要裁，裁的必须是铺垫，不能是钩子/悬念；反转镜最后才动。
describe('duration budgeter · beatRole-aware (V12 hit-reverse 2026-10-15)', () => {
  const beatEp = () => mk([
    { shotId: 'H', durSec: 3, beatRole: 'hook' },          // 开场羞辱/掌掴
    { shotId: 'S1', durSec: 8, beatRole: 'setup' },
    { shotId: 'I', durSec: 8, beatRole: 'increment' },
    { shotId: 'R', durSec: 8, beatRole: 'reversal' },       // 断亲→系统激活
    { shotId: 'S2', durSec: 8, beatRole: 'setup' },
    { shotId: 'C', durSec: 6, beatRole: 'cliffhanger' },
  ]);
  it('hook and cliffhanger shots are auto-protected and listed', () => {
    const r = proposeCuts(beatEp(), { maxSec: 20, stepSec: 8 });
    expect(r.cuts.some(c => ['H', 'C'].includes(c.shotId))).toBe(false);
    expect(r.beatProtected).toEqual(['H', 'C']);
  });
  it('setup shots are trimmed before increment, increment before reversal', () => {
    const r = proposeCuts(beatEp(), { maxSec: 37 }); // need 4s → only setups
    expect(r.status).toBe('PROPOSED');
    expect(r.cuts.map(c => c.shotId)).toEqual(['S1', 'S2']);
    const r2 = proposeCuts(beatEp(), { maxSec: 26 }); // need 15s → setups to floor (10s), then increment (2s→... ) before reversal
    const order = (id: string) => r2.cuts.find(c => c.shotId === id);
    expect(order('S1')!.toSec).toBe(3);
    expect(order('S2')!.toSec).toBe(3);
    const iCut = 8 - (order('I')?.toSec ?? 8), rCut = 8 - (order('R')?.toSec ?? 8);
    expect(iCut).toBeGreaterThanOrEqual(rCut);
  });
  it('setup is preferred over an untagged ambient shot of equal base risk', () => {
    const r = proposeCuts(mk([{ shotId: 'A', durSec: 6 }, { shotId: 'B', durSec: 6, beatRole: 'setup' }, { shotId: 'Z', durSec: 2, beatRole: 'cliffhanger' }]), { maxSec: 12 });
    expect(r.cuts.map(c => c.shotId)).toEqual(['B']);
  });
  it('risk notes explain beat roles', () => {
    const r = proposeCuts(beatEp(), { maxSec: 18 });
    const rv = r.cuts.find(c => c.shotId === 'R');
    expect(rv?.riskNote).toMatch(/反转/);
    expect(r.cuts.find(c => c.shotId === 'S1')!.riskNote).toMatch(/铺垫/);
  });
  it('only hook/cliffhanger left → INFEASIBLE instead of eating the hook', () => {
    const r = proposeCuts(mk([{ shotId: 'H', durSec: 10, beatRole: 'hook' }, { shotId: 'C', durSec: 10, beatRole: 'cliffhanger' }]), { maxSec: 12 });
    expect(r.status).toBe('INFEASIBLE');
    expect(r.cuts).toEqual([]);
    expect(r.shortfallSec).toBe(8);
  });
  it('protectBeats:false lets a human explicitly allow cutting hook/cliffhanger', () => {
    const r = proposeCuts(mk([{ shotId: 'H', durSec: 10, beatRole: 'hook' }, { shotId: 'C', durSec: 10, beatRole: 'cliffhanger' }]), { maxSec: 12, protectBeats: false });
    expect(r.status).toBe('PROPOSED');
    expect(r.beatProtected).toEqual([]);
  });
  it('unknown beatRole is reported, not silently cut as plain shot', () => {
    const r = proposeCuts(mk([{ shotId: 'X', durSec: 8, beatRole: 'cliffhangr' }, { shotId: 'Y', durSec: 8 }]), { maxSec: 12 });
    expect(r.unknownBeatRoles).toEqual(['X']);
    expect(r.cuts.some(c => c.shotId === 'X')).toBe(false);
  });
  it('untagged EP01 is unaffected (方案 A unchanged, no beat lists)', () => {
    const r = proposeCuts(v1, { maxSec: 90, protectedShots: ['S08', 'S10'] });
    expect(r.beatProtected).toEqual([]);
    expect(r.unknownBeatRoles).toEqual([]);
  });
});
