/**
 * V12 Frequency×Peak Link Gate — 第N次 tipping 须落在情绪峰值集, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果 hits 结构层 + 2026-10-29 候选清单:
 * 《轻烟染日暮》第99次离婚 tipping 须踩在羞辱/对峙峰值,
 * 《备用联系人》分手第70天吻 = day tip 对齐情感峰值,
 * 《警报！叶楚出狱》帮扶第N次 tip 对齐对峙/真情峰值（对照）.
 * tipEp === peak.peakEp；跨文件硬联表.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyPeakLink } from '@/agents/assembly/frequency-peak-link-gate';

const pack = (
  frequencies: Array<Record<string, unknown>>,
  peaks: Array<Record<string, unknown>>,
  links: Array<Record<string, unknown>>,
  latestEp = 50,
) => ({ series: 'T', latestEp, frequencies, peaks, links });

const failCodes = (r: ReturnType<typeof evaluateFrequencyPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

const warnCodes = (r: ReturnType<typeof evaluateFrequencyPeakLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

const divorceFreq = {
  id: '离婚99次',
  actor: '丈夫',
  motif: '离婚要挟',
  unit: 'count' as const,
  threshold: 99,
  plantEp: 1,
  ticks: [
    { ep: 3, n: 10 },
    { ep: 10, n: 50 },
    { ep: 20, n: 99, label: '第99次' },
  ],
  tipEp: 20,
  tipLabel: '接受第99次离婚彻底离开',
};

const divorcePeak = {
  id: '第99次对峙峰',
  openEp: 1,
  peakEp: 20,
  peakLabel: '第99次离婚要挟羞辱峰值',
  payoffEp: 20,
};

const day70Freq = {
  id: '分手70天',
  actor: '池茉',
  motif: '分手后天数',
  unit: 'day' as const,
  threshold: 70,
  plantEp: 1,
  ticks: [
    { ep: 5, n: 30 },
    { ep: 12, n: 60 },
    { ep: 18, n: 70, label: '第70天' },
  ],
  tipEp: 18,
  tipLabel: '分手第70天吻了宋淮聿',
};

const day70Peak = {
  id: '重逢情感峰',
  openEp: 2,
  peakEp: 18,
  peakLabel: '重逢情感峰值',
  payoffEp: 18,
};

describe('evaluateFrequencyPeakLink', () => {
  it('第99次离婚 tip 对齐 peak PASS；gates untouched', () => {
    const r = evaluateFrequencyPeakLink(
      pack(
        [divorceFreq],
        [divorcePeak],
        [{ id: '离婚×峰', frequencyId: '离婚99次', peakId: '第99次对峙峰' }],
        51,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1, pending: 0, frequencies: 1, peaks: 1 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('分手第70天 tip 对齐情感峰 PASS', () => {
    const r = evaluateFrequencyPeakLink(
      pack(
        [day70Freq],
        [day70Peak],
        [{ id: '70天×峰', frequencyId: '分手70天', peakId: '重逢情感峰' }],
        30,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateFrequencyPeakLink({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('duplicate link id → DUP_ID FAIL', () => {
    const r = evaluateFrequencyPeakLink(
      pack(
        [divorceFreq],
        [divorcePeak],
        [
          { id: 'dup', frequencyId: '离婚99次', peakId: '第99次对峙峰' },
          { id: 'dup', frequencyId: '离婚99次', peakId: '第99次对峙峰' },
        ],
        51,
      ),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('unknown frequency / peak → UNKNOWN_* FAIL', () => {
    const r = evaluateFrequencyPeakLink(
      pack(
        [divorceFreq],
        [divorcePeak],
        [
          { id: 'a', frequencyId: '无', peakId: '第99次对峙峰' },
          { id: 'b', frequencyId: '离婚99次', peakId: '鬼' },
        ],
        51,
      ),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_FREQUENCY', 'UNKNOWN_PEAK']));
  });

  it('tip without peakEp → TIP_WITHOUT_PEAK FAIL', () => {
    const r = evaluateFrequencyPeakLink(
      pack(
        [divorceFreq],
        [{ id: '空峰', openEp: 1 }],
        [{ id: '无峰', frequencyId: '离婚99次', peakId: '空峰' }],
        51,
      ),
    );
    expect(failCodes(r)).toContain('TIP_WITHOUT_PEAK');
  });

  it('peak without tip → PEAK_WITHOUT_TIP FAIL', () => {
    const pending = {
      id: '未 tip',
      actor: '丈夫',
      motif: '离婚要挟',
      unit: 'count',
      threshold: 99,
      plantEp: 1,
      ticks: [{ ep: 3, n: 10 }],
    };
    const r = evaluateFrequencyPeakLink(
      pack(
        [pending],
        [divorcePeak],
        [{ id: '峰无 tip', frequencyId: '未 tip', peakId: '第99次对峙峰' }],
        51,
      ),
    );
    expect(failCodes(r)).toContain('PEAK_WITHOUT_TIP');
  });

  it('tipEp ≠ peakEp → EP_MISMATCH FAIL', () => {
    const late = { ...divorceFreq, tipEp: 22, tipLabel: '晚 tip' };
    const r = evaluateFrequencyPeakLink(
      pack(
        [late],
        [divorcePeak],
        [{ id: '错集', frequencyId: '离婚99次', peakId: '第99次对峙峰' }],
        51,
      ),
    );
    expect(failCodes(r)).toContain('EP_MISMATCH');
  });

  it('both pending → PENDING_PAIR WARN only', () => {
    const r = evaluateFrequencyPeakLink(
      pack(
        [
          {
            id: '蓄势',
            actor: '丈夫',
            motif: '离婚',
            unit: 'count',
            threshold: 99,
            plantEp: 1,
            ticks: [{ ep: 3, n: 10 }],
          },
        ],
        [{ id: '未到峰', openEp: 1 }],
        [{ id: '蓄', frequencyId: '蓄势', peakId: '未到峰' }],
        20,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.metrics.pending).toBe(1);
  });

  it('child frequency FAIL bubbles CHILD_FREQUENCY_FAIL', () => {
    const bad = {
      id: '坏频',
      actor: 'x',
      motif: 'y',
      unit: 'count',
      threshold: 3,
      plantEp: 5,
      tipEp: 2,
      tipLabel: '早 tip',
    };
    const r = evaluateFrequencyPeakLink(
      pack(
        [bad],
        [{ id: 'p', openEp: 1, peakEp: 2, peakLabel: '峰', payoffEp: 2 }],
        [{ id: 'l', frequencyId: '坏频', peakId: 'p' }],
        10,
      ),
    );
    expect(failCodes(r)).toContain('CHILD_FREQUENCY_FAIL');
  });

  it('child peak FAIL bubbles CHILD_PEAK_FAIL', () => {
    const r = evaluateFrequencyPeakLink(
      pack(
        [divorceFreq],
        [{ id: '坏峰', openEp: 1, payoffEp: 20 }],
        [{ id: 'l', frequencyId: '离婚99次', peakId: '坏峰' }],
        51,
      ),
    );
    expect(failCodes(r)).toContain('CHILD_PEAK_FAIL');
  });

  it('two links both aligned PASS', () => {
    const r = evaluateFrequencyPeakLink(
      pack(
        [divorceFreq, day70Freq],
        [divorcePeak, day70Peak],
        [
          { id: 'a', frequencyId: '离婚99次', peakId: '第99次对峙峰' },
          { id: 'b', frequencyId: '分手70天', peakId: '重逢情感峰' },
        ],
        51,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(2);
  });
});
