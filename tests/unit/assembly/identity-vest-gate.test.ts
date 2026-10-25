/**
 * V12 Identity-Vest Gate — 马甲/隐藏真身份账本（延迟掉落）, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果/端原生 hits 2026-10-24～10-25:
 * 《机长先生，你的未婚妻嫁人了》(机长马甲全程吊胃口→危机/对峙峰值再掉),
 * 《无敌贾二虎》(出狱隐忍→股东会当众揭阴谋/身份底牌),
 * 《轻烟染日暮》(第99次离婚为 tipping；报告侧对照，gate 不绑次数).
 * plant → tease → drop; same-ep plant+drop allowed.
 */
import { describe, expect, it } from 'vitest';
import { evaluateIdentityVest } from '@/agents/assembly/identity-vest-gate';

const ledger = (entries: Array<Record<string, unknown>>, latestEp = 20) => ({
  series: 'T',
  latestEp,
  entries,
});

const failCodes = (r: ReturnType<typeof evaluateIdentityVest>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

const warnCodes = (r: ReturnType<typeof evaluateIdentityVest>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluateIdentityVest', () => {
  it('plant → tease → drop PASS; gates untouched', () => {
    const r = evaluateIdentityVest(
      ledger(
        [
          {
            id: '机长马甲',
            wearer: '苏见晴',
            vestLabel: '机长',
            plantEp: 1,
            teaseEps: [8, 15, 22],
            dropEp: 35,
            dropLabel: '公开机长身份反击',
          },
          {
            id: '出狱底牌',
            wearer: '贾二虎',
            vestLabel: '血债清算者',
            plantEp: 1,
            plantAtSec: 5,
            dropEp: 1,
            dropAtSec: 50,
            dropLabel: '开场立目标旁白',
          },
        ],
        51,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ total: 2, dropped: 2, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('same-ep plant+drop allowed when dropAtSec ≥ plantAtSec', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: '同集立掉',
          wearer: '贾二虎',
          vestLabel: '归来复仇',
          plantEp: 1,
          plantAtSec: 5,
          dropEp: 1,
          dropAtSec: 40,
          dropLabel: '旁白立目标',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).not.toContain('DROP_BEFORE_PLANT');
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateIdentityVest({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('duplicate ids → DUP_ID FAIL', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: 'x',
          wearer: 'A',
          vestLabel: '机长',
          plantEp: 1,
          dropEp: 2,
          dropLabel: '掉',
        },
        {
          id: 'x',
          wearer: 'B',
          vestLabel: '总裁',
          plantEp: 3,
          dropEp: 4,
          dropLabel: '掉',
        },
      ]),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('plant/drop/tease beyond latestEp → FUTURE_EP FAIL', () => {
    const r = evaluateIdentityVest(
      ledger(
        [
          {
            id: '未来',
            wearer: 'A',
            vestLabel: '机长',
            plantEp: 1,
            teaseEps: [25],
            dropEp: 26,
            dropLabel: '晚',
          },
        ],
        20,
      ),
    );
    expect(failCodes(r)).toContain('FUTURE_EP');
  });

  it('dropEp before plantEp → DROP_BEFORE_PLANT FAIL', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: '颠倒',
          wearer: 'A',
          vestLabel: '机长',
          plantEp: 5,
          dropEp: 2,
          dropLabel: '早掉',
        },
      ]),
    );
    expect(failCodes(r)).toContain('DROP_BEFORE_PLANT');
  });

  it('same ep but dropAtSec before plantAtSec → DROP_BEFORE_PLANT FAIL', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: '同集颠倒',
          wearer: '苏见晴',
          vestLabel: '机长',
          plantEp: 1,
          plantAtSec: 40,
          dropEp: 1,
          dropAtSec: 10,
          dropLabel: '掉马甲',
        },
      ]),
    );
    expect(failCodes(r)).toContain('DROP_BEFORE_PLANT');
  });

  it('drop without dropLabel → DROP_WITHOUT_LABEL FAIL', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: '无标签',
          wearer: 'A',
          vestLabel: '机长',
          plantEp: 1,
          dropEp: 3,
        },
      ]),
    );
    expect(failCodes(r)).toContain('DROP_WITHOUT_LABEL');
  });

  it('teaseEp before plantEp → TEASE_BEFORE_PLANT FAIL', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: '早吊',
          wearer: '苏见晴',
          vestLabel: '机长',
          plantEp: 5,
          teaseEps: [2, 6],
          dropEp: 10,
          dropLabel: '掉',
        },
      ]),
    );
    expect(failCodes(r)).toContain('TEASE_BEFORE_PLANT');
  });

  it('teaseEp after dropEp → TEASE_AFTER_DROP FAIL', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: '晚吊',
          wearer: '苏见晴',
          vestLabel: '机长',
          plantEp: 1,
          teaseEps: [3, 15],
          dropEp: 10,
          dropLabel: '掉',
        },
      ]),
    );
    expect(failCodes(r)).toContain('TEASE_AFTER_DROP');
  });

  it('plant without drop → VEST_PENDING WARN (PASS)', () => {
    const r = evaluateIdentityVest(
      ledger(
        [
          {
            id: '待掉',
            wearer: '苏见晴',
            vestLabel: '机长',
            plantEp: 1,
            teaseEps: [2, 3],
          },
        ],
        5,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('VEST_PENDING');
    expect(r.findings.find((f) => f.code === 'VEST_PENDING')).toMatchObject({
      severity: 'WARN',
      ids: ['待掉'],
    });
  });

  it('plant/drop without teaseEps → NO_TEASE WARN (PASS)', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: '无吊胃口',
          wearer: '贾二虎',
          vestLabel: '归来',
          plantEp: 1,
          dropEp: 1,
          dropAtSec: 20,
          dropLabel: '开场立目标',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('NO_TEASE');
  });

  it('empty teaseEps array → NO_TEASE WARN', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: '空吊',
          wearer: 'A',
          vestLabel: '机长',
          plantEp: 1,
          teaseEps: [],
          dropEp: 4,
          dropLabel: '掉',
        },
      ]),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('NO_TEASE');
  });

  it('wearer and vestLabel required → SCHEMA FAIL when missing', () => {
    const r = evaluateIdentityVest(
      ledger([{ id: '缺字段', plantEp: 1, dropEp: 2, dropLabel: '掉' }]),
    );
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('optional peakEp after drop → PEAK_AFTER_DROP FAIL', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: '峰值颠倒',
          wearer: '苏见晴',
          vestLabel: '机长',
          plantEp: 1,
          teaseEps: [5],
          dropEp: 10,
          dropLabel: '掉马甲',
          peakEp: 12,
          peakLabel: '对峙峰值',
        },
      ]),
    );
    expect(failCodes(r)).toContain('PEAK_AFTER_DROP');
  });

  it('drop bound to peak (peakEp ≤ dropEp) PASS — 机长联表', () => {
    const r = evaluateIdentityVest(
      ledger(
        [
          {
            id: '机长峰值掉',
            wearer: '苏见晴',
            vestLabel: '机长',
            plantEp: 1,
            teaseEps: [8, 20],
            peakEp: 34,
            peakLabel: '前任纠缠羞辱峰值',
            dropEp: 35,
            dropLabel: '公开机长身份反击',
          },
        ],
        51,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.withPeak).toBe(1);
    expect(failCodes(r)).toHaveLength(0);
  });

  it('peakEp set without peakLabel → PEAK_LABEL_MISSING FAIL', () => {
    const r = evaluateIdentityVest(
      ledger([
        {
          id: '无峰标',
          wearer: 'A',
          vestLabel: '机长',
          plantEp: 1,
          peakEp: 5,
          dropEp: 6,
          dropLabel: '掉',
        },
      ]),
    );
    expect(failCodes(r)).toContain('PEAK_LABEL_MISSING');
  });
});
