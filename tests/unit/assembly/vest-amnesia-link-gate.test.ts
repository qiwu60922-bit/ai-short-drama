/**
 * V12 Vest×Amnesia Link — 马甲×失忆, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestAmnesiaLink } from '@/agents/assembly/vest-amnesia-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 10,
    dropLabel: '公开机长身份反击',
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
  links: [{ id: 'L1', vestId: '机长马甲', amnesiaId: '祁南失忆' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateVestAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateVestAmnesiaLink', () => {
  it('recover = drop → PASS', () => {
    const r = evaluateVestAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / RECOVER_NOT_AT_DROP / VEST_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateVestAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateVestAmnesiaLink(
          pack({
            amnesias: [{
              id: '祁南失忆',
              actor: '祁南',
              plantEp: 1,
              plantCause: '爆炸',
              companionEps: [2, 4, 6],
              recoverEp: 9,
              recoverLabel: '提前唤回',
              recoverTrigger: '圣诞摩天轮',
            }],
          }),
        ),
      ),
    ).toContain('RECOVER_NOT_AT_DROP');
    expect(failCodes(evaluateVestAmnesiaLink(pack({ links: [] })))).toContain('VEST_WITHOUT_AMNESIA');
  });
});
