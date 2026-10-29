/**
 * V12 Bond×Frequency Link Gate — 契约升级/解除须对齐「第N次」tipping 联表, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果/微短剧热力榜 hits 2026-10-29:
 * 《警报！叶楚出狱》（入赘契约 → 培养感情 ticks → 真情 upgrade tip）,
 * 《云海不相逢》（报恩婚姻 → 多次伤害 ticks → 心死 dissolve tip）,
 * 《飞上枝头难成凤凰》（今日对照：羞辱峰值身份掉落走 vest×peak 候选，本测不绑）.
 * link.terminal=upgrade|dissolve → bond 终端集 = frequency tipEp；升级/解除前须已 tipping.
 */
import { describe, expect, it } from 'vitest';
import { evaluateBondFrequencyLink } from '@/agents/assembly/bond-frequency-link-gate';

const pack = (
  bonds: Array<Record<string, unknown>>,
  frequencies: Array<Record<string, unknown>>,
  links: Array<Record<string, unknown>>,
  latestEp = 80,
) => ({
  series: 'T',
  latestEp,
  bonds,
  frequencies,
  links,
});

const failCodes = (r: ReturnType<typeof evaluateBondFrequencyLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

const warnCodes = (r: ReturnType<typeof evaluateBondFrequencyLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

const yeChuBond = {
  id: '叶楚入赘',
  partyA: '叶楚',
  partyB: '姜君瑶',
  contractEp: 3,
  contractLabel: '入赘姜家换身世线索',
  companionEps: [10, 22, 35],
  upgradeEp: 60,
  upgradeLabel: '真情站稳并肩',
};

const yeChuFreq = {
  id: '培养感情三次',
  actor: '叶楚',
  motif: '入赘后培养感情帮扶',
  unit: 'count' as const,
  threshold: 3,
  plantEp: 3,
  ticks: [
    { ep: 10, n: 1, label: '第一次护妻' },
    { ep: 22, n: 2, label: '第二次医治' },
    { ep: 35, n: 3, label: '第三次解围' },
  ],
  tipEp: 60,
  tipLabel: '第三次帮扶后真情升级',
};

const yunHaiBond = {
  id: '许欢颜报恩婚',
  partyA: '许欢颜',
  partyB: '裴从闻',
  contractEp: 1,
  contractLabel: '五年报恩治愈婚姻',
  companionEps: [5, 12],
  dissolveEp: 40,
  dissolveLabel: '安心回国后心死离婚',
};

const yunHaiFreq = {
  id: '伤害蓄到心死',
  actor: '裴从闻',
  motif: '为白月光伤害原配',
  unit: 'count' as const,
  threshold: 3,
  plantEp: 8,
  ticks: [
    { ep: 15, n: 1 },
    { ep: 28, n: 2 },
    { ep: 39, n: 3 },
  ],
  tipEp: 40,
  tipLabel: '第3次弃之不顾后心死',
};

describe('evaluateBondFrequencyLink', () => {
  it('叶楚入赘：upgrade 对齐 tip PASS；gates untouched', () => {
    const r = evaluateBondFrequencyLink(
      pack(
        [yeChuBond],
        [yeChuFreq],
        [
          {
            id: '入赘×帮扶',
            bondId: '叶楚入赘',
            frequencyId: '培养感情三次',
            terminal: 'upgrade',
          },
        ],
        80,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({
      links: 1,
      aligned: 1,
      pending: 0,
    });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('云海不相逢：dissolve 对齐 tip PASS', () => {
    const r = evaluateBondFrequencyLink(
      pack(
        [yunHaiBond],
        [yunHaiFreq],
        [
          {
            id: '报恩婚×伤害',
            bondId: '许欢颜报恩婚',
            frequencyId: '伤害蓄到心死',
            terminal: 'dissolve',
          },
        ],
        62,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateBondFrequencyLink({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('duplicate link ids → DUP_ID FAIL', () => {
    const r = evaluateBondFrequencyLink(
      pack(
        [yeChuBond],
        [yeChuFreq],
        [
          { id: 'x', bondId: '叶楚入赘', frequencyId: '培养感情三次', terminal: 'upgrade' },
          { id: 'x', bondId: '叶楚入赘', frequencyId: '培养感情三次', terminal: 'upgrade' },
        ],
      ),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('unknown bondId → UNKNOWN_BOND FAIL', () => {
    const r = evaluateBondFrequencyLink(
      pack(
        [yeChuBond],
        [yeChuFreq],
        [{ id: '坏链', bondId: '不存在', frequencyId: '培养感情三次', terminal: 'upgrade' }],
      ),
    );
    expect(failCodes(r)).toContain('UNKNOWN_BOND');
  });

  it('unknown frequencyId → UNKNOWN_FREQUENCY FAIL', () => {
    const r = evaluateBondFrequencyLink(
      pack(
        [yeChuBond],
        [yeChuFreq],
        [{ id: '坏链', bondId: '叶楚入赘', frequencyId: '不存在', terminal: 'upgrade' }],
      ),
    );
    expect(failCodes(r)).toContain('UNKNOWN_FREQUENCY');
  });

  it('bond upgraded but frequency not tipped → TERMINAL_WITHOUT_TIP FAIL', () => {
    const freqPending = { ...yeChuFreq, tipEp: undefined, tipLabel: undefined };
    const r = evaluateBondFrequencyLink(
      pack(
        [yeChuBond],
        [freqPending],
        [
          {
            id: '缺 tip',
            bondId: '叶楚入赘',
            frequencyId: '培养感情三次',
            terminal: 'upgrade',
          },
        ],
      ),
    );
    expect(failCodes(r)).toContain('TERMINAL_WITHOUT_TIP');
    expect(r.verdict).toBe('FAIL');
  });

  it('frequency tipped but bond missing matching terminal → TIP_WITHOUT_TERMINAL FAIL', () => {
    const bondPending = {
      id: '叶楚入赘',
      partyA: '叶楚',
      partyB: '姜君瑶',
      contractEp: 3,
      contractLabel: '入赘姜家换身世线索',
      companionEps: [10, 22, 35],
    };
    const r = evaluateBondFrequencyLink(
      pack(
        [bondPending],
        [yeChuFreq],
        [
          {
            id: '缺终端',
            bondId: '叶楚入赘',
            frequencyId: '培养感情三次',
            terminal: 'upgrade',
          },
        ],
      ),
    );
    expect(failCodes(r)).toContain('TIP_WITHOUT_TERMINAL');
  });

  it('upgradeEp != tipEp → EP_MISMATCH FAIL', () => {
    const mismatched = { ...yeChuBond, upgradeEp: 55, upgradeLabel: '早升级' };
    const r = evaluateBondFrequencyLink(
      pack(
        [mismatched],
        [yeChuFreq],
        [
          {
            id: '集号错位',
            bondId: '叶楚入赘',
            frequencyId: '培养感情三次',
            terminal: 'upgrade',
          },
        ],
      ),
    );
    expect(failCodes(r)).toContain('EP_MISMATCH');
  });

  it('link terminal=upgrade but bond dissolved → WRONG_TERMINAL FAIL', () => {
    const dissolved = {
      id: '叶楚入赘',
      partyA: '叶楚',
      partyB: '姜君瑶',
      contractEp: 3,
      contractLabel: '入赘',
      dissolveEp: 60,
      dissolveLabel: '解除',
    };
    const r = evaluateBondFrequencyLink(
      pack(
        [dissolved],
        [yeChuFreq],
        [
          {
            id: '终端错',
            bondId: '叶楚入赘',
            frequencyId: '培养感情三次',
            terminal: 'upgrade',
          },
        ],
      ),
    );
    expect(failCodes(r)).toContain('WRONG_TERMINAL');
  });

  it('child bond ledger FAIL bubbles → CHILD_BOND_FAIL', () => {
    const badBond = {
      id: '坏契约',
      partyA: 'A',
      partyB: 'B',
      contractEp: 10,
      contractLabel: '契约',
      upgradeEp: 3,
      upgradeLabel: '早升级',
    };
    const freq = {
      id: 'f',
      actor: 'A',
      motif: '帮扶',
      unit: 'count',
      threshold: 1,
      plantEp: 10,
      tipEp: 3,
      tipLabel: 'tip',
      ticks: [{ ep: 10, n: 1 }],
    };
    const r = evaluateBondFrequencyLink(
      pack(
        [badBond],
        [freq],
        [{ id: '链', bondId: '坏契约', frequencyId: 'f', terminal: 'upgrade' }],
      ),
    );
    expect(failCodes(r)).toContain('CHILD_BOND_FAIL');
  });

  it('child frequency ledger FAIL bubbles → CHILD_FREQUENCY_FAIL', () => {
    const bond = {
      id: 'b',
      partyA: 'A',
      partyB: 'B',
      contractEp: 1,
      contractLabel: '契约',
      upgradeEp: 5,
      upgradeLabel: '升',
    };
    const badFreq = {
      id: 'f',
      actor: 'A',
      motif: '帮扶',
      unit: 'count',
      threshold: 3,
      plantEp: 1,
      tipEp: 5,
      tipLabel: 'tip',
      ticks: [{ ep: 2, n: 1 }], // tip without reaching threshold
    };
    const r = evaluateBondFrequencyLink(
      pack(
        [bond],
        [badFreq],
        [{ id: '链', bondId: 'b', frequencyId: 'f', terminal: 'upgrade' }],
      ),
    );
    expect(failCodes(r)).toContain('CHILD_FREQUENCY_FAIL');
  });

  it('both pending → PENDING_PAIR WARN still PASS', () => {
    const bondPending = {
      id: '叶楚入赘',
      partyA: '叶楚',
      partyB: '姜君瑶',
      contractEp: 3,
      contractLabel: '入赘',
      companionEps: [10],
    };
    const freqPending = {
      id: '培养感情三次',
      actor: '叶楚',
      motif: '帮扶',
      unit: 'count',
      threshold: 3,
      plantEp: 3,
      ticks: [{ ep: 10, n: 1 }],
    };
    const r = evaluateBondFrequencyLink(
      pack(
        [bondPending],
        [freqPending],
        [
          {
            id: '蓄势中',
            bondId: '叶楚入赘',
            frequencyId: '培养感情三次',
            terminal: 'upgrade',
          },
        ],
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.metrics.pending).toBe(1);
  });

  it('duplicate bond ids in bonds array → CHILD_BOND_FAIL (via DUP_ID)', () => {
    const r = evaluateBondFrequencyLink(
      pack(
        [yeChuBond, { ...yeChuBond }],
        [yeChuFreq],
        [
          {
            id: '链',
            bondId: '叶楚入赘',
            frequencyId: '培养感情三次',
            terminal: 'upgrade',
          },
        ],
      ),
    );
    expect(failCodes(r)).toContain('CHILD_BOND_FAIL');
  });
});
