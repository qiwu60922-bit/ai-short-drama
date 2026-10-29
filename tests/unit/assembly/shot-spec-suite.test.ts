/**
 * V12 Shot-Spec Suite — hook/cascade/cut + contract/prompt/rhythm/mv 旁路总入口.
 * Offline; PASS ≠ Final ≠ G3. Includes ep01-rehearsal shotSpecGate wiring.
 */
import { describe, expect, it } from 'vitest';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  SHOT_SPEC_GATE_IDS,
  evaluateShotSpecSuite,
} from '@/agents/assembly/shot-spec-suite';
import { runEp01Rehearsal } from '@/agents/assembly/ep01-rehearsal';

type S = { durSec: number; beatRole?: string; action?: string; hookKind?: string };
const shotSpec = (episode: string, shots: S[]) => ({
  episode,
  shots: shots.map((s, i) => ({ shotId: `${episode}-S${i}`, cast: [], ...s })),
});

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

const contractGolden = () => ({
  schemaVersion: '0.1',
  projectId: 'demo-corridor',
  shots: [
    {
      id: 'S01',
      startSec: 0,
      durationSec: 5,
      purpose: 'Establish that B is waiting and has already decided to confront A.',
      ruleRefs: ['LOW-1'],
      characters: ['B'],
      content:
        '00:00-00:02 B walks toward camera from the far end of the corridor. 00:02-00:05 B stops, chin lifts.',
      spatial: {
        axis: ['B', 'door'],
        move: 'static',
        motivation: "B's walk supplies the approach; camera stays put.",
      },
      negative: ['no text invented on the walls', 'feet stay on the floor'],
    },
  ],
});

type PromptS = Record<string, unknown> & { durSec: number };
const promptFull = (extra: Partial<PromptS> = {}): PromptS => ({
  durSec: 6,
  camera: 'MS 主角左后方腰高，缓推',
  action: '祁夜推开门',
  emotion: '警惕→震惊',
  visual: '冷蓝月光，雾',
  cutMotive: '视线引导',
  cast: ['qi-ye'],
  ...extra,
});
const promptSpec = (shots: PromptS[]) => ({
  episode: 'T',
  shots: shots.map((s, i) => ({ shotId: `S${i + 1}`, cast: [], ...s })),
});

const rhythmDense = () =>
  shotSpec(
    'EP01',
    Array.from({ length: 18 }, () => ({ durSec: 2, action: 'x·y' })),
  );

const mvGolden = () => ({
  fps: 24,
  shots: [
    {
      no: '1',
      start: 0,
      end: 3,
      dur: 3,
      section: 'intro',
      lyric: '',
      shot: 'FS',
      angle: 'eye',
      subject: 'hero',
      move: 'static',
      trans: 'cut',
      beat: '1',
      asset: 'A1',
    },
    {
      no: '2',
      start: 3,
      end: 5.5,
      dur: 2.5,
      section: 'verse',
      shot: 'MS',
      lyric: '第一句',
      angle: 'eye',
      subject: 'hero',
      move: 'static',
      trans: 'cut',
      beat: '1',
      asset: 'A1',
    },
    {
      no: '3',
      start: 5.5,
      end: 7,
      dur: 1.5,
      section: 'verse',
      shot: 'CU',
      lyric: '第二句',
      angle: 'eye',
      subject: 'hero',
      move: 'static',
      trans: 'cut',
      beat: '1',
      asset: 'A1',
    },
    {
      no: '4',
      start: 7,
      end: 8,
      dur: 1,
      section: 'chorus',
      shot: 'MCU',
      lyric: '副歌',
      angle: 'eye',
      subject: 'hero',
      move: 'static',
      trans: 'cut',
      beat: '1',
      asset: 'A1',
    },
    {
      no: '5',
      start: 8,
      end: 11,
      dur: 3,
      section: 'outro',
      shot: 'ELS',
      lyric: '',
      angle: 'eye',
      subject: 'hero',
      move: 'static',
      trans: 'cut',
      beat: '1',
      asset: 'A1',
    },
  ],
});


