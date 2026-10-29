/**
 * V12 Persona×Countdown×Peak Ternary — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePersonaCountdownPeakBridge } from '@/agents/assembly/persona-countdown-peak-bridge-gate';
import fixture from '../../fixtures/v13/story-ledger-suite.v13.json';

const pack = (extra: Record<string, unknown> = {}) => {
  const base = (fixture as any).countdownPersonaPeakBridge;
  return {
    series: '机长马甲',
    latestEp: 20,
    countdowns: base.countdowns,
    cards: base.cards,
    peaks: base.peaks,
    links: base.links,
    ...extra,
  };
};
const failCodes = (r: ReturnType<typeof evaluatePersonaCountdownPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluatePersonaCountdownPeakBridge', () => {
  it('persona + countdown + peak → PASS', () => {
    const r = evaluatePersonaCountdownPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluatePersonaCountdownPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluatePersonaCountdownPeakBridge(pack({ links: [] })))).toContain('PEAK_WITHOUT_BRIDGE');
  });
});
