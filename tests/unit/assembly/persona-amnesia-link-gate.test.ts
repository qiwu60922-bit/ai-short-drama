/**
 * V12 Persona×Amnesia Link — persona主键×失忆唤回, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePersonaAmnesiaLink } from '@/agents/assembly/persona-amnesia-link-gate';

const card = {
  "name": "苏见晴",
  "adult": true,
  "age": 28,
  "gender": "女",
  "resemblance": "none",
  "face": {
    "faceShape": "偏长的鹅蛋脸，颧骨略平",
    "eyeShape": "内双，眼尾微垂，卧蚕浅",
    "noseShape": "鼻梁中等高度，鼻头偏圆",
    "lips": "上唇薄于下唇，唇峰不明显"
  },
  "hair": {
    "hairColor": "自然黑，发尾偏棕",
    "hairLength": "锁骨下 5cm"
  },
  "skin": {
    "skinTone": "偏白，微暖调"
  },
  "body": {
    "heightFeel": "168cm 左右",
    "bodyProportion": "七头身"
  },
  "ageCues": [
    "眼下两条浅细纹",
    "法令纹浅，笑起来才明显"
  ],
  "wardrobe": [
    {
      "id": "W1",
      "name": "通勤",
      "items": "米白衬衫、深灰长裤、黑色乐福鞋",
      "occasion": "基准服装"
    },
    {
      "id": "W2",
      "name": "制服暗示",
      "items": "深色飞行员夹克、白衬衫、黑靴"
    },
    {
      "id": "W3",
      "name": "晚宴",
      "items": "黑色礼服裙、细跟凉鞋"
    }
  ],
  "anchors": [
    "偏长的鹅蛋脸，颧骨平",
    "内双眼尾微垂",
    "齐刘海锁骨下黑发，中间偏左分线",
    "下颌线清晰但不方"
  ],
  "reference": {
    "sourcePhoto": "none",
    "sheetImages": [
      "sheet1.png"
    ]
  },
  "notes": "机长马甲角色",
  "slug": "su-jianqing-ampl"
} as const;

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '逃婚三年',
  latestEp: 20,
  cards: [card],
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
  links: [{ id: 'L1', cardSlug: card.slug, amnesiaId: '祁南失忆' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluatePersonaAmnesiaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluatePersonaAmnesiaLink', () => {
  it('card ↔ recover → PASS', () => {
    const r = evaluatePersonaAmnesiaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / CARD_WITHOUT_AMNESIA', () => {
    expect(failCodes(evaluatePersonaAmnesiaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluatePersonaAmnesiaLink(pack({ links: [] })))).toContain('CARD_WITHOUT_AMNESIA');
  });
});
