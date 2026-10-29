/**
 * V12 Handoff×Persona×Peak Ternary — 承接×人设×峰值, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateHandoffPersonaPeakBridge } from '@/agents/assembly/handoff-persona-peak-bridge-gate';

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
    { "shotId": "EP08-S0", "durSec": 4, "cast": [], "beatRole": "hook", "action": "开场" },
    { "shotId": "EP08-S1", "durSec": 8, "cast": [], "beatRole": "increment", "action": "对峙" },
    { "shotId": "EP08-S2", "durSec": 8, "cast": [], "beatRole": "reversal", "action": "证据" },
    { "shotId": "EP08-S3", "durSec": 10, "cast": [], "beatRole": "cliffhanger", "action": "门外有人未解" }
  ]
};
const next = {
  "episode": "EP09",
  "shots": [
    { "shotId": "EP09-S0", "durSec": 2, "cast": [], "beatRole": "hook", "action": "承接" },
    { "shotId": "EP09-S1", "durSec": 2, "cast": [], "beatRole": "increment", "action": "加压" },
    { "shotId": "EP09-S2", "durSec": 8, "cast": [], "beatRole": "reversal", "action": "反转" },
    { "shotId": "EP09-S3", "durSec": 8, "cast": [], "beatRole": "cliffhanger", "action": "再悬" }
  ]
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '机长先生',
  latestEp: 20,
  handoffs: [{ id: 'H8-9', prevEp: 8, nextEp: 9, prev, next }],
  cards: [card],
  peaks: [{ id: '对峙峰值', openEp: 1, peakEp: 8, peakLabel: '公开对峙', payoffEp: 8 }],
  links: [{ id: 'L1', handoffId: 'H8-9', cardSlug: 'su-jianqing', peakId: '对峙峰值', ep: 8 }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateHandoffPersonaPeakBridge>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateHandoffPersonaPeakBridge', () => {
  it('handoff + persona + peak @prevEp → PASS', () => {
    const r = evaluateHandoffPersonaPeakBridge(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / EP_NOT_TERNARY / PEAK_WITHOUT_BRIDGE', () => {
    expect(failCodes(evaluateHandoffPersonaPeakBridge({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluateHandoffPersonaPeakBridge(
          pack({
            links: [{ id: 'L1', handoffId: 'H8-9', cardSlug: 'su-jianqing', peakId: '对峙峰值', ep: 9 }],
          }),
        ),
      ),
    ).toContain('EP_NOT_TERNARY');
    expect(failCodes(evaluateHandoffPersonaPeakBridge(pack({ links: [] })))).toContain(
      'PEAK_WITHOUT_BRIDGE',
    );
  });
});
