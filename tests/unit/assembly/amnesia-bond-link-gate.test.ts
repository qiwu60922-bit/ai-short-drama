/**
 * V12 Amnesia×Bond Link — 失忆唤回×契约终端, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaBondLink } from '@/agents/assembly/amnesia-bond-link-gate';

const amnesia = {
  id: '祁南失忆',
  actor: '祁南',
  plantEp: 1,
  plantCause: '爆炸',
  companionEps: [2, 4, 6],
  recoverEp: 8,
  recoverLabel: '摩天轮唤回',
  recoverTrigger: '圣诞摩天轮',
};
const bond = {
  id: '邱秘书契约',
  partyA: '邱秘书',
  partyB: '陆总',
  contractEp: 1,
  contractLabel: '一年契约女友',
  companionEps: [2, 4],
  upgradeEp: 8,
  upgradeLabel: '受伤后真情求婚',
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  amnesias: [amnesia],
  bonds: [bond],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', bondId: '邱秘书契约' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAmnesiaBondLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaBondLink', () => {
  it('recover at bond terminal → PASS', () => {
    const r = evaluateAmnesiaBondLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / RECOVER_NOT_AT_TERMINAL / BOND_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateAmnesiaBondLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAmnesiaBondLink(
          pack({ amnesias: [{ ...amnesia, recoverEp: 7, recoverLabel: '早唤回' }] }),
        ),
      ),
    ).toContain('RECOVER_NOT_AT_TERMINAL');
    expect(failCodes(evaluateAmnesiaBondLink(pack({ links: [] })))).toContain(
      'BOND_WITHOUT_AMNESIA',
    );
  });
});
