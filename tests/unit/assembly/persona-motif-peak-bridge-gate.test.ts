/**
 * V12 Persona×Motif×Peak Ternary — 人设×母题×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePersonaMotifPeakBridge } from '@/agents/assembly/persona-motif-peak-bridge-gate';

function goldenCard(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'su-jianqing',
    name: '苏见晴',
    adult: true,
    age: 28,
    gender: '女',
    resemblance: 'none',
    face: {
      faceShape: '偏长的鹅蛋脸，颧骨略平',
      eyeShape: '内双，眼尾微垂，卧蚕浅',
      noseShape: '鼻梁中等高度，鼻头偏圆',
      lips: '上唇薄于下唇，唇峰不明显',
    },
    hair: { hairColor: '自然黑，发尾偏棕', hairLength: '锁骨下 5cm' },
    skin: { skinTone: '偏白，微暖调' },
    body: { heightFeel: '168cm 左右', bodyProportion: '七头身' },
    ageCues: ['眼下两条浅细纹', '法令纹浅，笑起来才明显'],
    wardrobe: [
      { id: 'W1', name: '通勤', items: '米白衬衫、深灰长裤、黑色乐福鞋', occasion: '基准服装' },
      { id: 'W2', name: '制服暗示', items: '深色飞行员夹克、白衬衫、黑靴' },
      { id: 'W3', name: '晚宴', items: '黑色礼服裙、细跟凉鞋' },
    ],
    anchors: [
      '偏长的鹅蛋脸，颧骨平',
      '内双眼尾微垂',
      '齐刘海锁骨下黑发，中间偏左分线',
      '下颌线清晰但不方',
    ],
    reference: { sourcePhoto: 'none', sheetImages: ['sheet1.png'] },
    notes: '机长马甲角色',
    ...overrides,
  };
}

const motif = { id: 'white-rose', label: '白玫瑰', kind: 'prop' as const };
const appearances = [
  { motifId: 'white-rose', ep: 1, role: 'seed' as const, visualState: '含苞' },
  { motifId: 'white-rose', ep: 8, role: 'echo' as const, visualState: '半开' },
  { motifId: 'white-rose', ep: 20, role: 'payoff' as const, visualState: '盛放' },
];
const peak = { id: '订婚宴嫌弃', openEp: 1, peakEp: 8, peakLabel: '订婚宴嫌弃峰值', payoffEp: 8 };

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  cards: [goldenCard()],
  motifs: [motif],
  appearances,
  peaks: [peak],
  links: [{ id: 'L1', cardSlug: 'su-jianqing', motifId: 'white-rose', peakId: '订婚宴嫌弃', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluatePersonaMotifPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluatePersonaMotifPeakBridge', () => {
  it('card + motif@peak → PASS', () => {
    const r = evaluatePersonaMotifPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluatePersonaMotifPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluatePersonaMotifPeakBridge(
          pack({
            links: [
              { id: 'L1', cardSlug: 'su-jianqing', motifId: 'white-rose', peakId: '订婚宴嫌弃', ep: 7 },
            ],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluatePersonaMotifPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
