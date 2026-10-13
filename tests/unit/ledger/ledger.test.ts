import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { CHARACTER_IDS, resolveCharacterId, assertCastWritable } from '@/agents/ledger/character-registry';
import { hashInputs, appendLedgerEntry, readLedger, summarizeLedger } from '@/agents/ledger/generation-ledger';
const base = { shotId: 'S02', provider: 'fake-h3', model: 'fake-v1', costUsd: 0, latencyMs: 120, seed: 42, inputHash: 'a'.repeat(64), outputSha256: 'b'.repeat(64), cast: ['qi-ye'] };
describe('character registry', () => {
  it('canonical ids', () => expect(CHARACTER_IDS).toEqual(['qi-ye', 'fei-yue-li', 'zhui-yu-shitu']));
  it('resolves aliases and case', () => { expect(resolveCharacterId('Qi_Ye')).toBe('qi-ye'); expect(resolveCharacterId('feiyueli')).toBe('fei-yue-li'); });
  it('ye-yuan archived: readable, not writable', () => {
    expect(resolveCharacterId('ye-yuan', { allowArchived: true })).toBe('ye-yuan');
    expect(() => resolveCharacterId('ye-yuan')).toThrow(/ARCHIVED/);
    expect(() => assertCastWritable(['qi-ye', 'ye-yuan'])).toThrow(/ARCHIVED/);
  });
  it('unknown id rejected', () => expect(() => resolveCharacterId('nobody')).toThrow(/UNKNOWN/));
  it('EP01 fixture cast all canonical', () => {
    const s = JSON.parse(readFileSync('tests/fixtures/wave14-ep01/SHOT_SPEC.json', 'utf8'));
    expect(() => assertCastWritable(s.shots.flatMap((x: any) => x.cast ?? []))).not.toThrow();
  });
});
describe('generation ledger', () => {
  it('hashInputs stable across key order', () => {
    expect(hashInputs({ a: 1, b: { c: 2, d: 3 } })).toBe(hashInputs({ b: { d: 3, c: 2 }, a: 1 }));
    expect(hashInputs({ a: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });
  it('append-only JSONL with id + timestamp, canonical cast', () => {
    const p = join(mkdtempSync(join(tmpdir(), 'led-')), 'LEDGER.jsonl');
    const e1 = appendLedgerEntry(p, { ...base, cast: ['Qi_Ye'] });
    appendLedgerEntry(p, { ...base, shotId: 'S03', costUsd: 0.5, provider: 'other' });
    const all = readLedger(p);
    expect(all).toHaveLength(2); expect(all[0].entryId).toBe(e1.entryId); expect(all[0].cast).toEqual(['qi-ye']);
    expect(all[0].recordedAt).toMatch(/T/); expect(all[0].stamps.publish).toBe('FORBIDDEN');
    const s = summarizeLedger(all);
    expect(s.totalCostUsd).toBe(0.5); expect(s.byProvider['fake-h3'].count).toBe(1);
  });
  it('rejects missing/invalid fields and archived cast', () => {
    const p = join(mkdtempSync(join(tmpdir(), 'led-')), 'L.jsonl');
    expect(() => appendLedgerEntry(p, { ...base, outputSha256: 'xyz' })).toThrow();
    expect(() => appendLedgerEntry(p, { ...base, costUsd: -1 })).toThrow();
    const { provider, ...noProv } = base; expect(() => appendLedgerEntry(p, noProv as any)).toThrow();
    expect(() => appendLedgerEntry(p, { ...base, cast: ['ye-yuan'] })).toThrow(/ARCHIVED/);
  });
  it('seed may be null; corrupted line is reported', () => {
    const p = join(mkdtempSync(join(tmpdir(), 'led-')), 'L.jsonl');
    appendLedgerEntry(p, { ...base, seed: null });
    writeFileSync(p, readFileSync(p, 'utf8') + '{bad\n');
    expect(() => readLedger(p)).toThrow(/line 2/);
  });
});
