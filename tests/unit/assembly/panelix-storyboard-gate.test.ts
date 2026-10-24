/**
 * V12 Panelix Storyboard Gate — offline novel→storyboard package completeness
 * (beats · panels · character sheets · WS/MS/CU · action · continuity WARN).
 * Method rewritten (MIT) from zjzforfb-jpg/panelix:
 * https://github.com/zjzforfb-jpg/panelix
 * ≠Final ≠G3. No Gemini / Seedance / paid API.
 */
import { describe, expect, it } from 'vitest';
import {
  evaluatePanelixStoryboard,
  PANELIX_STORYBOARD_DEFAULTS,
} from '@/agents/assembly/panelix-storyboard-gate';

const failCodes = (r: ReturnType<typeof evaluatePanelixStoryboard>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluatePanelixStoryboard>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

function goldenPanel(overrides: Record<string, unknown> = {}) {
  return {
    id: 'P01',
    beatId: 'beat_1',
    shotType: 'WS',
    framing: '居中偏下，留天空',
    action: '战神孤身站立，四周雷霆肆虐',
    dialogue: null,
    characterIds: ['char_zhangshen'],
    continuityNote: 'cold open — no prior handoff',
    expression: '坚毅',
    visual: '广角俯视 战神立于破碎仙宫',
    ...overrides,
  };
}

function golden(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '0.1',
    projectId: 'demo-xiangong',
    beats: [
      { id: 'beat_1', summary: '开场立威：战神现身破碎仙宫', hookType: 'Action' },
      { id: 'beat_2', summary: '怒吼点名北冥幽', hookType: 'Revenge' },
      { id: 'beat_3', summary: '结印按向虚空·空间裂', hookType: 'Suspense' },
    ],
    characters: [
      { id: 'char_zhangshen', name: '战神', description: '浴血披风' },
      { id: 'char_beiming', name: '北冥幽' },
    ],
    panels: [
      goldenPanel(),
      goldenPanel({
        id: 'P02',
        beatId: 'beat_2',
        shotType: 'MS',
        framing: '三分法偏左',
        action: '仰天咆哮，身后炸开金色残魂虚影',
        dialogue: '北冥幽！你安敢如此对我！',
        characterIds: ['char_zhangshen'],
        continuityNote: '承接 P01 立威，切中景怒吼',
        expression: '暴怒',
      }),
      goldenPanel({
        id: 'P03',
        beatId: 'beat_3',
        shotType: 'CU',
        framing: '居中，聚焦双手',
        action: '双手结印，猛然向虚空按去',
        dialogue: '',
        characterIds: ['char_zhangshen'],
        continuityNote: '承接怒吼余韵，落点特写结印',
        expression: '专注',
      }),
    ],
    ...overrides,
  };
}