const keyframeGolden = () => ({
  sceneId: 'cottage-fire',
  roomLockId: 'room-empty',
  characterCount: 1,
  plates: [
    { id: 'P0', index: 0, roomLockId: 'room-empty' },
    { id: 'P1', index: 1, roomLockId: 'room-empty' },
    { id: 'P2', index: 2, roomLockId: 'room-empty' },
  ],
  clips: [
    {
      id: 'c1',
      firstPlateId: 'P0',
      lastPlateId: 'P1',
      mode: 'fl2va',
      prompt: 'Old man warms hands then sits. Camera locked.',
    },
    {
      id: 'c2',
      firstPlateId: 'P1',
      lastPlateId: 'P2',
      mode: 'fl2va',
      prompt: 'Old man leans into the fire. Camera locked.',
    },
  ],
});

const reactionGood = (): S[] => [
  { durSec: 3, beatRole: 'hook', action: 'crisis' },
  { durSec: 6, beatRole: 'setup' },
  { durSec: 6, beatRole: 'reversal', action: 'reveal' },
  { durSec: 3, beatRole: 'reaction', action: 'face freeze' },
  { durSec: 6, beatRole: 'cliffhanger', action: 'door slam' },
  { durSec: 2, beatRole: 'reaction', action: 'group gasp' },
];

const failCodes = (r: ReturnType<typeof evaluateShotSpecSuite>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);

describe('shot-spec-suite', () => {
  it('lists 9 gates incl. keyframePlate/reactionBeat', () => {
    expect([...SHOT_SPEC_GATE_IDS]).toEqual([
      'hookStructure',
      'openingCascade',
      'cutTimeline',
      'shotContract',
      'shotPrompt',
      'storyRhythm',
      'mvShotlist',
      'keyframePlate',
      'reactionBeat',
    ]);
  });

  it('no sections → EMPTY_SUITE FAIL', () => {
    const r = evaluateShotSpecSuite({ episode: 'EP01' });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('EMPTY_SUITE');
    expect(r.metrics).toMatchObject({ ran: 0, skipped: 9 });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('bad schema → SCHEMA FAIL', () => {
    expect(failCodes(evaluateShotSpecSuite({ episode: 1 }))).toContain('SCHEMA');
  });

  it('unknown key → SCHEMA FAIL (strict)', () => {
    expect(failCodes(evaluateShotSpecSuite({ episode: 'EP01', notAGate: {} }))).toContain(
      'SCHEMA',
    );
  });

  it('hookStructure alone PASS → skipped 8', () => {
    const r = evaluateShotSpecSuite({
      episode: 'EP01',
      hookStructure: shotSpec('EP01', hookGood()),
    });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ ran: 1, passed: 1, failed: 0, skipped: 8 });
    expect(r.results.hookStructure.status).toBe('PASS');
    expect(r.results.shotContract.status).toBe('SKIP');
  });

  it('four expansion gates PASS', () => {
    const r = evaluateShotSpecSuite({
      episode: 'EP01',
      shotContract: contractGolden(),
      shotPrompt: promptSpec([promptFull({ dialogue: '谁在上面？' }), promptFull()]),
      storyRhythm: rhythmDense(),
      mvShotlist: mvGolden(),
    });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ ran: 4, passed: 4, failed: 0, skipped: 5 });
    for (const id of ['shotContract', 'shotPrompt', 'storyRhythm', 'mvShotlist'] as const) {
      expect(r.results[id].status).toBe('PASS');
    }
  });

  it('all nine gates PASS', () => {
    const r = evaluateShotSpecSuite({
      episode: 'EP01',
      hookStructure: shotSpec('EP01', hookGood()),
      openingCascade: shotSpec('EP01', cascadeGood()),
      cutTimeline: cutDoc([cut('C001', 48), cut('C002', 48), cut('C003', 48)]),
      shotContract: contractGolden(),
      shotPrompt: promptSpec([promptFull(), promptFull()]),
      storyRhythm: rhythmDense(),
      mvShotlist: mvGolden(),
      keyframePlate: keyframeGolden(),
      reactionBeat: shotSpec('EP01', reactionGood()),
    });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ ran: 9, passed: 9, failed: 0, skipped: 0 });
    for (const id of SHOT_SPEC_GATE_IDS) {
      expect(r.results[id].status).toBe('PASS');
    }
  });

  it('keyframePlate + reactionBeat alone PASS', () => {
    const r = evaluateShotSpecSuite({
      episode: 'EP01',
      keyframePlate: keyframeGolden(),
      reactionBeat: shotSpec('EP01', reactionGood()),
    });
    expect(r.verdict).toBe('PASS');
    expect(r.metrics).toMatchObject({ ran: 2, passed: 2, failed: 0, skipped: 7 });
    expect(r.results.keyframePlate.status).toBe('PASS');
    expect(r.results.reactionBeat.status).toBe('PASS');
  });

  it('shotContract mounts DEFAULT_SHOT_CONTRACT_RULESET (unknown rule → GATE_FAIL)', () => {
    const bad = contractGolden();
    bad.shots[0].ruleRefs = ['NO-SUCH-RULE'];
    const r = evaluateShotSpecSuite({ episode: 'EP01', shotContract: bad });
    expect(r.verdict).toBe('FAIL');
    expect(r.results.shotContract.status).toBe('FAIL');
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
  });

  it('storyRhythm density fail → GATE_FAIL', () => {
    const r = evaluateShotSpecSuite({
      episode: 'EP01',
      storyRhythm: shotSpec('EP01', [{ durSec: 90, action: '持球站立' }]),
    });
    expect(r.verdict).toBe('FAIL');
    expect(r.results.storyRhythm.status).toBe('FAIL');
  });
});

