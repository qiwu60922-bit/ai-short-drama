/**
 * V12 Keyframe Plate Gate — H3 分段用关键帧板(FL2VA)而非末帧链式衔接.
 * Offline, deterministic, ≠Final ≠G3.
 * Method adapted (rewritten, no media vendored) from MIT stealbmin/h3-keyframe-plate-sequence:
 * https://github.com/stealbmin/h3-keyframe-plate-sequence
 * (code LICENSE MIT; examples/media under LICENSE-CONTENT CC BY-NC — not copied)
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateKeyframePlate,
  KEYFRAME_PLATE_DEFAULTS,
} from '@/agents/assembly/keyframe-plate-gate';

const failCodes = (r: ReturnType<typeof evaluateKeyframePlate>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateKeyframePlate>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

function golden(overrides: Record<string, unknown> = {}) {
  return {
    sceneId: 'cottage-fire',
    roomLockId: 'room-empty',
    characterCount: 1,
    plates: [
      { id: 'P0', index: 0, roomLockId: 'room-empty' },
      { id: 'P1', index: 1, roomLockId: 'room-empty' },
      { id: 'P2', index: 2, roomLockId: 'room-empty' },
      { id: 'P3', index: 3, roomLockId: 'room-empty' },
    ],
    clips: [
      {
        id: 'c1',
        firstPlateId: 'P0',
        lastPlateId: 'P1',
        mode: 'fl2va',
        prompt: 'Old man warms hands then sits on bench. Camera locked.',
      },
      {
        id: 'c2',
        firstPlateId: 'P1',
        lastPlateId: 'P2',
        mode: 'fl2va',
        prompt: 'Old man leans forward into the fire. Camera locked.',
      },
      {
        id: 'c3',
        firstPlateId: 'P2',
        lastPlateId: 'P3',
        mode: 'fl2va',
        prompt: 'Old man stands and turns to camera. Camera locked.',
      },
    ],
    ...overrides,
  };
}

describe('evaluateKeyframePlate', () => {
  it('exposes defaults: minPlates=2, minClips=1', () => {
    expect(KEYFRAME_PLATE_DEFAULTS).toEqual({ minPlates: 2, minClips: 1 });
  });

  it('golden 4 plates / 3 FL2VA clips with shared joins → PASS; gates untouched', () => {
    const r = evaluateKeyframePlate(golden());
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.metrics).toMatchObject({
      plates: 4,
      clips: 3,
      joins: 2,
      characterCount: 1,
    });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('schema garbage → SCHEMA FAIL', () => {
    for (const bad of [null, undefined, {}, { sceneId: 'x' }, { sceneId: 'x', plates: [], clips: [] }]) {
      const r = evaluateKeyframePlate(bad);
      expect(r.verdict).toBe('FAIL');
      expect(failCodes(r)).toContain('SCHEMA');
    }
  });

  it('fewer than 2 plates → PLATE_MIN FAIL', () => {
    const r = evaluateKeyframePlate(
      golden({
        plates: [{ id: 'P0', index: 0, roomLockId: 'room-empty' }],
        clips: [
          {
            id: 'c1',
            firstPlateId: 'P0',
            lastPlateId: 'P0',
            mode: 'fl2va',
            prompt: 'x',
          },
        ],
      }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('PLATE_MIN');
  });

  it('clip.mode=chain (generated-last-frame chaining) → CHAIN_MODE FAIL', () => {
    const doc = golden();
    (doc.clips as Array<Record<string, unknown>>)[1].mode = 'chain';
    const r = evaluateKeyframePlate(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('CHAIN_MODE');
  });

  it('neighbouring clips do not share join plate → JOIN_BREAK FAIL', () => {
    const doc = golden();
    (doc.clips as Array<Record<string, unknown>>)[1].firstPlateId = 'P0'; // should be P1
    const r = evaluateKeyframePlate(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('JOIN_BREAK');
  });

  it('plate roomLockId mismatches scene → ROOM_LOCK_MISMATCH FAIL', () => {
    const doc = golden();
    (doc.plates as Array<Record<string, unknown>>)[2].roomLockId = 'other-room';
    const r = evaluateKeyframePlate(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('ROOM_LOCK_MISMATCH');
  });

  it('unknown plate id on clip → PLATE_UNKNOWN FAIL', () => {
    const doc = golden();
    (doc.clips as Array<Record<string, unknown>>)[0].lastPlateId = 'PX';
    const r = evaluateKeyframePlate(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('PLATE_UNKNOWN');
  });

  it('first plate index >= last plate index → PLATE_ORDER FAIL', () => {
    const doc = golden({
      clips: [
        {
          id: 'c1',
          firstPlateId: 'P2',
          lastPlateId: 'P1',
          mode: 'fl2va',
          prompt: 'backwards',
        },
      ],
    });
    const r = evaluateKeyframePlate(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('PLATE_ORDER');
  });

  it('same first/last plate → SAME_PLATE FAIL', () => {
    const doc = golden({
      clips: [
        {
          id: 'c1',
          firstPlateId: 'P1',
          lastPlateId: 'P1',
          mode: 'fl2va',
          prompt: 'no motion',
        },
      ],
    });
    const r = evaluateKeyframePlate(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('SAME_PLATE');
  });

  it('empty prompt → PROMPT_MISSING FAIL', () => {
    const doc = golden();
    (doc.clips as Array<Record<string, unknown>>)[0].prompt = '   ';
    const r = evaluateKeyframePlate(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('PROMPT_MISSING');
  });

  it('characterCount≥2 without continuousShotLine → CONT_SHOT_LINE WARN (still PASS)', () => {
    const r = evaluateKeyframePlate(
      golden({
        characterCount: 2,
        clips: [
          {
            id: 'c1',
            firstPlateId: 'P0',
            lastPlateId: 'P1',
            mode: 'fl2va',
            prompt: 'Two people by the fire. Camera locked.',
          },
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('CONT_SHOT_LINE');
    expect(failCodes(r)).toEqual([]);
  });

  it('characterCount≥2 with continuousShotLine=true → no CONT_SHOT_LINE warn', () => {
    const r = evaluateKeyframePlate(
      golden({
        characterCount: 2,
        clips: [
          {
            id: 'c1',
            firstPlateId: 'P0',
            lastPlateId: 'P1',
            mode: 'fl2va',
            prompt: 'Two people. One continuous unbroken shot.',
            continuousShotLine: true,
          },
        ],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).not.toContain('CONT_SHOT_LINE');
  });

  it('duplicate plate id → DUP_PLATE FAIL', () => {
    const r = evaluateKeyframePlate(
      golden({
        plates: [
          { id: 'P0', index: 0, roomLockId: 'room-empty' },
          { id: 'P0', index: 1, roomLockId: 'room-empty' },
        ],
        clips: [
          {
            id: 'c1',
            firstPlateId: 'P0',
            lastPlateId: 'P0',
            mode: 'fl2va',
            prompt: 'x',
          },
        ],
      }),
    );
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('DUP_PLATE');
  });
});
