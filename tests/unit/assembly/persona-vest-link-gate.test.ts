/**
 * V12 Persona×Vest Link — 人设卡 × 马甲延迟掉落, offline, ≠Final ≠G3.
 * 《机长先生…》《无敌贾二虎》结构层对照.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePersonaVestLink } from '@/agents/assembly/persona-vest-link-gate';

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
    notes: '机长马甲角色；外形不随掉马甲改变',
    ...overrides,
  };
}

const vestOk = {
  id: '机长马甲',
  wearer: '苏见晴',
  vestLabel: '机长',
  plantEp: 1,
  teaseEps: [8, 15, 22],
  dropEp: 35,
  dropLabel: '公开机长身份反击',
};

const pack = (
  extra: {
    cards?: Array<Record<string, unknown>>;
    vests?: Array<Record<string, unknown>>;
    links?: Array<Record<string, unknown>>;
    latestEp?: number;
  } = {},
) => ({
  series: '机长先生',
  latestEp: extra.latestEp ?? 51,
  cards: extra.cards ?? [goldenCard()],
  vests: extra.vests ?? [vestOk],
  links: extra.links ?? [{ id: 'L1', cardSlug: 'su-jianqing', vestId: '机长马甲' }],
});

const failCodes = (r: ReturnType<typeof evaluatePersonaVestLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluatePersonaVestLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluatePersonaVestLink', () => {
  it('card.name = vest.wearer + dropped → PASS; gates untouched', () => {
    const r = evaluatePersonaVestLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('bad schema → SCHEMA FAIL', () => {
    expect(failCodes(evaluatePersonaVestLink({ series: 'T' }))).toContain('SCHEMA');
  });

  it('dup link → DUP_ID FAIL', () => {
    const r = evaluatePersonaVestLink(
      pack({
        links: [
          { id: 'dup', cardSlug: 'su-jianqing', vestId: '机长马甲' },
          { id: 'dup', cardSlug: 'su-jianqing', vestId: '机长马甲' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('DUP_ID');
  });

  it('unknown card/vest → UNKNOWN_* FAIL', () => {
    const r = evaluatePersonaVestLink(
      pack({
        links: [
          { id: 'a', cardSlug: 'ghost', vestId: '机长马甲' },
          { id: 'b', cardSlug: 'su-jianqing', vestId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_CARD', 'UNKNOWN_VEST']));
  });

  it('wearer ≠ card.name → WEARER_MISMATCH FAIL', () => {
    const r = evaluatePersonaVestLink(
      pack({ vests: [{ ...vestOk, wearer: '别人' }] }),
    );
    expect(failCodes(r)).toContain('WEARER_MISMATCH');
  });

  it('broken persona card → CHILD_PERSONA_FAIL', () => {
    const r = evaluatePersonaVestLink(
      pack({ cards: [goldenCard({ adult: false })] }),
    );
    expect(failCodes(r)).toContain('CHILD_PERSONA_FAIL');
  });

  it('pending vest → PENDING_PAIR WARN + PASS', () => {
    const r = evaluatePersonaVestLink(
      pack({
        vests: [
          {
            id: '机长马甲',
            wearer: '苏见晴',
            vestLabel: '机长',
            plantEp: 1,
            teaseEps: [8],
          },
        ],
        latestEp: 20,
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.metrics.pending).toBe(1);
  });

  it('vestLabel not in anchors/notes → VEST_LABEL_UNANCHORED WARN', () => {
    const r = evaluatePersonaVestLink(
      pack({
        cards: [goldenCard({ notes: '普通角色卡', anchors: ['a', 'b', 'c', 'd'] })],
        vests: [{ ...vestOk, vestLabel: '隐藏血脉' }],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('VEST_LABEL_UNANCHORED');
  });
});