describe('ep01-rehearsal shotSpecGate wiring', () => {
  const SPEC = {
    episode: 'T',
    shots: [
      { shotId: 'S0', durSec: 3, cast: [], action: '推门·停步·对视' },
      { shotId: 'S1', durSec: 3, cast: [], action: '转身·甩账本·定格' },
      { shotId: 'S2', durSec: 3, cast: [], action: '特写流水·抬头·冷笑' },
      { shotId: 'S3', durSec: 3, cast: [], action: '退步·关灯·黑场' },
    ],
  };

  it('enforce + EMPTY FAIL → exit 36, stage shotSpec', async () => {
    const w = mkdtempSync(join(tmpdir(), 'sss-'));
    const r = await runEp01Rehearsal({
      shotSpec: SPEC,
      refIndex: {},
      workDir: w,
      shotSpecSuite: { episode: 'EP01' },
      shotSpecGate: 'enforce',
      detectors: 'off',
    });
    expect(r.ok).toBe(false);
    expect(r.exitCode).toBe(36);
    expect(r.stage).toBe('shotSpec');
    expect(r.shotSpecSuite?.verdict).toBe('FAIL');
    expect(existsSync(join(w, 'shot-spec-suite-report.json'))).toBe(true);
    const dumped = JSON.parse(readFileSync(join(w, 'shot-spec-suite-report.json'), 'utf8'));
    expect(dumped.verdict).toBe('FAIL');
  });

  it('warn + FAIL still continues', async () => {
    const w = mkdtempSync(join(tmpdir(), 'sss-'));
    const r = await runEp01Rehearsal({
      shotSpec: SPEC,
      refIndex: {},
      workDir: w,
      shotSpecSuite: { episode: 'EP01' },
      shotSpecGate: 'warn',
      detectors: 'off',
      allowCandidatesForDryRun: true,
    });
    expect(r.stage).not.toBe('shotSpec');
    expect(r.shotSpecSuite?.verdict).toBe('FAIL');
    expect(r.notes.some((n) => n.includes('shot-spec-suite'))).toBe(true);
  });

  it('off (default) ignores shotSpecSuite payload', async () => {
    const w = mkdtempSync(join(tmpdir(), 'sss-'));
    const r = await runEp01Rehearsal({
      shotSpec: SPEC,
      refIndex: {},
      workDir: w,
      shotSpecSuite: { episode: 'EP01' },
      detectors: 'off',
      allowCandidatesForDryRun: true,
    });
    expect(r.shotSpecSuite).toBeUndefined();
    expect(existsSync(join(w, 'shot-spec-suite-report.json'))).toBe(false);
  });

  it('storyLedger enforce blocks before shotSpec', async () => {
    const w = mkdtempSync(join(tmpdir(), 'sss-'));
    const r = await runEp01Rehearsal({
      shotSpec: SPEC,
      refIndex: {},
      workDir: w,
      storyLedger: { series: 'T', latestEp: 1 },
      storyLedgerGate: 'enforce',
      shotSpecSuite: { episode: 'EP01' },
      shotSpecGate: 'enforce',
      detectors: 'off',
    });
    expect(r.exitCode).toBe(36);
    expect(r.stage).toBe('storyLedger');
    expect(existsSync(join(w, 'shot-spec-suite-report.json'))).toBe(false);
  });
});
