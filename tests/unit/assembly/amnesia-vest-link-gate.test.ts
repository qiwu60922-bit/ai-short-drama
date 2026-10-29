/**
 * V12 Amnesia×Vest Link — 失忆×马甲, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAmnesiaVestLink } from '@/agents/assembly/amnesia-vest-link-gate';

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
  vests: [{
    id: '机长马甲',
    wearer: '苏见晴',
    vestLabel: '机长',
    plantEp: 1,
    teaseEps: [3, 5],
    dropEp: 10,
    dropLabel: '公开机长身份反击',
  }],
  links: [{ id: 'L1', amnesiaId: '祁南失忆', vestId: '机长马甲' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAmnesiaVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAmnesiaVestLink', () => {
  it('recover = drop → PASS', () => {
    const r = evaluateAmnesiaVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / RECOVER_NOT_AT_DROP / DROP_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluateAmnesiaVestLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateAmnesiaVestLink(
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
    expect(failCodes(evaluateAmnesiaVestLink(pack({ links: [] })))).toContain('DROP_WITHOUT_AMNESIA');
  });
});
