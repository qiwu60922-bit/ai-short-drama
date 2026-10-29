/**
 * V12 Persona×ColdOpen Link — offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePersonaColdOpenLink } from '@/agents/assembly/persona-cold-open-link-gate';

const shotSpec = {
  episode: 'EP10',
  shots: [
    { shotId: 'EP10-B140-0', durSec: 2, cast: [], beatRole: 'hook', action: '冷开危机·抛钩', hookKind: 'situation' },
    { shotId: 'EP10-B140-1', durSec: 2, cast: [], beatRole: 'reversal', action: '身份反转·加压' },
    { shotId: 'EP10-B140-2', durSec: 3, cast: [], beatRole: 'increment', action: '加压·推进' },
    { shotId: 'EP10-B140-3', durSec: 4, cast: [], beatRole: 'cliffhanger', action: '悬念·收束' },
  ],
};

const card = {
  slug: 'su-jianqing',
  name: '苏见晴',
  adult: true,
  age: 28,
  gender: '女',
  resemblance: 'none' as const,
  anchors: ['偏长的鹅蛋脸，颧骨平', '内双眼尾微垂', '齐刘海锁骨下黑发，中间偏左分线', '下颌线清晰但不方'],
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
    { id: 'W3', name: '晚宴', items: '黑色礼服、细跟鞋' },
  ],
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '盛夏芬德拉',
  latestEp: 10,
  cards: [card],
  coldOpens: [{ id: 'EP10-cold', ep: 10, shotSpec }],
  links: [{ id: 'L1', cardSlug: 'su-jianqing', coldOpenId: 'EP10-cold', ep: 10 }],
  ...extra,
});
const failCodes = (r: ReturnType<typeof evaluatePersonaColdOpenLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluatePersonaColdOpenLink', () => {
  it('persona + coldOpen → PASS', () => {
    const r = evaluatePersonaColdOpenLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
  it('SCHEMA / CARD_WITHOUT_COLD', () => {
    expect(failCodes(evaluatePersonaColdOpenLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluatePersonaColdOpenLink(pack({ links: [] })))).toContain('CARD_WITHOUT_COLD');
  });
});
