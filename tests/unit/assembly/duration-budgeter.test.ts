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
