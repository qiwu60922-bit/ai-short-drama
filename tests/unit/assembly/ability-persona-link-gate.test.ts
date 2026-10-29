/**
 * V12 Ability×Persona Link — 金手指×人设, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluateAbilityPersonaLink } from '@/agents/assembly/ability-persona-link-gate';

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
  series: '伪人降临',
  latestEp: 20,
  abilities: [{
    id: 'seer',
    holder: 'linyang',
    acquiredEp: 1,
    exclusive: true,
    rule: { cycle: 'day' as const, maxUsesPerCycle: 1, options: ['查验身份', '生存情报'] },
  }],
  uses: [
    { abilityId: 'seer', by: 'linyang', ep: 1, day: 1, option: '查验身份' },
    { abilityId: 'seer', by: 'linyang', ep: 2, day: 2, option: '生存情报' },
  ],
  cards: [card],
  links: [{ id: 'L1', abilityId: 'seer', cardSlug: 'su-jianqing' }],
  ...extra,
});

const failCodes = (r: ReturnType<typeof evaluateAbilityPersonaLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('evaluateAbilityPersonaLink', () => {
  it('ability linked to card → PASS', () => {
    const r = evaluateAbilityPersonaLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.aligned).toBe(1);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA / ABILITY_WITHOUT_PERSONA / UNKNOWN_CARD', () => {
    expect(failCodes(evaluateAbilityPersonaLink({ series: 'T' }))).toContain('SCHEMA');
    expect(failCodes(evaluateAbilityPersonaLink(pack({ links: [] })))).toContain(
      'ABILITY_WITHOUT_PERSONA',
    );
    expect(
      failCodes(
        evaluateAbilityPersonaLink(
          pack({
            links: [{ id: 'L1', abilityId: 'seer', cardSlug: 'missing' }],
          }),
        ),
      ),
    ).toContain('UNKNOWN_CARD');
  });
});