describe('evaluatePanelixStoryboard', () => {
  it('exposes defaults: panels 3–36, maxCharsPerPanel=2, WS|MS|CU', () => {
    expect(PANELIX_STORYBOARD_DEFAULTS).toEqual({
      minPanels: 3,
      maxPanels: 36,
      maxCharsPerPanel: 2,
      allowedShotTypes: ['WS', 'MS', 'CU'],
    });
  });

  it('golden three-panel Ki-Sho-Ketsu package → PASS; gates untouched', () => {
    const r = evaluatePanelixStoryboard(golden());
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
    expect(r.metrics).toMatchObject({
      projectId: 'demo-xiangong',
      beats: 3,
      characters: 2,
      panels: 3,
    });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('schema garbage → SCHEMA FAIL', () => {
    for (const bad of [
      null,
      undefined,
      {},
      { schemaVersion: '0.1' },
      { schemaVersion: 'x', projectId: 'p', beats: [], characters: [], panels: [] },
    ]) {
      const r = evaluatePanelixStoryboard(bad);
      expect(r.verdict).toBe('FAIL');
      expect(failCodes(r)).toContain('SCHEMA');
    }
  });

  it('duplicate beat / character / panel ids → DUP FAIL', () => {
    const beatDup = evaluatePanelixStoryboard(
      golden({
        beats: [
          { id: 'beat_1', summary: 'a' },
          { id: 'beat_1', summary: 'b' },
          { id: 'beat_3', summary: 'c' },
        ],
      }),
    );
    expect(failCodes(beatDup)).toContain('BEAT_DUP_ID');

    const charDup = evaluatePanelixStoryboard(
      golden({
        characters: [
          { id: 'char_zhangshen', name: 'A' },
          { id: 'char_zhangshen', name: 'B' },
        ],
      }),
    );
    expect(failCodes(charDup)).toContain('CHAR_DUP_ID');

    const panelDup = evaluatePanelixStoryboard(
      golden({
        panels: [
          goldenPanel({ id: 'P01' }),
          goldenPanel({ id: 'P01', beatId: 'beat_2' }),
          goldenPanel({ id: 'P03', beatId: 'beat_3' }),
        ],
      }),
    );
    expect(failCodes(panelDup)).toContain('PANEL_DUP_ID');
  });

  it('orphan panel → ORPHAN_PANEL FAIL', () => {
    const r = evaluatePanelixStoryboard(
      golden({
        panels: [
          goldenPanel({ id: 'P01' }),
          goldenPanel({ id: 'P02', beatId: 'beat_2' }),
          goldenPanel({ id: 'P99', beatId: 'missing_beat' }),
        ],
      }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('ORPHAN_PANEL');
  });

  it('beat with zero panels → BEAT_NO_PANEL FAIL', () => {
    const r = evaluatePanelixStoryboard(
      golden({
        panels: [
          goldenPanel({ id: 'P01', beatId: 'beat_1' }),
          goldenPanel({ id: 'P02', beatId: 'beat_1', shotType: 'MS' }),
          goldenPanel({ id: 'P03', beatId: 'beat_2', shotType: 'CU' }),
        ],
      }),
    );
    expect(failCodes(r)).toContain('BEAT_NO_PANEL');
    expect(r.findings.some((f) => f.code === 'BEAT_NO_PANEL' && f.beatId === 'beat_3')).toBe(
      true,
    );
  });

  it('unknown character id → CHAR_UNKNOWN FAIL', () => {
    const r = evaluatePanelixStoryboard(
      golden({
        panels: [
          goldenPanel({ characterIds: ['char_ghost'] }),
          goldenPanel({ id: 'P02', beatId: 'beat_2' }),
          goldenPanel({ id: 'P03', beatId: 'beat_3', shotType: 'CU' }),
        ],
      }),
    );
    expect(failCodes(r)).toContain('CHAR_UNKNOWN');
  });

  it('empty action → ACTION_EMPTY FAIL', () => {
    const r = evaluatePanelixStoryboard(
      golden({
        panels: [
          goldenPanel({ action: '   ' }),
          goldenPanel({ id: 'P02', beatId: 'beat_2' }),
          goldenPanel({ id: 'P03', beatId: 'beat_3', shotType: 'CU' }),
        ],
      }),
    );
    expect(failCodes(r)).toContain('ACTION_EMPTY');
  });

  it('invalid shotType → SHOT_TYPE FAIL', () => {
    const r = evaluatePanelixStoryboard(
      golden({
        panels: [
          goldenPanel({ shotType: 'OTS' }),
          goldenPanel({ id: 'P02', beatId: 'beat_2' }),
          goldenPanel({ id: 'P03', beatId: 'beat_3', shotType: 'CU' }),
        ],
      }),
    );
    expect(failCodes(r)).toContain('SHOT_TYPE');
  });

  it('panel count below min → PANEL_COUNT FAIL', () => {
    const r = evaluatePanelixStoryboard(
      golden({
        beats: [{ id: 'beat_1', summary: 'only one' }],
        panels: [goldenPanel()],
      }),
    );
    expect(failCodes(r)).toContain('PANEL_COUNT');
  });

  it('panel count above max → PANEL_COUNT FAIL', () => {
    const panels = Array.from({ length: 37 }, (_, i) =>
      goldenPanel({
        id: `P${String(i + 1).padStart(2, '0')}`,
        beatId: 'beat_1',
        shotType: i % 3 === 0 ? 'WS' : i % 3 === 1 ? 'MS' : 'CU',
      }),
    );
    const r = evaluatePanelixStoryboard(
      golden({
        beats: [{ id: 'beat_1', summary: 'packed' }],
        panels,
      }),
    );
    expect(failCodes(r)).toContain('PANEL_COUNT');
  });

  it('missing continuity / expression → WARN only, still PASS', () => {
    const r = evaluatePanelixStoryboard(
      golden({
        panels: [
          goldenPanel({ continuityNote: undefined, expression: undefined }),
          goldenPanel({
            id: 'P02',
            beatId: 'beat_2',
            continuityNote: undefined,
            expression: '怒',
          }),
          goldenPanel({
            id: 'P03',
            beatId: 'beat_3',
            shotType: 'CU',
            continuityNote: 'ok',
            expression: undefined,
          }),
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toEqual(
      expect.arrayContaining(['CONTINUITY_MISSING', 'EXPRESSION_MISSING']),
    );
  });

  it('>2 characters on a panel → CHAR_OVERFLOW WARN, still PASS', () => {
    const r = evaluatePanelixStoryboard(
      golden({
        characters: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
          { id: 'c', name: 'C' },
        ],
        panels: [
          goldenPanel({ characterIds: ['a', 'b', 'c'] }),
          goldenPanel({ id: 'P02', beatId: 'beat_2', characterIds: ['a'] }),
          goldenPanel({
            id: 'P03',
            beatId: 'beat_3',
            shotType: 'CU',
            characterIds: ['a'],
          }),
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('CHAR_OVERFLOW');
  });

  it('dialogue may be null, empty string, or omitted (dialogue-or-none)', () => {
    const r = evaluatePanelixStoryboard(
      golden({
        panels: [
          goldenPanel({ dialogue: null }),
          goldenPanel({ id: 'P02', beatId: 'beat_2', dialogue: '' }),
          (() => {
            const p = goldenPanel({
              id: 'P03',
              beatId: 'beat_3',
              shotType: 'CU',
            }) as Record<string, unknown>;
            delete p.dialogue;
            return p;
          })(),
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
  });

  it('options can widen allowedShotTypes and panel bounds', () => {
    const r = evaluatePanelixStoryboard(
      golden({
        beats: [{ id: 'beat_1', summary: 'ots ok' }],
        panels: [goldenPanel({ shotType: 'OTS' }), goldenPanel({ id: 'P02', shotType: 'POV' })],
      }),
      {
        minPanels: 2,
        maxPanels: 10,
        allowedShotTypes: ['WS', 'MS', 'CU', 'OTS', 'POV'],
      },
    );
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).not.toContain('SHOT_TYPE');
    expect(failCodes(r)).not.toContain('PANEL_COUNT');
  });
});
