/**
 * V12 Frequency-Tipping Gate — 第 N 次/第 N 天 tipping 计数器, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果 hits 2026-10-25～10-26:
 * 《备用联系人》（分手第70天吻了宋淮聿 = day tipping）,
 * 《边军破刀：一路砍到裂土封王》（战功/封赏阶梯可当 count 对照；本测以次数线为主）,
 * 《修仙满级回现代，我让全家横着走》（满级归来护家打脸可叠次数爽点）.
 * Also closes 10-25 candidate「频率 tipping 计数器」（轻烟染日暮·第99次离婚）.
 * plant → ticks[] → tip at threshold; same-ep plant+tip allowed.
 */
import { describe, expect, it } from 'vitest';
import { evaluateFrequencyTipping } from '@/agents/assembly/frequency-tipping-gate';

const ledger = (entries: Array<Record<string, unknown>>, latestEp = 20) => ({
  series: 'T',
  latestEp,
  entries,
});

const failCodes = (r: ReturnType<typeof evaluateFrequencyTipping>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

const warnCodes = (r: ReturnType<typeof evaluateFrequencyTipping>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateFrequencyTipping', () => {
  it('plant → ticks → tip PASS; gates untouched', () => {
    const r = evaluateFrequencyTipping(
      ledger(
        [
          {
            id: '分手天数',
            actor: '池茉',
            motif: '分手后天数',
            unit: 'day',
            threshold: 70,
            plantEp: 1,
            ticks: [
              { ep: 5, n: 30, label: '分手满月' },
              { ep: 12, n: 60, label: '分手两月' },
              { ep: 18, n: 70, label: '第70天' },
            ],
            tipEp: 18,
            tipLabel: '分手第70天吻了宋淮聿',
          },
          {
            id: '离婚要挟',
            actor: '丈夫',
            motif: '离婚要挟',
            unit: 'count',
            threshold: 99,
            plantEp: 1,
            ticks: [
              { ep: 3, n: 10 },
              { ep: 10, n: 50 },
              { ep: 20, n: 99, label: '第99次' },
            ],
            tipEp: 20,
            tipLabel: '接受第99次离婚彻底离开',
          },
        ],
        51,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ total: 2, tipped: 2, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('same-ep plant+tip allowed when tipAtSec ≥ plantAtSec', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '同集 tipping',
          actor: '池茉',
          motif: '分手后天数',
          unit: 'day',
          threshold: 70,
          plantEp: 1,
          plantAtSec: 5,
          tipEp: 1,
          tipAtSec: 80,
          tipLabel: '第70天吻',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).not.toContain('TIP_BEFORE_PLANT');
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateFrequencyTipping({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('duplicate ids → DUP_ID FAIL', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: 'x',
          actor: 'A',
          motif: '离婚',
          unit: 'count',
          threshold: 3,
          plantEp: 1,
          tipEp: 2,
          tipLabel: 'tip',
        },
        {
          id: 'x',
          actor: 'B',
          motif: '天数',
          unit: 'day',
          threshold: 70,
          plantEp: 3,
          tipEp: 4,
          tipLabel: 'tip',
        },
      ]),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('plant/tip/tick beyond latestEp → FUTURE_EP FAIL', () => {
    const r = evaluateFrequencyTipping(
      ledger(
        [
          {
            id: '未来',
            actor: 'A',
            motif: '离婚',
            unit: 'count',
            threshold: 5,
            plantEp: 1,
            ticks: [{ ep: 25, n: 3 }],
            tipEp: 26,
            tipLabel: '晚',
          },
        ],
        20,
      ),
    );
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('tipEp before plantEp → TIP_BEFORE_PLANT FAIL', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '颠倒',
          actor: 'A',
          motif: '离婚',
          unit: 'count',
          threshold: 3,
          plantEp: 5,
          tipEp: 2,
          tipLabel: '早 tip',
        },
      ]),
    );
    expect(failCodes(r)).toContain('TIP_BEFORE_PLANT');
  });

  it('same ep but tipAtSec before plantAtSec → TIP_BEFORE_PLANT FAIL', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '同集颠倒',
          actor: '池茉',
          motif: '分手后天数',
          unit: 'day',
          threshold: 70,
          plantEp: 1,
          plantAtSec: 80,
          tipEp: 1,
          tipAtSec: 10,
          tipLabel: '第70天',
        },
      ]),
    );
    expect(failCodes(r)).toContain('TIP_BEFORE_PLANT');
  });

  it('tip without tipLabel → TIP_WITHOUT_LABEL FAIL', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '无标签',
          actor: 'A',
          motif: '离婚',
          unit: 'count',
          threshold: 3,
          plantEp: 1,
          tipEp: 3,
        },
      ]),
    );
    expect(failCodes(r)).toContain('TIP_WITHOUT_LABEL');
  });

  it('tick ep before plantEp → TICK_BEFORE_PLANT FAIL', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '早 tick',
          actor: 'A',
          motif: '离婚',
          unit: 'count',
          threshold: 10,
          plantEp: 5,
          ticks: [{ ep: 2, n: 1 }],
          tipEp: 8,
          tipLabel: 'tip',
        },
      ]),
    );
    expect(failCodes(r)).toContain('TICK_BEFORE_PLANT');
  });

  it('tick ep after tipEp → TICK_AFTER_TIP FAIL', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '晚 tick',
          actor: 'A',
          motif: '离婚',
          unit: 'count',
          threshold: 10,
          plantEp: 1,
          ticks: [{ ep: 9, n: 10 }],
          tipEp: 5,
          tipLabel: 'tip',
        },
      ]),
    );
    expect(failCodes(r)).toContain('TICK_AFTER_TIP');
  });

  it('ticks n not ascending by ep order → TICK_N_NOT_ASCENDING FAIL', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '倒计数',
          actor: 'A',
          motif: '离婚',
          unit: 'count',
          threshold: 99,
          plantEp: 1,
          ticks: [
            { ep: 3, n: 50 },
            { ep: 8, n: 20 },
          ],
          tipEp: 10,
          tipLabel: 'tip',
        },
      ]),
    );
    expect(failCodes(r)).toContain('TICK_N_NOT_ASCENDING');
  });

  it('tick n > threshold → TICK_N_EXCEEDS_THRESHOLD FAIL', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '超阈',
          actor: 'A',
          motif: '离婚',
          unit: 'count',
          threshold: 99,
          plantEp: 1,
          ticks: [{ ep: 5, n: 120 }],
          tipEp: 8,
          tipLabel: 'tip',
        },
      ]),
    );
    expect(failCodes(r)).toContain('TICK_N_EXCEEDS_THRESHOLD');
  });

  it('tipped but max tick n < threshold → THRESHOLD_NOT_REACHED FAIL', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '未达阈',
          actor: '池茉',
          motif: '分手后天数',
          unit: 'day',
          threshold: 70,
          plantEp: 1,
          ticks: [
            { ep: 5, n: 30 },
            { ep: 10, n: 50 },
          ],
          tipEp: 12,
          tipLabel: '提前 tip',
        },
      ]),
    );
    expect(failCodes(r)).toContain('THRESHOLD_NOT_REACHED');
  });

  it('planted not tipped → TIP_PENDING WARN + PASS', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '蓄势',
          actor: '丈夫',
          motif: '离婚要挟',
          unit: 'count',
          threshold: 99,
          plantEp: 1,
          ticks: [{ ep: 3, n: 10 }],
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('TIP_PENDING');
    expect(r.metrics.pending).toBe(1);
  });

  it('tipped with no ticks → NO_TICKS WARN + PASS', () => {
    const r = evaluateFrequencyTipping(
      ledger([
        {
          id: '直达',
          actor: '池茉',
          motif: '分手后天数',
          unit: 'day',
          threshold: 70,
          plantEp: 1,
          tipEp: 8,
          tipLabel: '分手第70天吻了',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('NO_TICKS');
  });

  it('empty entries PASS', () => {
    const r = evaluateFrequencyTipping(ledger([], 10));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.total).toBe(0);
  });
});
