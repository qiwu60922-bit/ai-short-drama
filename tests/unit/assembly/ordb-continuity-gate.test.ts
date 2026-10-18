/**
 * V12 ORDB Continuity Gate — 多集连续性离线闸门（时间线·角色漂移·未知角色·转场断裂·重复对白）.
 * Offline, deterministic, ≠Final ≠G3.
 * Rules rewritten (not vendored) from soulverse92500-ui/open-reality-drama-benchmark evaluator.py (MIT).
 * https://github.com/soulverse92500-ui/open-reality-drama-benchmark
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateOrdbRun,
  normalizeDialogue,
  type OrdbRun,
} from '@/agents/assembly/ordb-continuity-gate';

const sample = (): OrdbRun => ({
  run_name: 'community-center-lost-umbrella',
  characters: [
    { id: 'lin', facts: { age: 31, jacket: 'navy', role: 'visitor' } },
    { id: 'chen', facts: { age: 27, jacket: 'gray', role: 'volunteer' } },
  ],
  episodes: [
    {
      index: 1,
      character_states: {
        lin: { age: 31, jacket: 'navy' },
        chen: { age: 27, jacket: 'gray' },
      },
      start_state: { location: 'lobby', umbrella: 'rack' },
      end_state: { location: 'front_desk', umbrella: 'counter' },
      dialogue: [
        { speaker: 'lin', text: '我剛才放在這裡。' },
        { speaker: 'chen', text: '等一下，我幫你查。' },
      ],
    },
    {
      index: 2,
      character_states: {
        lin: { age: 31, jacket: 'navy' },
        chen: { age: 27, jacket: 'gray' },
      },
      start_state: { location: 'front_desk', umbrella: 'counter' },
      end_state: { location: 'security_room', umbrella: 'counter' },
      dialogue: [
        { speaker: 'chen', text: '監視器拍到有人拿錯。' },
        { speaker: 'lin', text: '那個人還在附近嗎？' },
      ],
    },
  ],
});

const codes = (r: ReturnType<typeof evaluateOrdbRun>) => r.findings.map((f) => f.code);
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

describe('normalizeDialogue', () => {
  it('strips punctuation and casefolds like ORDB (Python re.UNICODE \\w)', () => {
    expect(normalizeDialogue('我剛才放在這裡。')).toBe('我剛才放在這裡');
    expect(normalizeDialogue('Hello, World!!')).toBe('helloworld');
    expect(normalizeDialogue('   ')).toBe('');
  });
});

describe('evaluateOrdbRun', () => {
  it('PASS on the ORDB sample_run with full scores and NOT_EVALUATED gates', () => {
    const r = evaluateOrdbRun(sample());
    expect(r.pass).toBe(true);
    expect(r.verdict).toBe('PASS');
    expect(r.findings).toEqual([]);
    expect(r.benchmark_version).toBe('0.1.0');
    expect(r.run_name).toBe('community-center-lost-umbrella');
    expect(r.episode_count).toBe(2);
    expect(r.scores).toEqual({
      character_consistency: 100,
      scene_transition: 100,
      timeline_order: 100,
      dialogue_uniqueness: 100,
      overall: 100,
    });
    expect(r.counts).toEqual({
      character_fact_checks: 8,
      transition_checks: 2,
      timeline_errors: 0,
      duplicate_dialogue_instances: 0,
    });
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('SCHEMA FAIL on empty/malformed run (no throw)', () => {
    for (const bad of [null, {}, { characters: [], episodes: [{ index: 1 }] }, { characters: [{ id: 'a', facts: {} }], episodes: [] }]) {
      const r = evaluateOrdbRun(bad);
      expect(r.pass).toBe(false);
      expect(r.verdict).toBe('FAIL');
      expect(codes(r)).toEqual(['SCHEMA']);
      expect(r.gates.V11_G3).toBe('NOT_EVALUATED');
    }
  });

  it('SCHEMA when character ids are missing or duplicated', () => {
    const dup = clone(sample());
    dup.characters.push({ id: 'lin', facts: {} });
    expect(codes(evaluateOrdbRun(dup))).toEqual(['SCHEMA']);
    const emptyId = clone(sample());
    emptyId.characters[0].id = '';
    expect(codes(evaluateOrdbRun(emptyId))).toEqual(['SCHEMA']);
  });

  it('SCHEMA when episode index is not an integer', () => {
    const bad = clone(sample());
    (bad.episodes[0] as { index: unknown }).index = '1';
    expect(codes(evaluateOrdbRun(bad))).toEqual(['SCHEMA']);
  });

  it('TIMELINE_ORDER error when episode.index does not strictly increase', () => {
    const bad = clone(sample());
    bad.episodes[1].index = 1;
    const r = evaluateOrdbRun(bad);
    expect(codes(r)).toEqual(['TIMELINE_ORDER']);
    expect(r.findings[0]).toMatchObject({
      severity: 'error',
      episode: 1,
      message: 'episode index 1 does not follow 1',
    });
    expect(r.pass).toBe(false);
    expect(r.scores.timeline_order).toBe(75);
    expect(r.scores.overall).toBe(95);
    expect(r.counts.timeline_errors).toBe(1);
  });

  it('CHARACTER_DRIFT when observed state disagrees with character.facts baseline', () => {
    const bad = clone(sample());
    bad.episodes[0].character_states!.lin.jacket = 'red';
    const r = evaluateOrdbRun(bad);
    expect(codes(r)).toEqual(['CHARACTER_DRIFT']);
    expect(r.findings[0]).toMatchObject({
      severity: 'error',
      episode: 1,
      message: "lin.jacket: expected 'navy', observed 'red'",
    });
    expect(r.pass).toBe(false);
    expect(r.scores.character_consistency).toBe(87.5);
    expect(r.scores.overall).toBe(95);
    expect(r.counts.character_fact_checks).toBe(8);
  });

  it('ignores observed keys that are not in the character facts baseline', () => {
    const ok = clone(sample());
    ok.episodes[0].character_states!.lin.mood = 'anxious';
    const r = evaluateOrdbRun(ok);
    expect(r.findings).toEqual([]);
    expect(r.pass).toBe(true);
    // still only the overlapping keys are scored
    expect(r.counts.character_fact_checks).toBe(8);
  });

  it('UNKNOWN_CHARACTER error for character_states id not in run.characters', () => {
    const bad = clone(sample());
    bad.episodes[0].character_states!.ghost = { age: 1 };
    const r = evaluateOrdbRun(bad);
    expect(codes(r)).toEqual(['UNKNOWN_CHARACTER']);
    expect(r.findings[0]).toMatchObject({
      severity: 'error',
      episode: 1,
      message: 'unknown character id: ghost',
    });
    expect(r.pass).toBe(false);
    // unknown does not inflate fact checks
    expect(r.counts.character_fact_checks).toBe(8);
    expect(r.scores.overall).toBe(100);
  });

  it('BROKEN_TRANSITION warning when previous end_state and next start_state disagree on shared keys', () => {
    const bad = clone(sample());
    bad.episodes[1].start_state!.location = 'elsewhere';
    const r = evaluateOrdbRun(bad);
    expect(codes(r)).toEqual(['BROKEN_TRANSITION']);
    expect(r.findings[0]).toMatchObject({
      severity: 'warning',
      episode: 2,
      message: "location: previous end 'front_desk', current start 'elsewhere'",
    });
    // warnings alone do not fail the gate
    expect(r.pass).toBe(true);
    expect(r.verdict).toBe('PASS');
    expect(r.scores.scene_transition).toBe(50);
    expect(r.scores.overall).toBe(87.5);
    expect(r.counts.transition_checks).toBe(2);
  });

  it('skips transition check when previous end_state is missing', () => {
    const ok = clone(sample());
    delete ok.episodes[0].end_state;
    const r = evaluateOrdbRun(ok);
    expect(codes(r)).toEqual([]);
    expect(r.counts.transition_checks).toBe(0);
    expect(r.scores.scene_transition).toBe(100);
  });

  it('REPEATED_DIALOGUE warning when normalized dialogue text repeats across episodes', () => {
    const bad = clone(sample());
    bad.episodes[1].dialogue!.push({ speaker: 'lin', text: '我剛才放在這裡。' });
    const r = evaluateOrdbRun(bad);
    expect(codes(r)).toEqual(['REPEATED_DIALOGUE']);
    expect(r.findings[0]).toMatchObject({
      severity: 'warning',
      episode: 1,
      message: 'normalized dialogue repeated 2 times: 我剛才放在這裡',
    });
    expect(r.pass).toBe(true);
    expect(r.scores.dialogue_uniqueness).toBe(80);
    expect(r.scores.overall).toBe(97);
    expect(r.counts.duplicate_dialogue_instances).toBe(1);
  });

  it('dialogue uniqueness is 100 when there is no dialogue', () => {
    const ok = clone(sample());
    for (const ep of ok.episodes) delete ep.dialogue;
    const r = evaluateOrdbRun(ok);
    expect(r.scores.dialogue_uniqueness).toBe(100);
    expect(r.pass).toBe(true);
  });

  it('overall weight is 0.40/0.25/0.20/0.15 and timeline penalty is 25 per error', () => {
    const bad = clone(sample());
    bad.episodes.push({
      index: 1,
      character_states: {
        lin: { age: 31, jacket: 'navy' },
        chen: { age: 27, jacket: 'gray' },
      },
      start_state: { location: 'security_room', umbrella: 'counter' },
      end_state: { location: 'exit', umbrella: 'hand' },
      dialogue: [],
    });
    // indices: 1,2,1 → one timeline error (2→1)
    const r = evaluateOrdbRun(bad);
    expect(r.counts.timeline_errors).toBe(1);
    expect(r.scores.timeline_order).toBe(75);
    expect(r.pass).toBe(false);
  });

  it('defaults run_name to unnamed when omitted', () => {
    const ok = clone(sample());
    delete (ok as { run_name?: string }).run_name;
    expect(evaluateOrdbRun(ok).run_name).toBe('unnamed');
  });

  it('PASS ≠ G3: even a perfect run leaves V11_G3 NOT_EVALUATED', () => {
    const r = evaluateOrdbRun(sample());
    expect(r.pass).toBe(true);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });
});
