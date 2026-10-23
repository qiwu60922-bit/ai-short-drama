/**
 * V12 Scenario Plan Gate — offline generation-plan / cost dual-gate
 * (scenes·clips·I2V/R2V/T2V·3–15s·no scene re-enter·@picture_N·no placeholders·
 *  previs + cost human approvals before paid gen).
 * Method rewritten (MIT) from reedodev/scenario-to-film validate-plan.mjs + SKILL gates:
 * https://github.com/reedodev/scenario-to-film
 * ≠Final ≠G3. No video generation, no paid API.
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateScenarioPlan,
  SCENARIO_PLAN_DEFAULTS,
  SCENARIO_PLAN_MODES,
} from '@/agents/assembly/scenario-plan-gate';

const failCodes = (r: ReturnType<typeof evaluateScenarioPlan>) =>
  r.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code);
const warnCodes = (r: ReturnType<typeof evaluateScenarioPlan>) =>
  r.findings.filter((f) => f.severity === 'WARN').map((f) => f.code);

function goldenClip(overrides: Record<string, unknown> = {}) {
  return {
    scene_id: 'shop',
    mode: 'I2V',
    seconds: 5,
    seed: 1,
    prompt: '@picture_1 stands behind the counter and looks at the door, slow push-in',
    first_image: 'refs/shop.png',
    last_image: '',
    use_common_references: true,
    refiner: { mode: 'off', strength: 0, reference_clip: 0, reason: 'fresh scene start' },
    ...overrides,
  };
}

function golden(overrides: Record<string, unknown> = {}) {
  return {
    settings: {
      model: 'example-video-model',
      resolution: '720p',
      aspect: '16:9',
      shared_prompt: '',
      seed_policy: 'fixed per clip',
    },
    sequence_mode: true,
    scenes: [
      {
        id: 'shop',
        name: 'Shop at night',
        prompt: 'Small shop, cold fluorescent light, quiet',
        continue_previous: false,
        references: {
          images: ['refs/clerk.png', 'refs/shop.png'],
          videos: [],
          audios: [],
        },
      },
    ],
    clips: [goldenClip()],
    approvals: {
      previsApproved: true,
      previsApprovedBy: 'wuqi',
      costApproved: true,
      costApprovedBy: 'wuqi',
      estimatedCredits: 12,
      estimatedCreditsKind: 'estimated',
    },
    ...overrides,
  };
}

describe('evaluateScenarioPlan', () => {
  it('exposes defaults: clip 3–15s, shot table max 10s, max 9 images / 3 videos / 3 audios', () => {
    expect(SCENARIO_PLAN_DEFAULTS).toEqual({
      minClipSec: 3,
      maxClipSec: 15,
      maxShotSec: 10,
      maxRefImages: 9,
      maxRefVideos: 3,
      maxRefAudios: 3,
      requireHumanGates: true,
    });
    expect([...SCENARIO_PLAN_MODES]).toEqual(['I2V', 'R2V', 'T2V']);
  });

  it('golden shop plan → PASS; gates untouched', () => {
    const r = evaluateScenarioPlan(golden());
    expect(r.verdict).toBe('PASS');
    expect(failCodes(r)).toEqual([]);
    expect(r.metrics).toMatchObject({
      scenes: 1,
      clips: 1,
      totalTargetSeconds: 5,
    });
  });

  it('missing settings / empty scenes / empty clips → SCHEMA family FAIL', () => {
    expect(failCodes(evaluateScenarioPlan({ scenes: [], clips: [] }))).toContain('SETTINGS_MISSING');
    expect(
      failCodes(
        evaluateScenarioPlan({
          settings: {},
          scenes: [],
          clips: [goldenClip()],
          approvals: golden().approvals,
        }),
      ),
    ).toContain('SCENES_EMPTY');
    expect(
      failCodes(
        evaluateScenarioPlan({
          settings: {},
          scenes: golden().scenes,
          clips: [],
          approvals: golden().approvals,
        }),
      ),
    ).toContain('CLIPS_EMPTY');
  });

  it('clip seconds outside 3–15 → DURATION FAIL (upstream plan-bad fixture)', () => {
    const r = evaluateScenarioPlan(
      golden({
        clips: [goldenClip({ seconds: 2, mode: 'R2V', prompt: '@picture_1 waits', first_image: undefined })],
      }),
    );
    expect(failCodes(r)).toContain('DURATION');
  });

  it('placeholder angle-brackets in settings.model → PLACEHOLDER FAIL', () => {
    const r = evaluateScenarioPlan(
      golden({
        settings: { ...golden().settings, model: '<video model>' },
      }),
    );
    expect(failCodes(r)).toContain('PLACEHOLDER');
  });

  it('@picture_N beyond scene image list → PICTURE_TAG FAIL', () => {
    const r = evaluateScenarioPlan(
      golden({
        clips: [goldenClip({ prompt: '@picture_4 waits at the door' })],
      }),
    );
    expect(failCodes(r)).toContain('PICTURE_TAG');
  });

  it('fresh I2V without first_image → I2V_FIRST_IMAGE FAIL', () => {
    const r = evaluateScenarioPlan(
      golden({
        clips: [goldenClip({ first_image: '', mode: 'I2V' })],
      }),
    );
    expect(failCodes(r)).toContain('I2V_FIRST_IMAGE');
  });

  it('clip scene_id unknown → CLIP_SCENE_UNKNOWN FAIL', () => {
    const r = evaluateScenarioPlan(
      golden({
        clips: [goldenClip({ scene_id: 'alley' })],
      }),
    );
    expect(failCodes(r)).toContain('CLIP_SCENE_UNKNOWN');
  });

  it('returning to a left scene → SCENE_REENTER FAIL', () => {
    const r = evaluateScenarioPlan(
      golden({
        scenes: [
          {
            id: 'shop',
            name: 'Shop',
            prompt: 'Shop interior, still',
            continue_previous: false,
            references: { images: ['a.png'], videos: [], audios: [] },
          },
          {
            id: 'street',
            name: 'Street',
            prompt: 'Night street, neon',
            continue_previous: false,
            references: { images: ['b.png'], videos: [], audios: [] },
          },
        ],
        clips: [
          goldenClip({ scene_id: 'shop', prompt: '@picture_1 clerk waits', first_image: 'a.png' }),
          goldenClip({
            scene_id: 'street',
            prompt: '@picture_1 walks',
            first_image: 'b.png',
            mode: 'I2V',
          }),
          goldenClip({
            scene_id: 'shop',
            prompt: '@picture_1 returns',
            first_image: 'a.png',
            mode: 'I2V',
          }),
        ],
      }),
    );
    expect(failCodes(r)).toContain('SCENE_REENTER');
  });

  it('first scene continue_previous=true → FIRST_CONTINUE FAIL', () => {
    const scenes = structuredClone(golden().scenes);
    scenes[0].continue_previous = true;
    const r = evaluateScenarioPlan(golden({ scenes }));
    expect(failCodes(r)).toContain('FIRST_CONTINUE');
  });

  it('scene prompt holding dialogue/events → SCENE_PROMPT_EVENT WARN', () => {
    const scenes = structuredClone(golden().scenes);
    scenes[0].prompt = 'Clerk says hello at the door';
    const r = evaluateScenarioPlan(golden({ scenes }));
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('SCENE_PROMPT_EVENT');
  });

  it('bad mode → MODE FAIL', () => {
    const r = evaluateScenarioPlan(golden({ clips: [goldenClip({ mode: 'S2V' })] }));
    expect(failCodes(r)).toContain('MODE');
  });

  it('requireHumanGates: missing previs / cost approval → PREVIS_GATE / COST_GATE FAIL', () => {
    const r = evaluateScenarioPlan(golden({ approvals: {} }));
    expect(failCodes(r)).toEqual(expect.arrayContaining(['PREVIS_GATE', 'COST_GATE']));
    expect(r.verdict).toBe('FAIL');
  });

  it('requireHumanGates=false skips approval FAILS (structure-only lint)', () => {
    const r = evaluateScenarioPlan(golden({ approvals: undefined }), {
      requireHumanGates: false,
    });
    expect(failCodes(r)).toEqual([]);
    expect(r.verdict).toBe('PASS');
  });

  it('autoSpend / selfSpend flags → AUTO_SPEND FAIL (skill never self-spends)', () => {
    const r = evaluateScenarioPlan(
      golden({
        settings: { ...golden().settings, autoSpend: true },
      }),
    );
    expect(failCodes(r)).toContain('AUTO_SPEND');
  });

  it('more than 9 reference images → REF_IMAGES_MAX FAIL', () => {
    const scenes = structuredClone(golden().scenes);
    scenes[0].references.images = Array.from({ length: 10 }, (_, i) => `refs/${i}.png`);
    const r = evaluateScenarioPlan(
      golden({
        scenes,
        clips: [goldenClip({ prompt: 'looks at door, no tag', first_image: 'refs/0.png' })],
      }),
    );
    expect(failCodes(r)).toContain('REF_IMAGES_MAX');
  });

  it('duplicate scene id → DUP_SCENE FAIL', () => {
    const r = evaluateScenarioPlan(
      golden({
        scenes: [
          golden().scenes[0],
          { ...golden().scenes[0], name: 'Shop 2' },
        ],
      }),
    );
    expect(failCodes(r)).toContain('DUP_SCENE');
  });

  it('refiner missing → REFINER WARN only', () => {
    const r = evaluateScenarioPlan(
      golden({
        clips: [goldenClip({ refiner: undefined })],
      }),
    );
    expect(r.verdict).toBe('PASS');
    expect(warnCodes(r)).toContain('REFINER');
  });
});
