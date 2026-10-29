/**
 * V12 Persona×Cliff Link — 人设卡×跨集悬念, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePersonaCliffLink } from '@/agents/assembly/persona-cliff-link-gate';

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

type S = { durSec: number; beatRole?: string; action?: string };
const spec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});
const prevGood = (): S[] => [
  { durSec: 4, beatRole: 'hook', action: '危机开场' },
  { durSec: 8, beatRole: 'increment', action: '追查线索' },
  { durSec: 8, beatRole: 'reversal', action: '身份暴露' },
  { durSec: 10, beatRole: 'cliffhanger', action: '持械闯入被围' },
];
const nextGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: '被围承接' },
  { durSec: 2, beatRole: 'increment', action: '追问' },
  { durSec: 10, beatRole: 'reversal', action: '新证' },
  { durSec: 8, beatRole: 'cliffhanger', action: '更大危机' },
];

const cliff = {
  id: 'C8-9',
  prevEp: 8,
  nextEp: 9,
  prev: spec('EP08', prevGood()),
  next: spec('EP09', nextGood()),
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  cards: [goldenCard()],
  cliffLinks: [cliff],
  links: [{ id: 'L1', cardSlug: 'su-jianqing', cliffLinkId: 'C8-9' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluatePersonaCliffLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluatePersonaCliffLink', () => {
  it('card + cliff → PASS', () => {
    const r = evaluatePersonaCliffLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / CLIFF_WITHOUT_PERSONA', () => {
    expect(failCodes(evaluatePersonaCliffLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluatePersonaCliffLink(pack({ links: [] })))).toContain(
      'CLIFF_WITHOUT_PERSONA',
    );
  });
});
