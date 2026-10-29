/**
 * V12 Reveal×Bond Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateRevealBondLink } from '@/agents/assembly/reveal-bond-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 20,
  reveals: [{ id: 'R1', wearer: '江少', plantEp: 1, maintainEps: [2, 3], revealEp: 10, revealLabel: '真心崩塌' }],
  bonds: [{
    id: 'B1', partyA: '苏见晴', partyB: '江少',
    contractEp: 1, contractLabel: '一年契约女友',
    upgradeEp: 10, upgradeLabel: '受伤后真情求婚',
  }],
  links: [{ id: 'L1', revealId: 'R1', bondId: 'B1' }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluateRevealBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateRevealBondLink', () => {
  it('reveal + bond terminal → PASS', () => {
    const r = evaluateRevealBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / REVEAL_WITHOUT_BOND', () => {
    expect(failCodes(evaluateRevealBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateRevealBondLink(pack({ links: [] })))).toContain('REVEAL_WITHOUT_BOND');
  });
});
