/**
 * V12 Frequency×Vest Link — 马甲×频率, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyVestLink } from '@/agents/assembly/frequency-vest-link-gate';

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
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
  frequencies: [{
    id: '离婚要挟',
    actor: '丈夫',
    motif: '离婚要挟',
    unit: 'count' as const,
    threshold: 99,
    plantEp: 1,
    ticks: [{ ep: 3, n: 10 }, { ep: 5, n: 50 }, { ep: 10, n: 99, label: '第99次' }],
    tipEp: 10,
    tipLabel: '接受第99次离婚彻底离开',
  }],
  links: [{ id: 'L1', vestId: '机长马甲', frequencyId: '离婚要挟' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateFrequencyVestLink', () => {
  it('tip @ drop → PASS', () => {
    const r = evaluateFrequencyVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / TIP_NOT_AT_DROP / TIP_WITHOUT_VEST', () => {
    expect(failCodes(evaluateFrequencyVestLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateFrequencyVestLink(
          pack({
            vests: [{
              id: '机长马甲',
              wearer: '苏见晴',
              vestLabel: '机长',
              plantEp: 1,
              dropEp: 9,
              dropLabel: '公开机长身份反击',
            }],
          }),
        ),
      ),
    ).toContain('TIP_NOT_AT_DROP');
    expect(failCodes(evaluateFrequencyVestLink(pack({ links: [] })))).toContain(
      'TIP_WITHOUT_VEST',
    );
  });
});
