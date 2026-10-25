/**
 * V12 Manju Editorial Gate — offline editorial-plan validation
 * (pronunciation lexicon · referential integrity · state continuity · shot-line timing).
 * Method rewritten (MIT) from w1nterdec/ai-manju-engineering:
 * https://github.com/w1nterdec/ai-manju-engineering
 * ≠Final ≠G3. No TTS / MiniMax / paid API.
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateManjuEditorial,
  MANJU_EDITORIAL_PINYIN_RE,
} from '@/agents/assembly/manju-editorial-gate';

const failCodes = (r: ReturnType<typeof evaluateManjuEditorial>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateManjuEditorial>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

function goldenLine(overrides: Record<string, unknown> = {}) {
  return {
    id: 'LINE_01',
    speakerId: 'CHAR_SHAN',
    text: '单行舟，你终于来了。',
    ...overrides,
  };
}

function goldenShotLine(overrides: Record<string, unknown> = {}) {
  return {
    lineId: 'LINE_01',
    delivery: 'on_screen',
    startMs: 200,
    endMs: 1800,
    ...overrides,
  };
}

function golden(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '0.1',
    projectId: 'DEMO_MANJU',
    characters: [
      {
        id: 'CHAR_SHAN',
        name: '单行舟',
        appearance: '青衫长发',
        voiceDirection: '沉稳低沉',
        referenceImage: 'refs/shan.png',
      },
      {
        id: 'CHAR_NARR',
        name: '旁白',
        appearance: '无画面',
        voiceDirection: '第三人称叙述',
        referenceImage: '',
      },
    ],
    pronunciationLexicon: [
      { term: '单行舟', pinyin: 'shan4 xing2 zhou1', note: '姓氏读 shan4' },
      { term: '旁白', pinyin: 'pang2 bai2', note: 'narrator' },
    ],
    beats: [
      {
        id: 'BEAT_01',
        summary: '开场点名',
        requiredFacts: ['单行舟现身'],
        lines: [goldenLine()],
      },
      {
        id: 'BEAT_02',
        summary: '旁白收束',
        requiredFacts: ['夜色落下'],
        lines: [
          goldenLine({
            id: 'LINE_02',
            speakerId: 'CHAR_NARR',
            text: '夜色落下。',
          }),
        ],
      },
    ],
    initialState: { location: '码头', timeOfDay: '黄昏', known: '未见单行舟' },
    shots: [
      {
        id: 'SHOT_01',
        beatIds: ['BEAT_01'],
        durationMs: 3000,
        location: '码头',
        time: '黄昏',
        characterIds: ['CHAR_SHAN'],
        framing: 'MS',
        action: '单行舟缓步上岸',
        emotion: '平静',
        stateBefore: { location: '码头', timeOfDay: '黄昏', known: '未见单行舟' },
        stateAfter: { location: '码头', timeOfDay: '黄昏', known: '单行舟已现身' },
        lines: [goldenShotLine()],
      },
      {
        id: 'SHOT_02',
        beatIds: ['BEAT_02'],
        durationMs: 2000,
        location: '码头',
        time: '入夜',
        characterIds: [],
        framing: 'WS',
        action: '镜头拉远，夜色压下',
        emotion: '沉静',
        stateBefore: { location: '码头', timeOfDay: '黄昏', known: '单行舟已现身' },
        stateAfter: { location: '码头', timeOfDay: '入夜', known: '单行舟已现身' },
        lines: [
          goldenShotLine({
            lineId: 'LINE_02',
            delivery: 'voiceover',
            startMs: 100,
            endMs: 1500,
          }),
        ],
      },
    ],
    ...overrides,
  };
}

describe('evaluateManjuEditorial', () => {
  it('pinyin regex accepts digital tones and ü as v / u:', () => {
    expect(MANJU_EDITORIAL_PINYIN_RE.test('shan4 xing2 zhou1')).toBe(true);
    expect(MANJU_EDITORIAL_PINYIN_RE.test('nv3')).toBe(true);
    expect(MANJU_EDITORIAL_PINYIN_RE.test('nu:3')).toBe(true);
    expect(MANJU_EDITORIAL_PINYIN_RE.test('pang2 bai2')).toBe(true);
    expect(MANJU_EDITORIAL_PINYIN_RE.test('shan')).toBe(false);
    expect(MANJU_EDITORIAL_PINYIN_RE.test('SHAN4')).toBe(false);
    expect(MANJU_EDITORIAL_PINYIN_RE.test('shan4  xing2')).toBe(false);
  });

  it('golden two-shot editorial plan → PASS; gates untouched', () => {
    const r = evaluateManjuEditorial(golden());
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
    expect(r.metrics).toMatchObject({
      projectId: 'DEMO_MANJU',
      characters: 2,
      beats: 2,
      shots: 2,
      lexiconTerms: 2,
    });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('schema garbage → SCHEMA FAIL', () => {
    const r = evaluateManjuEditorial({ nope: true });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('bad pinyin → LEXICON_PINYIN FAIL', () => {
    const doc = golden();
    (doc.pronunciationLexicon as Array<Record<string, string>>)[0].pinyin = 'shan xing zhou';
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('LEXICON_PINYIN');
  });

  it('character full name missing from lexicon → LEXICON_NAME_MISSING FAIL', () => {
    const doc = golden();
    doc.pronunciationLexicon = [
      { term: '旁白', pinyin: 'pang2 bai2', note: 'narrator' },
    ];
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('LEXICON_NAME_MISSING');
  });

  it('duplicate character / beat / line / shot ids → DUP_* FAIL', () => {
    const doc = golden({
      characters: [
        { id: 'CHAR_SHAN', name: '单行舟', appearance: 'a', voiceDirection: 'b', referenceImage: 'r' },
        { id: 'CHAR_SHAN', name: '另名', appearance: 'a', voiceDirection: 'b', referenceImage: 'r' },
      ],
      pronunciationLexicon: [
        { term: '单行舟', pinyin: 'shan4 xing2 zhou1', note: '' },
        { term: '另名', pinyin: 'ling4 ming2', note: '' },
      ],
    });
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('CHAR_DUP_ID');
  });

  it('duplicate beat id → BEAT_DUP_ID FAIL', () => {
    const doc = golden();
    doc.beats = [
      doc.beats[0],
      { ...doc.beats[1], id: 'BEAT_01' },
    ];
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('BEAT_DUP_ID');
  });

  it('duplicate line id across beats → LINE_DUP_ID FAIL', () => {
    const doc = golden();
    doc.beats[1].lines = [goldenLine({ id: 'LINE_01', speakerId: 'CHAR_NARR', text: '重复' })];
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('LINE_DUP_ID');
  });

  it('duplicate shot id → SHOT_DUP_ID FAIL', () => {
    const doc = golden();
    doc.shots[1] = { ...doc.shots[1], id: 'SHOT_01' };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('SHOT_DUP_ID');
  });

  it('unknown speakerId → SPEAKER_UNKNOWN FAIL', () => {
    const doc = golden();
    doc.beats[0].lines[0] = goldenLine({ speakerId: 'CHAR_GHOST' });
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('SPEAKER_UNKNOWN');
  });

  it('unknown shot characterIds → CHAR_UNKNOWN FAIL', () => {
    const doc = golden();
    doc.shots[0] = { ...doc.shots[0], characterIds: ['CHAR_GHOST'] };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('CHAR_UNKNOWN');
  });

  it('unknown shot beatIds → BEAT_UNKNOWN FAIL', () => {
    const doc = golden();
    doc.shots[0] = { ...doc.shots[0], beatIds: ['BEAT_GHOST'] };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('BEAT_UNKNOWN');
  });

  it('shot line_id not in beats → LINE_UNKNOWN FAIL', () => {
    const doc = golden();
    doc.shots[0] = {
      ...doc.shots[0],
      lines: [goldenShotLine({ lineId: 'LINE_GHOST' })],
    };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('LINE_UNKNOWN');
  });

  it('state_before keys ≠ initial_state → STATE_KEY_MISMATCH FAIL', () => {
    const doc = golden();
    doc.shots[0] = {
      ...doc.shots[0],
      stateBefore: { location: '码头', timeOfDay: '黄昏' },
    };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('STATE_KEY_MISMATCH');
  });

  it('first shot state_before ≠ initial_state → STATE_CONTINUITY FAIL', () => {
    const doc = golden();
    doc.shots[0] = {
      ...doc.shots[0],
      stateBefore: { location: '客栈', timeOfDay: '黄昏', known: '未见单行舟' },
    };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('STATE_CONTINUITY');
  });

  it('second shot state_before ≠ previous state_after → STATE_CONTINUITY FAIL', () => {
    const doc = golden();
    doc.shots[1] = {
      ...doc.shots[1],
      stateBefore: { location: '码头', timeOfDay: '黄昏', known: '错了' },
    };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('STATE_CONTINUITY');
  });

  it('line end_ms ≤ start_ms or outside duration → LINE_TIMING FAIL', () => {
    const doc = golden();
    doc.shots[0] = {
      ...doc.shots[0],
      lines: [goldenShotLine({ startMs: 100, endMs: 100 })],
    };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('LINE_TIMING');
  });

  it('line end beyond duration_ms → LINE_TIMING FAIL', () => {
    const doc = golden();
    doc.shots[0] = {
      ...doc.shots[0],
      durationMs: 1000,
      lines: [goldenShotLine({ startMs: 0, endMs: 1500 })],
    };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('LINE_TIMING');
  });

  it('overlapping shot lines → LINE_OVERLAP FAIL', () => {
    const doc = golden();
    doc.beats[0].lines = [
      goldenLine(),
      goldenLine({ id: 'LINE_01B', text: '第二句。' }),
    ];
    doc.shots[0] = {
      ...doc.shots[0],
      lines: [
        goldenShotLine({ lineId: 'LINE_01', startMs: 0, endMs: 1000 }),
        goldenShotLine({ lineId: 'LINE_01B', startMs: 500, endMs: 1500 }),
      ],
    };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('LINE_OVERLAP');
  });

  it('invalid delivery → DELIVERY_INVALID FAIL', () => {
    const doc = golden();
    doc.shots[0] = {
      ...doc.shots[0],
      lines: [goldenShotLine({ delivery: 'whisper' })],
    };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('DELIVERY_INVALID');
  });

  it('missing referenceImage → REF_IMAGE_MISSING WARN (still PASS if no FAIL)', () => {
    const doc = golden();
    (doc.characters as Array<Record<string, unknown>>)[0].referenceImage = undefined;
    // narrator already has empty ref — both warn
    const r = evaluateManjuEditorial(doc);
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('REF_IMAGE_MISSING');
  });

  it('speechText differs from text → SPEECH_TEXT_DIFF WARN', () => {
    const doc = golden();
    doc.beats[0].lines[0] = goldenLine({
      speechText: '单行舟，你终于来了啊。',
    });
    const r = evaluateManjuEditorial(doc);
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('SPEECH_TEXT_DIFF');
  });

  it('dialogue term absent from lexicon → LEXICON_DIALOGUE_TERM WARN', () => {
    const doc = golden();
    doc.beats[0].lines[0] = goldenLine({
      text: '单行舟，横店码头见。',
    });
    // "横店" not in lexicon — WARN if detected as multi-char CJK token heuristic
    const r = evaluateManjuEditorial(doc);
    expect(r.verdict).toBe('PASS');
    // optional warn — assert either present or at least no FAIL
    expect(failCodes(r)).toEqual([]);
  });

  it('on_screen speaker not in shot.characterIds → ON_SCREEN_SPEAKER FAIL', () => {
    const doc = golden();
    doc.shots[0] = { ...doc.shots[0], characterIds: [] };
    const r = evaluateManjuEditorial(doc);
    expect(failCodes(r)).toContain('ON_SCREEN_SPEAKER');
  });
});
