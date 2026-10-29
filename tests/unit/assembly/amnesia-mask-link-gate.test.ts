/**
 * V12 Amnesia×Mask Link — 失忆×伪装, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaMaskLink } from '@/agents/assembly/amnesia-mask-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  amnesias: [{
    id: '祁南失忆',
    actor: '祁南',
    plantEp: 1,
    plantCause: '爆炸',
    companionEps: [2, 4, 6],
    recoverEp: 10,
    recoverLabel: '摩天轮唤回',
    recoverTrigger: '圣诞摩天轮',
  }],
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 10,
    revealLabel: '真心崩塌',
  }],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', maskId: '花心纨绔' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAmnesiaMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaMaskLink', () => {
  it('recover = reveal → PASS', () => {
    const r = evaluateAmnesiaMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / RECOVER_NOT_AT_REVEAL / REVEAL_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateAmnesiaMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAmnesiaMaskLink(
          pack({
            masks: [{
              id: '花心纨绔',
              wearer: '江少',
              plantEp: 1,
              maintainEps: [2, 3],
              revealEp: 9,
              revealLabel: '真心崩塌',
            }],
          }),
        ),
      ),
    ).toContain('RECOVER_NOT_AT_REVEAL');
    expect(failCodes(evaluateAmnesiaMaskLink(pack({ links: [] })))).toContain(
      'REVEAL_WITHOUT_AMNESIA',
    );
  });
});
