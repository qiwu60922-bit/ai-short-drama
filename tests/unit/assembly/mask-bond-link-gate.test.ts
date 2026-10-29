/**
 * V12 Mask×Bond Link — 伪装×契约 (invert bondMask), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskBondLink } from '@/agents/assembly/mask-bond-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  bonds: [{
    id: '机长契约',
    partyA: '苏见晴',
    partyB: '傅司宴',
    contractEp: 1,
    contractLabel: '契约联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 10,
    upgradeLabel: '真心升级',
  }],
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 10,
    revealLabel: '真心崩塌',
  }],
  links: [{ id: 'L1', bondId: '机长契约', maskId: '花心纨绔' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskBondLink', () => {
  it('terminal @ reveal → PASS', () => {
    const r = evaluateMaskBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TERMINAL_NOT_AT_REVEAL / REVEAL_WITHOUT_BOND', () => {
    expect(failCodes(evaluateMaskBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateMaskBondLink(
          pack({
            masks: [{
              id: '花心纨绔',
              wearer: '江少',
              plantEp: 1,
              revealEp: 9,
              revealLabel: '真心崩塌',
            }],
          }),
        ),
      ),
    ).toContain('TERMINAL_NOT_AT_REVEAL');
    expect(failCodes(evaluateMaskBondLink(pack({ links: [] })))).toContain(
      'REVEAL_WITHOUT_BOND',
    );
  });
});
