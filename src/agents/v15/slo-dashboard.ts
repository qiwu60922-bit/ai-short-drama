/** V15 cost/latency SLO dashboard from V12 ledgers → static JSON + HTML + MD (no scripts, no network). */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readLedger, type LedgerEntry } from '@/agents/ledger/generation-ledger';
export interface Slo { costPerEpisodeUsdMax: number; p95LatencyMsByProviderKind: Record<string, number>; defaultP95LatencyMs: number }
/** Defaults: $0/episode until the user's V15 GO (no money); latency budgets per provider kind (suffix match). */
export const DEFAULT_SLO: Slo = Object.freeze({ costPerEpisodeUsdMax: 0, p95LatencyMsByProviderKind: Object.freeze({ h3: 600_000, tts: 30_000 }) as Record<string, number>, defaultP95LatencyMs: 600_000 }) as Slo;
export const percentile = (xs: number[], p: number) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)]; };
export function buildSloReport(ledgerPaths: string[], slo: Partial<Slo> = {}) {
  const S: Slo = { ...DEFAULT_SLO, ...slo, p95LatencyMsByProviderKind: { ...DEFAULT_SLO.p95LatencyMsByProviderKind, ...(slo.p95LatencyMsByProviderKind ?? {}) } };
  const all: LedgerEntry[] = ledgerPaths.filter(existsSync).flatMap(p => readLedger(p));
  const byEp = new Map<string, LedgerEntry[]>(); const byProv = new Map<string, LedgerEntry[]>();
  for (const e of all) { const k = e.episode ?? '(none)'; byEp.set(k, [...(byEp.get(k) ?? []), e]); byProv.set(e.provider, [...(byProv.get(e.provider) ?? []), e]); }
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const episodes = [...byEp].map(([episode, es]) => { const costUsd = r2(es.reduce((a, e) => a + e.costUsd, 0));
    return { episode, count: es.length, costUsd, costStatus: costUsd <= S.costPerEpisodeUsdMax ? 'OK' as const : 'BREACH' as const }; });
  const providers = [...byProv].map(([provider, es]) => { const lat = es.map(e => e.latencyMs); const kind = Object.keys(S.p95LatencyMsByProviderKind).find(k => provider.endsWith(k));
    const budget = kind ? S.p95LatencyMsByProviderKind[kind] : S.defaultP95LatencyMs; const p95 = percentile(lat, 95)!;
    return { provider, count: es.length, costUsd: r2(es.reduce((a, e) => a + e.costUsd, 0)), p50LatencyMs: percentile(lat, 50), p95LatencyMs: p95, p95BudgetMs: budget, latencyStatus: p95 <= budget ? 'OK' as const : 'BREACH' as const }; });
  const overall = !all.length ? 'NO_DATA' as const : [...episodes.map(e => e.costStatus), ...providers.map(p => p.latencyStatus)].includes('BREACH') ? 'BREACH' as const : 'OK' as const;
  return { schema: 'v15/SloReport/v1' as const, generatedAt: new Date().toISOString(), ledgers: ledgerPaths, slo: S, totalCostUsd: r2(all.reduce((a, e) => a + e.costUsd, 0)), episodes, providers, overall };
}
export type SloReport = ReturnType<typeof buildSloReport>;
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const badge = (s: string) => `<b class="${s === 'OK' ? 'ok' : 'bad'}">${esc(s)}</b>`;
export function renderSloHtml(r: SloReport) {
  return `<!doctype html><meta charset="utf-8"><title>SLO 看板</title><style>body{font:14px sans-serif;margin:24px}table{border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ccc;padding:4px 8px}.ok{color:#080}.bad{color:#c00}</style>
<h1>成本 / 延迟 SLO 看板 ${badge(r.overall)}</h1><p>生成于 ${esc(r.generatedAt)} · 总成本 $${esc(r.totalCostUsd)} · 单集成本上限 $${esc(r.slo.costPerEpisodeUsdMax)}</p>
<h2>按集</h2><table><tr><th>集</th><th>条目</th><th>成本 $</th><th>状态</th></tr>${r.episodes.map(e => `<tr><td>${esc(e.episode)}</td><td>${e.count}</td><td>${e.costUsd}</td><td>${badge(e.costStatus)}</td></tr>`).join('')}</table>
<h2>按 provider</h2><table><tr><th>provider</th><th>条目</th><th>成本 $</th><th>p50 ms</th><th>p95 ms</th><th>p95 上限</th><th>状态</th></tr>${r.providers.map(p => `<tr><td>${esc(p.provider)}</td><td>${p.count}</td><td>${p.costUsd}</td><td>${p.p50LatencyMs}</td><td>${p.p95LatencyMs}</td><td>${p.p95BudgetMs}</td><td>${badge(p.latencyStatus)}</td></tr>`).join('')}</table>
<p>数据源：${r.ledgers.map(esc).join('<br>')}</p>`;
}
export function renderSloMarkdown(r: SloReport) {
  return [`# 成本 / 延迟 SLO 看板 — ${r.overall}`, '', `生成于 ${r.generatedAt} · 总成本 $${r.totalCostUsd} · 单集上限 $${r.slo.costPerEpisodeUsdMax}`, '', '| 集 | 成本 $ | 条目 | 状态 |', '|---|---|---|---|',
    ...r.episodes.map(e => `| ${e.episode} | ${e.costUsd} | ${e.count} | ${e.costStatus} |`), '', '| provider | 条目 | 成本 $ | p50 ms | p95 ms | p95 上限 | 状态 |', '|---|---|---|---|---|---|---|',
    ...r.providers.map(p => `| ${p.provider} | ${p.count} | ${p.costUsd} | ${p.p50LatencyMs} | ${p.p95LatencyMs} | ${p.p95BudgetMs} | ${p.latencyStatus} |`), ''].join('\n');
}
export function writeSloDashboard(dir: string, r: SloReport) {
  mkdirSync(dir, { recursive: true }); const o = { json: join(dir, 'SLO_REPORT.json'), html: join(dir, 'SLO_DASHBOARD.html'), md: join(dir, 'SLO_DASHBOARD.md') };
  writeFileSync(o.json, JSON.stringify(r, null, 2)); writeFileSync(o.html, renderSloHtml(r)); writeFileSync(o.md, renderSloMarkdown(r)); return o;
}
