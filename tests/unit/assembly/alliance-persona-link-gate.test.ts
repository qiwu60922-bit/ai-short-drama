/**
 * V12 Alliance×Persona Link — 同盟×人设, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAlliancePersonaLink } from '@/agents/assembly/alliance-persona-link-gate';

const card = {
  slug: 'su-jianqing',
  name: '苏见晴',
  adult: true,
  age: 28,
  gender: '女',
  resemblance: 'none' as const,
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
};

const pack = (extra: Record<string, unknown> = {}) => ({
  series: '反派拿捏',
  latestEp: 20,
  alliances: [{ id: 'oni-fang', label: '鬼牙同盟', members: ['chen-haoyu', 'guild'] }],
  events: [
    { allianceId: 'oni-fang', ep: 1, role: 'seed' as const, note: '收留' },
    { allianceId: 'oni-fang', ep: 5, role: 'echo' as const, note: '并肩' },
    { allianceId: 'oni-fang', ep: 10, role: 'payoff' as const, note: '护短' },
  ],
  cards: [card],
  links: [{ id: 'L1', allianceId: 'oni-fang', cardSlug: 'su-jianqing' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAlliancePersonaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAlliancePersonaLink', () => {
  it('payoff alliance linked to card → PASS', () => {
    const r = evaluateAlliancePersonaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / PAYOFF_WITHOUT_PERSONA / UNKNOWN_CARD', () => {
    expect(failCodes(evaluateAlliancePersonaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAlliancePersonaLink(pack({ links: [] })))).toContain(
      'PAYOFF_WITHOUT_PERSONA',
    );
    expect(
      failCodes(
        evaluateAlliancePersonaLink(
          pack({
            links: [{ id: 'L1', allianceId: 'oni-fang', cardSlug: 'missing' }],
          }),
        ),
      ),
    ).toContain('UNKNOWN_CARD');
  });
});
