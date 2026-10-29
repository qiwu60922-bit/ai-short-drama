/**
 * V12 Alliance×Mask Link — 同盟×伪装, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAllianceMaskLink } from '@/agents/assembly/alliance-mask-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短揭穿' },
  ],
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 10,
    revealLabel: '真心崩塌',
  }],
  links: [{ id: 'L1', allianceId: 'oni-fang', maskId: '花心纨绔', ep: 10 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAllianceMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAllianceMaskLink', () => {
  it('payoff = reveal → PASS', () => {
    const r = evaluateAllianceMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_PAYOFF_REVEAL / PAYOFF_WITHOUT_MASK', () => {
    expect(failCodes(evaluateAllianceMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAllianceMaskLink(
          pack({
            links: [{ id: 'L1', allianceId: 'oni-fang', maskId: '花心纨绔', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_PAYOFF_REVEAL');
    expect(failCodes(evaluateAllianceMaskLink(pack({ links: [] })))).toContain('PAYOFF_WITHOUT_MASK');
  });
});
