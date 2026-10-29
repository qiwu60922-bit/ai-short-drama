/**
 * V12 Mask×Amnesia Link — mask主键×失忆唤回, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateMaskAmnesiaLink } from '@/agents/assembly/mask-amnesia-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  masks: [{
    id: '花心纨绔',
    wearer: '江少',
    plantEp: 1,
    maintainEps: [2, 3],
    revealEp: 10,
    revealLabel: '真心崩塌',
  }],
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
  links: [{ id: 'L1', maskId: '花心纨绔', amnesiaId: '祁南失忆' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateMaskAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateMaskAmnesiaLink', () => {
  it('reveal = recover → PASS', () => {
    const r = evaluateMaskAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / REVEAL_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateMaskAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateMaskAmnesiaLink(pack({ links: [] })))).toContain('REVEAL_WITHOUT_AMNESIA');
  });
});
