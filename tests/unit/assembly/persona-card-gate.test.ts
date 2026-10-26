/**
 * V12 Persona-Card Gate — offline character-card integrity
 * (adult · anchors×4 · feature blocks · fiction-no-unknown · wardrobe).
 * Method rewritten (MIT) from huihui308/ai-persona-studio:
 * https://github.com/huihui308/ai-persona-studio
 * ≠Final ≠G3. No image/video gen / MiniMax / paid API.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePersonaCard } from '@/agents/assembly/persona-card-gate';

const failCodes = (r: ReturnType<typeof evaluatePersonaCard>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluatePersonaCard>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

function golden(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'lin-xiaoyu',
    name: '林小雨',
    adult: true,
    age: 24,
    gender: '女',
    resemblance: 'none',
    persona: {
      temperament: '温和、话少、慢热',
      city: '杭州',
    },
    face: {
      faceShape: '偏长的鹅蛋脸，颧骨略平',
      eyeShape: '内双，眼尾微垂，卧蚕浅',
      noseShape: '鼻梁中等高度，鼻头偏圆',
      lips: '上唇薄于下唇，唇峰不明显',
    },
    hair: {
      hairColor: '自然黑，发尾偏棕',
      hairLength: '锁骨下 5cm',
    },
    skin: {
      skinTone: '偏白，微暖调',
    },
    body: {
      heightFeel: '162cm 左右',
      bodyProportion: '七头身',
    },
    ageCues: ['眼下两条浅细纹', '法令纹浅，笑起来才明显'],
    wardrobe: [
      {
        id: 'W1',
        name: '通勤基准套装',
        items: '米白棉麻衬衫、深灰直筒长裤、黑色乐福鞋',
        occasion: '基准服装',
      },
      {
        id: 'W2',
        name: '居家',
        items: '浅灰针织家居服、同色家居裤、白棉袜',
      },
      {
        id: 'W3',
        name: '周末外出',
        items: '燕麦色针织开衫、白色 T 恤、深蓝直筒牛仔裤',
      },
    ],
    anchors: [
      '偏长的鹅蛋脸，颧骨平',
      '内双眼尾微垂',
      '齐刘海锁骨下黑发，中间偏左分线',
      '下颌线清晰但不方',
    ],
    reference: {
      sourcePhoto: 'none',
      sheetImages: ['sheet1.png'],
    },
    notes: '示例虚构角色卡',
    ...overrides,
  };
}

describe('evaluatePersonaCard', () => {
  it('golden fiction card → PASS; gates untouched', () => {
    const r = evaluatePersonaCard(golden());
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
    expect(r.metrics).toMatchObject({
      slug: 'lin-xiaoyu',
      anchors: 4,
      wardrobe: 3,
      ageCues: 2,
    });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('accepts upstream Chinese keys (脸型/发色/单品/age_cues) → PASS', () => {
    const r = evaluatePersonaCard({
      slug: 'lin-xiaoyu',
      name: '林小雨',
      adult: true,
      resemblance: 'none',
      face: {
        脸型: '鹅蛋脸',
        眼型: '内双',
        鼻型: '鼻头偏圆',
        嘴唇: '上薄下厚',
      },
      hair: { 发色: '自然黑', 发长: '锁骨下' },
      skin: { 肤色: '偏白' },
      body: { 身高感: '162cm', 身材比例: '七头身' },
      age_cues: ['眼下浅细纹', '法令纹浅'],
      wardrobe: [
        { id: 'W1', 名称: '通勤', 单品: '米白衬衫、灰裤', 场合: '日常' },
      ],
      anchors: ['鹅蛋脸', '内双', '黑长发齐刘海', '下颌线清晰'],
      reference: { source_photo: 'none', sheet_images: ['a.png'] },
    });
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
  });

  it('schema garbage → SCHEMA FAIL', () => {
    const r = evaluatePersonaCard({ nope: true });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('adult !== true → ADULT_REQUIRED FAIL', () => {
    const r = evaluatePersonaCard(golden({ adult: false }));
    expect(failCodes(r)).toContain('ADULT_REQUIRED');
  });

  it('bad resemblance → RESEMBLANCE_INVALID FAIL', () => {
    const r = evaluatePersonaCard(golden({ resemblance: 'lookalike' }));
    expect(failCodes(r)).toContain('RESEMBLANCE_INVALID');
  });

  it('slug empty or whitespace → SLUG_INVALID FAIL', () => {
    expect(failCodes(evaluatePersonaCard(golden({ slug: '' })))).toContain(
      'SLUG_INVALID',
    );
    expect(failCodes(evaluatePersonaCard(golden({ slug: 'lin xiaoyu' })))).toContain(
      'SLUG_INVALID',
    );
  });

  it('anchors length !== 4 → ANCHORS_COUNT FAIL', () => {
    const r = evaluatePersonaCard(
      golden({ anchors: ['a', 'b', 'c'] }),
    );
    expect(failCodes(r)).toContain('ANCHORS_COUNT');
  });

  it('anchors with empty string → ANCHORS_COUNT FAIL', () => {
    const r = evaluatePersonaCard(
      golden({ anchors: ['a', 'b', 'c', '  '] }),
    );
    expect(failCodes(r)).toContain('ANCHORS_COUNT');
  });

  it('duplicate anchors → ANCHORS_DUP FAIL', () => {
    const r = evaluatePersonaCard(
      golden({ anchors: ['same', 'b', 'c', 'same'] }),
    );
    expect(failCodes(r)).toContain('ANCHORS_DUP');
  });

  it('face missing required key → FACE_INCOMPLETE FAIL', () => {
    const r = evaluatePersonaCard(
      golden({
        face: { faceShape: '鹅蛋', eyeShape: '内双', noseShape: '圆' },
      }),
    );
    expect(failCodes(r)).toContain('FACE_INCOMPLETE');
  });

  it('hair missing color/length → HAIR_INCOMPLETE FAIL', () => {
    const r = evaluatePersonaCard(golden({ hair: { hairColor: '黑' } }));
    expect(failCodes(r)).toContain('HAIR_INCOMPLETE');
  });

  it('skin missing tone → SKIN_INCOMPLETE FAIL', () => {
    const r = evaluatePersonaCard(golden({ skin: { texture: '混合肌' } }));
    expect(failCodes(r)).toContain('SKIN_INCOMPLETE');
  });

  it('body missing height/proportion → BODY_INCOMPLETE FAIL', () => {
    const r = evaluatePersonaCard(golden({ body: { shoulder: '窄肩' } }));
    expect(failCodes(r)).toContain('BODY_INCOMPLETE');
  });

  it('fiction resemblance=none with unknown feature → UNKNOWN_ON_FICTION FAIL', () => {
    const r = evaluatePersonaCard(
      golden({
        resemblance: 'none',
        face: {
          faceShape: '鹅蛋脸',
          eyeShape: '内双',
          noseShape: '圆',
          lips: 'UNKNOWN',
        },
      }),
    );
    expect(failCodes(r)).toContain('UNKNOWN_ON_FICTION');
  });

  it('fiction ageCues literal unknown → UNKNOWN_ON_FICTION FAIL', () => {
    const r = evaluatePersonaCard(
      golden({
        resemblance: 'none',
        ageCues: ['unknown', '法令纹浅'],
      }),
    );
    expect(failCodes(r)).toContain('UNKNOWN_ON_FICTION');
  });

  it('similar may use unknown on unseen parts (no UNKNOWN_ON_FICTION)', () => {
    const r = evaluatePersonaCard(
      golden({
        resemblance: 'similar',
        face: {
          faceShape: '鹅蛋脸',
          eyeShape: '内双',
          noseShape: '圆',
          lips: 'unknown',
        },
        reference: { sourcePhoto: 'refs/front.jpg', sheetImages: ['a.png'] },
      }),
    );
    expect(failCodes(r)).not.toContain('UNKNOWN_ON_FICTION');
  });

  it('empty wardrobe → WARDROBE_EMPTY FAIL', () => {
    const r = evaluatePersonaCard(golden({ wardrobe: [] }));
    expect(failCodes(r)).toContain('WARDROBE_EMPTY');
  });

  it('baseline outfit missing id or items → WARDROBE_BASELINE FAIL', () => {
    const r = evaluatePersonaCard(
      golden({
        wardrobe: [{ id: 'W1', name: '通勤', items: '' }],
      }),
    );
    expect(failCodes(r)).toContain('WARDROBE_BASELINE');
  });

  it('duplicate wardrobe id → WARDROBE_DUP_ID FAIL', () => {
    const r = evaluatePersonaCard(
      golden({
        wardrobe: [
          { id: 'W1', name: 'A', items: '衬衫' },
          { id: 'W1', name: 'B', items: '卫衣' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('WARDROBE_DUP_ID');
  });

  it('empty ageCues → AGE_CUES_EMPTY FAIL', () => {
    const r = evaluatePersonaCard(golden({ ageCues: [] }));
    expect(failCodes(r)).toContain('AGE_CUES_EMPTY');
  });

  it('similar without sourcePhoto → SOURCE_PHOTO_MISSING WARN (still PASS)', () => {
    const r = evaluatePersonaCard(
      golden({
        resemblance: 'similar',
        reference: { sourcePhoto: 'none', sheetImages: ['a.png'] },
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('SOURCE_PHOTO_MISSING');
  });

  it('empty sheetImages → SHEET_IMAGES_EMPTY WARN', () => {
    const r = evaluatePersonaCard(
      golden({ reference: { sourcePhoto: 'none', sheetImages: [] } }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('SHEET_IMAGES_EMPTY');
  });

  it('wardrobe.length < 3 → WARDROBE_THIN WARN', () => {
    const r = evaluatePersonaCard(
      golden({
        wardrobe: [{ id: 'W1', name: '基准', items: '衬衫、裤' }],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('WARDROBE_THIN');
  });

  it('ageCues.length < 2 → AGE_CUES_THIN WARN', () => {
    const r = evaluatePersonaCard(golden({ ageCues: ['眼下浅细纹'] }));
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('AGE_CUES_THIN');
  });
});
