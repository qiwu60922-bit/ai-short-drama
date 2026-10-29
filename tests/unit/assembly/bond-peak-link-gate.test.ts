/**
 * V12 Bond×Peak Link — 契约升级/解除 × 巅峰兑现, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondPeakLink } from '@/agents/assembly/bond-peak-link-gate';

const bond = {
  id: '邱秘书契约',
  partyA: '邱秘书',
  partyB: '陆总',
  contractEp: 5,
  contractLabel: '一年契约女友',
  companionEps: [12, 28, 45],
  upgradeEp: 70,
  upgradeLabel: '受伤后真情求婚',
};

const peak = {
  id: '真情对峙',
  openEp: 5,
  peakEp: 70,
  peakLabel: '受伤后对峙巅峰',
  payoffEp: 70,
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '云海不相逢',
  latestEp: 78,
  bonds: [bond],
  peaks: [peak],
  links: [{ id: 'L1', bondId: '邱秘书契约', peakId: '真情对峙' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateBondPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateBondPeakLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateBondPeakLink', () => {
  it('upgrade at peak → PASS', () => {
    const r = evaluateBondPeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / DUP / UNKNOWN / not at peak', () => {
    expect(failCodes(evaluateBondPeakLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateBondPeakLink(
          pack({
            links: [
              { id: 'd', bondId: '邱秘书契约', peakId: '真情对峙' },
              { id: 'd', bondId: '邱秘书契约', peakId: '真情对峙' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    expect(
      failCodes(
        evaluateBondPeakLink(
          pack({
            bonds: [{ ...bond, upgradeEp: 60, upgradeLabel: '提前升级' }],
          }),
        ),
      ),
    ).toContain('TERMINAL_NOT_AT_PEAK');
  });

  it('peak without link → PEAK_WITHOUT_BOND', () => {
    expect(failCodes(evaluateBondPeakLink(pack({ links: [] })))).toContain('PEAK_WITHOUT_BOND');
  });

  it('orphan bond → PENDING_BOND WARN', () => {
    const r = evaluateBondPeakLink(
      pack({
        bonds: [
          bond,
          {
            id: '旁路契约',
            partyA: 'A',
            partyB: 'B',
            contractEp: 2,
            contractLabel: '旁路',
            companionEps: [3],
            upgradeEp: 10,
            upgradeLabel: '旁路升级',
          },
        ],
      }),
    );
    expect(warnCodes(r)).toContain('PENDING_BOND');
    expect(r.verdict).toBe('PASS');
  });
});
