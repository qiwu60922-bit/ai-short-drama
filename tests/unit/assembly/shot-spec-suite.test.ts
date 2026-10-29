/**
 * V12 Shot-Spec Suite — hook / opening-cascade / cut-timeline 旁路总入口.
 * Offline; PASS ≠ Final ≠ G3.
 */
import { describe, expect, it } from 'vitest';
import {
  SHOT_SPEC_GATE_IDS,
  evaluateShotSpecSuite,
} from '@/agents/assembly/shot-spec-suite';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const shotSpec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});

/** 60s: hook@0, mid reversal, cliff at end — passes hook-structure. */
const hookGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: 'crisis open', hookKind: 'situation' },
  { durSec: 4, beatRole: 'setup' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'setup' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'reversal' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'increment' },
  { durSec: 6, beatRole: 'cliffhanger' },
];

/** Cascade: ≥2 cascade roles in first 8s. */
const cascadeGood = (): S[] => [
  { durSec: 2, beatRole: 'hook', action: 'crisis cold open' },
  { durSec: 2, beatRole: 'increment', action: 'identity twist' },
  { durSec: 8, beatRole: 'setup' },
  { durSec: 10, beatRole: 'increment' },
  { durSec: 10, beatRole: 'reversal' },
  { durSec: 10, beatRole: 'increment' },
  { durSec: 10, beatRole: 'increment' },
  { durSec: 8, beatRole: 'cliffhanger' },
];

const cam = { framing: 'WS', angle: 'eye', movement: 'FIX' };
const cut = (id: string, duration_frames: number) => ({
  id,
  duration_frames,
  scene: '广场',
  action: '主角停步抬头',
  camera: cam,
  characters: ['hero'],
  dialogue: '',
  sound: '',
  on_screen_text: '',
  notes: '',
  cues: [],
});
const cutDoc = (cuts: ReturnType<typeof cut>[]) => ({
  version: 1 as const,
  meta: {
    title: '样本',
    style: '线稿分镜',
    fps: 24,
    width: 1280,
    height: 720,
    target_frames: cuts.reduce((s, c) => s + c.duration_frames, 0),
    characters: { hero: '短发夹克旅人' },
  },
  cuts,
});

const failCodes = (r: ReturnType<typeof evaluateShotSpecSuite>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('shot-spec-suite', () => {
  it('lists hookStructure / openingCascade / cutTimeline', () => {
    expect([...SHOT_SPEC_GATE_IDS]).toEqual([
      'hookStructure',
      'openingCascade',
      'cutTimeline',
    ]);
  });

  it('no sections → EMPTY_SUITE FAIL', () => {
    const r = evaluateShotSpecSuite({ episode: 'EP01' });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('EMPTY_SUITE');
    expect(r.metrics).toMatchObject({ ran: 0, skipped: 3 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('bad schema → SCHEMA FAIL', () => {
    const r = evaluateShotSpecSuite({ episode: 1 });
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('unknown key → SCHEMA FAIL (strict)', () => {
    const r = evaluateShotSpecSuite({ episode: 'EP01', notAGate: {} });
    expect(failCodes(r)).toContain('SCHEMA');
  });

  it('hookStructure alone PASS → skipped 2', () => {
    const r = evaluateShotSpecSuite({
      episode: 'EP01',
      hookStructure: shotSpec('EP01', hookGood()),
    });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ ran: 1, passed: 1, failed: 0, skipped: 2 });
    expect(r.results.hookStructure.status).toBe('PASS');
    expect(r.results.openingCascade.status).toBe('SKIP');
    expect(r.results.cutTimeline.status).toBe('SKIP');
  });

  it('three gates PASS', () => {
    const r = evaluateShotSpecSuite({
      episode: 'EP01',
      hookStructure: shotSpec('EP01', hookGood()),
      openingCascade: shotSpec('EP01', cascadeGood()),
      cutTimeline: cutDoc([cut('C001', 48), cut('C002', 48), cut('C003', 48)]),
    });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ ran: 3, passed: 3, failed: 0, skipped: 0 });
    for (const id of SHOT_SPEC_GATE_IDS) {
      expect(r.results[id].status).toBe('PASS');
    }
    expect(r.schema).toBe('v12/ShotSpecSuite/v1');
  });

  it('hook HOOK_LATE → GATE_FAIL bubbles', () => {
    const shots = hookGood();
    shots[0] = { durSec: 10, beatRole: 'setup' };
    shots[1] = { durSec: 4, beatRole: 'hook' };
    shots[10] = { durSec: 2, beatRole: 'cliffhanger' };
    const r = evaluateShotSpecSuite({
      episode: 'EP01',
      hookStructure: shotSpec('EP01', shots),
    });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('GATE_FAIL');
    expect(r.results.hookStructure.status).toBe('FAIL');
    expect(r.metrics.failed).toBe(1);
  });

  it('cutTimeline TOTAL_MISMATCH → GATE_FAIL', () => {
    const doc = cutDoc([cut('C001', 48), cut('C002', 48)]);
    doc.meta.target_frames = 999;
    const r = evaluateShotSpecSuite({ episode: 'EP01', cutTimeline: doc });
    expect(r.verdict).toBe('FAIL');
    expect(r.results.cutTimeline.status).toBe('FAIL');
  });
});
