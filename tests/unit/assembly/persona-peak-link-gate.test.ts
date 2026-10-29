/**
 * V12 Persona×Peak Link — 人设卡×巅峰, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePersonaPeakLink } from '@/agents/assembly/persona-peak-link-gate';

const card = {
  "slug": "su-jianqing",
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
  "notes": "机长马甲角色"
} as const;

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  cards: [card],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 10, peakLabel: '公开身份对峙', payoffEp: 10 }],
  links: [{ id: 'L1', cardSlug: 'su-jianqing', peakId: '对峙峰值' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluatePersonaPeakLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluatePersonaPeakLink', () => {
  it('card linked to peak → PASS', () => {
    const r = evaluatePersonaPeakLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / PEAK_WITHOUT_PERSONA', () => {
    expect(failCodes(evaluatePersonaPeakLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluatePersonaPeakLink(pack({ links: [] })))).toContain('PEAK_WITHOUT_PERSONA');
  });
});
