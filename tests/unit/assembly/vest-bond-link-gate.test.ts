/**
 * V12 Vest×Bond Link — 契约×马甲, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestBondLink } from '@/agents/assembly/vest-bond-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  bonds: [{
    id: '江少契约',
    partyA: '江少',
    partyB: '女主',
    contractEp: 1,
    contractLabel: '假面联姻',
    companionEps: [2, 3, 5],
    upgradeEp: 10,
    upgradeLabel: '真心崩塌后真情',
  }],
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 10,
    dropLabel: '公开机长身份反击',
  }],
  links: [{ id: 'L1', bondId: '江少契约', vestId: '机长马甲' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateVestBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestBondLink', () => {
  it('upgrade = drop → PASS', () => {
    const r = evaluateVestBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TERMINAL_NOT_AT_DROP / DROP_WITHOUT_BOND', () => {
    expect(failCodes(evaluateVestBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateVestBondLink(
          pack({
            bonds: [{
              id: '江少契约',
              partyA: '江少',
              partyB: '女主',
              contractEp: 1,
              contractLabel: '假面联姻',
              companionEps: [2, 3, 5],
              upgradeEp: 9,
              upgradeLabel: '提前升级',
            }],
          }),
        ),
      ),
    ).toContain('TERMINAL_NOT_AT_DROP');
    expect(failCodes(evaluateVestBondLink(pack({ links: [] })))).toContain('DROP_WITHOUT_BOND');
  });
});
