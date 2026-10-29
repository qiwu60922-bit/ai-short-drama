/**
 * V12 Vest/Mask×Peak Link Gate — 马甲/假人设掉落须对齐羞辱峰值联表, offline, ≠Final ≠G3.
 * Reverse-engineered (text/structure only) from 红果/微短剧热力榜 hits 2026-10-29:
 * 《飞上枝头难成凤凰》（飞机羞辱峰值 → 未来婆婆身份掉落，同集 peak=drop）,
 * 《警报！叶楚出狱》（真龙/医术马甲长线 — vest 侧对照）,
 * 《云海不相逢》（今日对照：bond×frequency 已做，本测不绑）.
 * link.sourceKind=vest|mask → dropEp|revealEp = peak.peakEp；跨文件硬联表.
 */
import { describe, expect, it } from 'vitest';
import { evaluateVestMaskPeakLink } from '@/agents/assembly/vest-mask-peak-link-gate';

const pack = (
  vests: Array<Record<string, unknown>>,
  masks: Array<Record<string, unknown>>,
  peaks: Array<Record<string, unknown>>,
  links: Array<Record<string, unknown>>,
  latestEp = 50,
) => ({
  series: 'T',
  latestEp,
  vests,
  masks,
  peaks,
  links,
});

const failCodes = (r: ReturnType<typeof evaluateVestMaskPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

const warnCodes = (r: ReturnType<typeof evaluateVestMaskPeakLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

const phoenixVest = {
  id: '未来婆婆马甲',
  wearer: '中年女乘客',
  vestLabel: '未来婆婆',
  plantEp: 1,
  plantAtSec: 5,
  teaseEps: [1],
  dropEp: 1,
  dropAtSec: 55,
  dropLabel: '公开未来婆婆身份打脸',
};

const phoenixPeak = {
  id: '机舱羞辱峰值',
  openEp: 1,
  openAtSec: 10,
  peakEp: 1,
  peakAtSec: 40,
  peakLabel: '拜金女当众羞辱好心劝阻者',
  payoffEp: 1,
  payoffAtSec: 55,
};

const yeChuVest = {
  id: '真龙血脉马甲',
  wearer: '叶楚',
  vestLabel: '真龙血脉/狱中医术',
  plantEp: 3,
  teaseEps: [12, 25, 40],
  dropEp: 70,
  dropLabel: '公开血脉身份反击',
  peakEp: 70,
  peakLabel: '姜家对峙羞辱峰值',
};

const yeChuPeak = {
  id: '姜家对峙',
  openEp: 5,
  peakEp: 70,
  peakLabel: '姜家对峙羞辱峰值',
  payoffEp: 70,
};

const flowerMask = {
  id: '花心人设',
  wearer: '江少',
  plantEp: 1,
  maintainEps: [3, 5, 8],
  revealEp: 12,
  revealLabel: '真心崩塌',
};

const flowerPeak = {
  id: '重逢对峙峰值',
  openEp: 2,
  peakEp: 12,
  peakLabel: '重逢当众揭穿',
  payoffEp: 12,
};

describe('evaluateVestMaskPeakLink', () => {
  it('飞上枝头：vest drop 对齐 peak PASS；gates untouched', () => {
    const r = evaluateVestMaskPeakLink(
      pack(
        [phoenixVest],
        [],
        [phoenixPeak],
        [
          {
            id: '羞辱×婆婆马甲',
            sourceKind: 'vest',
            sourceId: '未来婆婆马甲',
            peakId: '机舱羞辱峰值',
          },
        ],
        47,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1, pending: 0, vests: 1, peaks: 1 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('叶楚真龙马甲：dropEp=peakEp PASS；内嵌 peak 与联表一致', () => {
    const r = evaluateVestMaskPeakLink(
      pack(
        [yeChuVest],
        [],
        [yeChuPeak],
        [
          {
            id: '血脉×对峙',
            sourceKind: 'vest',
            sourceId: '真龙血脉马甲',
            peakId: '姜家对峙',
          },
        ],
        80,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
  });

  it('花心 mask reveal 对齐 peak PASS', () => {
    const r = evaluateVestMaskPeakLink(
      pack(
        [],
        [flowerMask],
        [flowerPeak],
        [
          {
            id: '花心×重逢',
            sourceKind: 'mask',
            sourceId: '花心人设',
            peakId: '重逢对峙峰值',
          },
        ],
        20,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ aligned: 1, masks: 1 });
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateVestMaskPeakLink({ series: 'T' });
    expect(failCodes(r)).toContain('SCHEMA');
    expect(r.verdict).toBe('FAIL');
  });

  it('duplicate link id → DUP_ID FAIL', () => {
    const r = evaluateVestMaskPeakLink(
      pack(
        [phoenixVest],
        [],
        [phoenixPeak],
        [
          { id: 'dup', sourceKind: 'vest', sourceId: '未来婆婆马甲', peakId: '机舱羞辱峰值' },
          { id: 'dup', sourceKind: 'vest', sourceId: '未来婆婆马甲', peakId: '机舱羞辱峰值' },
        ],
        47,
      ),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('unknown source / peak → UNKNOWN_* FAIL', () => {
    const r = evaluateVestMaskPeakLink(
      pack(
        [phoenixVest],
        [],
        [phoenixPeak],
        [
          { id: 'a', sourceKind: 'vest', sourceId: '不存在', peakId: '机舱羞辱峰值' },
          { id: 'b', sourceKind: 'vest', sourceId: '未来婆婆马甲', peakId: '鬼峰' },
        ],
        47,
      ),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_SOURCE', 'UNKNOWN_PEAK']));
  });

  it('drop without peakEp → TERMINAL_WITHOUT_PEAK FAIL', () => {
    const r = evaluateVestMaskPeakLink(
      pack(
        [phoenixVest],
        [],
        [{ id: '空峰', openEp: 1 }],
        [
          {
            id: '无峰',
            sourceKind: 'vest',
            sourceId: '未来婆婆马甲',
            peakId: '空峰',
          },
        ],
        47,
      ),
    );
    expect(failCodes(r)).toContain('TERMINAL_WITHOUT_PEAK');
  });

  it('peak without drop → PEAK_WITHOUT_TERMINAL FAIL', () => {
    const pendingVest = {
      id: '未掉马甲',
      wearer: '中年女乘客',
      vestLabel: '未来婆婆',
      plantEp: 1,
      teaseEps: [1],
    };
    const r = evaluateVestMaskPeakLink(
      pack(
        [pendingVest],
        [],
        [phoenixPeak],
        [
          {
            id: '峰无掉',
            sourceKind: 'vest',
            sourceId: '未掉马甲',
            peakId: '机舱羞辱峰值',
          },
        ],
        47,
      ),
    );
    expect(failCodes(r)).toContain('PEAK_WITHOUT_TERMINAL');
  });

  it('dropEp ≠ peakEp → EP_MISMATCH FAIL', () => {
    const lateDrop = { ...phoenixVest, dropEp: 3, dropAtSec: undefined, teaseEps: [1, 2] };
    const r = evaluateVestMaskPeakLink(
      pack(
        [lateDrop],
        [],
        [phoenixPeak],
        [
          {
            id: '错集',
            sourceKind: 'vest',
            sourceId: '未来婆婆马甲',
            peakId: '机舱羞辱峰值',
          },
        ],
        47,
      ),
    );
    expect(failCodes(r)).toContain('EP_MISMATCH');
  });

  it('both pending → PENDING_PAIR WARN only', () => {
    const r = evaluateVestMaskPeakLink(
      pack(
        [
          {
            id: '蓄势马甲',
            wearer: '叶楚',
            vestLabel: '真龙',
            plantEp: 3,
            teaseEps: [10],
          },
        ],
        [],
        [{ id: '未到峰', openEp: 5 }],
        [
          {
            id: '蓄势中',
            sourceKind: 'vest',
            sourceId: '蓄势马甲',
            peakId: '未到峰',
          },
        ],
        20,
      ),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.metrics.pending).toBe(1);
  });

  it('vest embed peakEp ≠ linked peak.peakEp → EMBED_PEAK_MISMATCH FAIL', () => {
    const mismatched = { ...yeChuVest, peakEp: 65, peakLabel: '错峰' };
    const r = evaluateVestMaskPeakLink(
      pack(
        [mismatched],
        [],
        [yeChuPeak],
        [
          {
            id: '内嵌错',
            sourceKind: 'vest',
            sourceId: '真龙血脉马甲',
            peakId: '姜家对峙',
          },
        ],
        80,
      ),
    );
    expect(failCodes(r)).toContain('EMBED_PEAK_MISMATCH');
  });

  it('child vest FAIL bubbles CHILD_VEST_FAIL', () => {
    const bad = {
      id: '坏马甲',
      wearer: 'x',
      vestLabel: 'y',
      plantEp: 5,
      dropEp: 3,
      dropLabel: '早掉',
    };
    const r = evaluateVestMaskPeakLink(
      pack(
        [bad],
        [],
        [{ id: 'p', openEp: 1, peakEp: 3, peakLabel: '峰', payoffEp: 3 }],
        [{ id: 'l', sourceKind: 'vest', sourceId: '坏马甲', peakId: 'p' }],
        10,
      ),
    );
    expect(failCodes(r)).toContain('CHILD_VEST_FAIL');
  });

  it('child mask FAIL bubbles CHILD_MASK_FAIL', () => {
    const bad = {
      id: '坏面具',
      wearer: 'x',
      plantEp: 5,
      revealEp: 2,
      revealLabel: '早露',
    };
    const r = evaluateVestMaskPeakLink(
      pack(
        [],
        [bad],
        [{ id: 'p', openEp: 1, peakEp: 2, peakLabel: '峰', payoffEp: 2 }],
        [{ id: 'l', sourceKind: 'mask', sourceId: '坏面具', peakId: 'p' }],
        10,
      ),
    );
    expect(failCodes(r)).toContain('CHILD_MASK_FAIL');
  });

  it('child peak FAIL bubbles CHILD_PEAK_FAIL', () => {
    const r = evaluateVestMaskPeakLink(
      pack(
        [phoenixVest],
        [],
        [
          {
            id: '坏峰',
            openEp: 1,
            payoffEp: 1,
            // peakEp missing → PAYOFF_WITHOUT_PEAK
          },
        ],
        [
          {
            id: 'l',
            sourceKind: 'vest',
            sourceId: '未来婆婆马甲',
            peakId: '坏峰',
          },
        ],
        47,
      ),
    );
    expect(failCodes(r)).toContain('CHILD_PEAK_FAIL');
  });
});
