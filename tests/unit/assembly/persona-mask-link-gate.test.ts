/**
 * V12 Persona×Mask Link — 人设卡 × 伪装人设, offline, ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { evaluatePersonaMaskLink } from '@/agents/assembly/persona-mask-link-gate';

function goldenCard(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'jiang-shao',
    name: '江少',
    adult: true,
    age: 28,
    gender: '男',
    resemblance: 'none',
    face: {
      faceShape: '偏长的鹅蛋脸，颧骨略平',
      eyeShape: '内双，眼尾微垂，卧蚕浅',
      noseShape: '鼻梁中等高度，鼻头偏圆',
      lips: '上唇薄于下唇，唇峰不明显',
    },
    hair: { hairColor: '自然黑，发尾偏棕', hairLength: '耳下 3cm' },
    skin: { skinTone: '偏白，微暖调' },
    body: { heightFeel: '182cm 左右', bodyProportion: '七头身' },
    ageCues: ['眼下两条浅细纹', '法令纹浅，笑起来才明显'],
    wardrobe: [
      { id: 'W1', name: '通勤', items: '白衬衫、深灰长裤、黑色皮鞋', occasion: '基准服装' },
      { id: 'W2', name: '派对', items: '深色西装、松开领带', occasion: '花心人设维持' },
      { id: 'W3', name: '重逢', items: '深色大衣、素色围巾', occasion: '真心崩塌前' },
    ],
    anchors: [
      '偏长的鹅蛋脸，颧骨平',
      '内双眼尾微垂',
      '短发偏左分线',
      '下颌线清晰',
    ],
    reference: { sourcePhoto: 'none', sheetImages: ['sheet1.png'] },
    notes: '花心人设；真心崩塌后外形不变',
    ...overrides,
  };
}

const maskOk = {
  id: '花心人设',
  wearer: '江少',
  label: '花心纨绔',
  plantEp: 1,
  maintainEps: [3, 5, 8],
  revealEp: 12,
  revealLabel: '真心崩塌',
};

const pack = (
  extra: {
    cards?: Array<Record<string, unknown>>;
    masks?: Array<Record<string, unknown>>;
    links?: Array<Record<string, unknown>>;
    latestEp?: number;
  } = {},
) => ({
  series: '逃婚三年',
  latestEp: extra.latestEp ?? 20,
  cards: extra.cards ?? [goldenCard()],
  masks: extra.masks ?? [maskOk],
  links: extra.links ?? [{ id: 'L1', cardSlug: 'jiang-shao', maskId: '花心人设' }],
});

const failCodes = (r: ReturnType<typeof evaluatePersonaMaskLink>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluatePersonaMaskLink>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

describe('evaluatePersonaMaskLink', () => {
  it('card.name = mask.wearer + revealed → PASS', () => {
    const r = evaluatePersonaMaskLink(pack());
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ links: 1, aligned: 1, pending: 0 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
    expect(failCodes(r)).toEqual([]);
  });

  it('SCHEMA / DUP / UNKNOWN', () => {
    expect(failCodes(evaluatePersonaMaskLink({ series: 'T' }))).toContain('SCHEMA');
    expect(
      failCodes(
        evaluatePersonaMaskLink(
          pack({
            links: [
              { id: 'd', cardSlug: 'jiang-shao', maskId: '花心人设' },
              { id: 'd', cardSlug: 'jiang-shao', maskId: '花心人设' },
            ],
          }),
        ),
      ),
    ).toContain('DUP_ID');
    const r = evaluatePersonaMaskLink(
      pack({
        links: [
          { id: 'a', cardSlug: 'ghost', maskId: '花心人设' },
          { id: 'b', cardSlug: 'jiang-shao', maskId: 'ghost' },
        ],
      }),
    );
    expect(failCodes(r)).toEqual(expect.arrayContaining(['UNKNOWN_CARD', 'UNKNOWN_MASK']));
  });

  it('wearer ≠ card.name → WEARER_MISMATCH', () => {
    const r = evaluatePersonaMaskLink(
      pack({ masks: [{ ...maskOk, wearer: '别人' }] }),
    );
    expect(failCodes(r)).toContain('WEARER_MISMATCH');
  });

  it('unrevealed → PENDING_PAIR WARN still PASS', () => {
    const { revealEp: _r, revealLabel: _l, ...pending } = maskOk as typeof maskOk & {
      revealEp?: number;
      revealLabel?: string;
    };
    const r = evaluatePersonaMaskLink(
      pack({ masks: [pending], latestEp: 8 }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('PENDING_PAIR');
    expect(r.metrics.pending).toBe(1);
  });
});
