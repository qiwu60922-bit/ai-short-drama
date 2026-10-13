import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { appendLedgerEntry } from '@/agents/ledger/generation-ledger';
import { percentile, buildSloReport, renderSloHtml, renderSloMarkdown, writeSloDashboard, DEFAULT_SLO } from '@/agents/v15/slo-dashboard';
const H = 'a'.repeat(64);
function root() {
  const r = mkdtempSync(join(tmpdir(), 'slo-'));
  for (const [ep, n, cost, lat] of [['ep01', 4, 0, 1000], ['ep02', 3, 0.5, 900000]] as const) {
    mkdirSync(join(r, ep));
    for (let i = 0; i < n; i++) appendLedgerEntry(join(r, ep, 'LEDGER.jsonl'), { shotId: `S${i}`, episode: ep, provider: 'fake-h3', model: 'm', costUsd: cost, latencyMs: lat + i, seed: null, inputHash: H, outputSha256: H, cast: [] });
    appendLedgerEntry(join(r, ep, 'LEDGER.jsonl'), { shotId: 'S0', episode: ep, provider: 'fake-tts', model: 'm', costUsd: 0, latencyMs: 50, seed: null, inputHash: H, outputSha256: H, cast: [] });
  }
  return r;
}
describe('SLO dashboard', () => {
  it('percentile nearest-rank', () => { expect(percentile([1, 2, 3, 4], 50)).toBe(2); expect(percentile([1, 2, 3, 4], 95)).toBe(4); expect(percentile([], 95)).toBeNull(); });
  it('per-episode cost + per-provider p50/p95 latency vs SLO', () => {
    const r = buildSloReport([join(root(), 'ep01', 'LEDGER.jsonl'), join(root(), 'ep02', 'LEDGER.jsonl')]);
    const e1 = r.episodes.find(e => e.episode === 'ep01')!, e2 = r.episodes.find(e => e.episode === 'ep02')!;
    expect(e1.costUsd).toBe(0); expect(e1.costStatus).toBe('OK');
    expect(e2.costUsd).toBe(1.5); expect(e2.costStatus).toBe('BREACH');
    const h3 = r.providers.find(p => p.provider === 'fake-h3')!; expect(h3.count).toBe(7); expect(h3.latencyStatus).toBe('BREACH');
    expect(r.providers.find(p => p.provider === 'fake-tts')!.latencyStatus).toBe('OK');
    expect(r.overall).toBe('BREACH'); expect(r.slo).toEqual(DEFAULT_SLO);
  });
  it('custom SLO, no data → NO_DATA', () => {
    expect(buildSloReport([], { costPerEpisodeUsdMax: 10 }).overall).toBe('NO_DATA');
  });
  it('writes static HTML + MD (escaped, no scripts, no network)', () => {
    const r = root(); const rep = buildSloReport([join(r, 'ep01', 'LEDGER.jsonl'), join(r, 'ep02', 'LEDGER.jsonl')]);
    const html = renderSloHtml(rep); expect(html).not.toMatch(/<script|https?:\/\//); expect(html).toContain('BREACH');
    expect(renderSloMarkdown(rep)).toMatch(/\| ep02 \| 1\.5/);
    const out = writeSloDashboard(join(r, 'dash'), rep); expect(existsSync(out.html) && existsSync(out.md) && existsSync(out.json)).toBe(true);
  });
});
