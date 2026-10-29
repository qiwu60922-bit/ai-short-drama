/**
 * V12 Shot Contract Gate — offline AI-video storyboard contract
 * (dramatic motive · 1–2 ruleRefs · spatial axis · negatives · beat timing).
 * Method rewritten (MIT) from tongxigogo-crypto/shot-contract validate.mjs:
 * https://github.com/tongxigogo-crypto/shot-contract
 * ≠Final ≠G3. No video generation, no paid API.
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateShotContract,
  SHOT_CONTRACT_DEFAULTS,
  DEFAULT_SHOT_CONTRACT_RULESET,
  VAGUE_TERMS,
} from '@/agents/assembly/shot-contract-gate';

const failCodes = (r: ReturnType<typeof evaluateShotContract>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateShotContract>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

const SAMPLE_RULESET = {
  schemaVersion: '0.1',
  source: { kind: 'original', note: 'fixture' },
  rules: [
    { id: 'LOW-1', purpose: 'low angle power', conditions: 'confrontation', risk: 'distortion' },
    { id: 'OTS-1', purpose: 'over shoulder', conditions: 'dialogue', risk: 'axis jump' },
    { id: 'BLOCK-1', purpose: 'blocking', conditions: '3+ cast', risk: 'crowd mush' },
  ],
};

function goldenShot(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

function golden(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: '0.1',
    projectId: 'demo-corridor',
    shots: [
      goldenShot(),
      goldenShot({
        id: 'S02',
        startSec: 5,
        durationSec: 6,
        purpose: 'Let A refuse the accusation without leaving the frame.',
        ruleRefs: ['OTS-1'],
        characters: ['A', 'B'],
        dialogue: [
          { speaker: 'B', line: 'You said you would tell me first.' },
          { speaker: 'A', line: 'I did tell you.' },
        ],
        content:
          '00:00-00:03 over B\'s shoulder: A lifts eyes. 00:03-00:06 reverse: B\'s jaw sets.',
        spatial: {
          axis: ['A', 'B'],
          move: 'static',
          motivation: 'No move. The cut carries the pressure.',
        },
        negative: ['no shoulder swap inside a single take'],
      }),
    ],
    ...overrides,
  };
}

describe('evaluateShotContract', () => {
  it('exposes DEFAULT_SHOT_CONTRACT_RULESET with core rule ids', () => {
    const ids = DEFAULT_SHOT_CONTRACT_RULESET.rules.map((r) => r.id);
    expect(ids).toEqual(expect.arrayContaining(['LOW-1', 'OTS-1', 'BLOCK-1', 'CU-1', 'FIX-1']));
    const r = evaluateShotContract(golden(), { ruleset: DEFAULT_SHOT_CONTRACT_RULESET });
    expect(r.verdict).toBe('PASS');
  });

  it('exposes defaults: duration 3–15s, maxRulesPerShot=2', () => {
    expect(SHOT_CONTRACT_DEFAULTS).toEqual({
      minDurationSec: 3,
      maxDurationSec: 15,
      maxRulesPerShot: 2,
    });
  });

  it('exposes VAGUE_TERMS aligned with upstream (电影感 / cinematic / epic …)', () => {
    expect(VAGUE_TERMS).toEqual(
      expect.arrayContaining(['电影感', '高级感', 'cinematic', 'epic', 'aesthetic']),
    );
  });

  it('golden two-shot corridor board → PASS; gates untouched', () => {
    const r = evaluateShotContract(golden(), { ruleset: SAMPLE_RULESET });
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
    expect(r.metrics).toMatchObject({ shots: 2, projectId: 'demo-corridor' });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('schema garbage → SCHEMA FAIL', () => {
    for (const bad of [null, undefined, {}, { schemaVersion: '0.1' }, { schemaVersion: 'x', projectId: 'p', shots: [] }]) {
      const r = evaluateShotContract(bad);
      expect(r.verdict).toBe('FAIL');
      expect(failCodes(r)).toContain('SCHEMA');
    }
  });

  it('empty ruleRefs → RULE_REFS_EMPTY FAIL', () => {
    const doc = golden({
      shots: [goldenShot({ ruleRefs: [] })],
    });
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('RULE_REFS_EMPTY');
  });

  it('more than maxRulesPerShot ruleRefs → RULE_REFS_MAX FAIL', () => {
    const doc = golden({
      shots: [goldenShot({ ruleRefs: ['LOW-1', 'OTS-1', 'BLOCK-1'] })],
    });
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('RULE_REFS_MAX');
  });

  it('purpose with impression word → VAGUE_PURPOSE FAIL', () => {
    const doc = golden({
      shots: [goldenShot({ purpose: '营造电影感和高级感的走廊对峙' })],
    });
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('VAGUE_PURPOSE');
  });

  it('purpose with english vague term → VAGUE_PURPOSE FAIL', () => {
    const doc = golden({
      shots: [goldenShot({ purpose: 'Make it cinematic and epic' })],
    });
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('VAGUE_PURPOSE');
  });

  it('duration outside 3–15s → DURATION FAIL', () => {
    const short = evaluateShotContract(golden({ shots: [goldenShot({ durationSec: 2 })] }));
    const long = evaluateShotContract(golden({ shots: [goldenShot({ durationSec: 20 })] }));
    expect(failCodes(short)).toContain('DURATION');
    expect(failCodes(long)).toContain('DURATION');
  });

  it('missing negative → NEGATIVE_MISSING FAIL', () => {
    const doc = golden({ shots: [goldenShot({ negative: [] })] });
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('NEGATIVE_MISSING');
  });

  it('dialogue without spatial.axis of 2 → AXIS_REQUIRED FAIL', () => {
    const doc = golden({
      shots: [
        goldenShot({
          dialogue: 'You said you would tell me first.',
          spatial: { move: 'static', motivation: 'hold' },
        }),
      ],
    });
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('AXIS_REQUIRED');
  });

  it('3+ characters without topDownMap → TOP_DOWN_MAP FAIL', () => {
    const doc = golden({
      shots: [
        goldenShot({
          characters: ['A', 'B', 'C'],
          topDownMap: undefined,
        }),
      ],
    });
    // strip topDownMap explicitly
    const shots = (doc as { shots: Array<Record<string, unknown>> }).shots;
    delete shots[0].topDownMap;
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('TOP_DOWN_MAP');
  });

  it('3+ characters with topDownMap → no TOP_DOWN_MAP', () => {
    const doc = golden({
      shots: [
        goldenShot({
          characters: ['A', 'B', 'C'],
          topDownMap: {
            anchors: ['A left', 'B right', 'C stair'],
            cameraRoute: 'track L→R',
          },
        }),
      ],
    });
    const r = evaluateShotContract(doc);
    expect(failCodes(r)).not.toContain('TOP_DOWN_MAP');
  });

  it('unknown ruleRef with ruleset → RULE_UNKNOWN FAIL', () => {
    const doc = golden({
      shots: [goldenShot({ ruleRefs: ['NO-SUCH-RULE'] })],
    });
    const r = evaluateShotContract(doc, { ruleset: SAMPLE_RULESET });
    expect(r.verdict).toBe('FAIL');
    expect(failCodes(r)).toContain('RULE_UNKNOWN');
  });

  it('unknown ruleRef without ruleset → no RULE_UNKNOWN', () => {
    const doc = golden({
      shots: [goldenShot({ ruleRefs: ['NO-SUCH-RULE'] })],
    });
    const r = evaluateShotContract(doc);
    expect(failCodes(r)).not.toContain('RULE_UNKNOWN');
  });

  it('neighbouring axis reverse → AXIS_FLIP WARN (still PASS)', () => {
    const doc = golden({
      shots: [
        goldenShot({
          id: 'S01',
          startSec: 0,
          spatial: { axis: ['A', 'B'], move: 'static', motivation: 'hold' },
        }),
        goldenShot({
          id: 'S02',
          startSec: 5,
          spatial: { axis: ['B', 'A'], move: 'static', motivation: 'hold' },
        }),
      ],
    });
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('AXIS_FLIP');
    expect(failCodes(r)).toEqual([]);
  });

  it('startSec gap → TIME_GAP WARN', () => {
    const doc = golden({
      shots: [
        goldenShot({ id: 'S01', startSec: 0, durationSec: 5 }),
        goldenShot({ id: 'S02', startSec: 8, durationSec: 5 }), // gap from 5
      ],
    });
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('TIME_GAP');
  });

  it('content without timecode → CONTENT_UNTIMED WARN', () => {
    const doc = golden({
      shots: [goldenShot({ content: 'B walks toward camera and stops.' })],
    });
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('CONTENT_UNTIMED');
  });

  it('spatial.move without motivation → MOVE_UNMOTIVATED WARN', () => {
    const doc = golden({
      shots: [
        goldenShot({
          spatial: { axis: ['B', 'door'], move: 'dolly in' },
        }),
      ],
    });
    const r = evaluateShotContract(doc);
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('MOVE_UNMOTIVATED');
  });
});
