/**
 * V12 Cliff×Persona Link — 叠钩×人设 (invert personaCliff), offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateCliffPersonaLink } from '@/agents/assembly/cliff-persona-link-gate';

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
};
const prev = {
  "episode": "EP08",
  "shots": [
    {
      "shotId": "EP08-S0",
      "durSec": 4,
      "cast": [],
      "beatRole": "hook",
      "action": "开场"
    },
    {
      "shotId": "EP08-S1",
      "durSec": 8,
      "cast": [],
      "beatRole": "increment",
      "action": "对峙"
    },
    {
      "shotId": "EP08-S2",
      "durSec": 8,
      "cast": [],
      "beatRole": "reversal",
      "action": "证据"
    },
    {
      "shotId": "EP08-S3",
      "durSec": 10,
      "cast": [],
      "beatRole": "cliffhanger",
      "action": "门外有人未解"
    }
  ]
};
const next = {
  "episode": "EP09",
  "shots": [
    {
      "shotId": "EP09-S0",
      "durSec": 3,
      "cast": [],
      "beatRole": "hook",
      "action": "承接门外危机"
    },
    {
      "shotId": "EP09-S1",
      "durSec": 8,
      "cast": [],
      "beatRole": "increment",
      "action": "追问"
    },
    {
      "shotId": "EP09-S2",
      "durSec": 8,
      "cast": [],
      "beatRole": "reversal",
      "action": "反转"
    },
    {
      "shotId": "EP09-S3",
      "durSec": 10,
      "cast": [],
      "beatRole": "cliffhanger",
      "action": "新悬念"
    }
  ]
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  cliffLinks: [{ id: 'C8-9', prevEp: 8, nextEp: 9, prev, next }],
  cards: [card],
  links: [{ id: 'L1', cliffLinkId: 'C8-9', cardSlug: 'su-jianqing' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateCliffPersonaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateCliffPersonaLink', () => {
  it('cliff linked to card → PASS', () => {
    const r = evaluateCliffPersonaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / CLIFF_WITHOUT_PERSONA / UNKNOWN_CARD', () => {
    expect(failCodes(evaluateCliffPersonaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateCliffPersonaLink(pack({ links: [] })))).toContain(
      'CLIFF_WITHOUT_PERSONA',
    );
    expect(
      failCodes(
        evaluateCliffPersonaLink(
          pack({
            links: [{ id: 'L1', cliffLinkId: 'C8-9', cardSlug: 'missing' }],
          }),
        ),
      ),
    ).toContain('UNKNOWN_CARD');
  });
});
