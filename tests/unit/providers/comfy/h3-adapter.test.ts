/**
 * H3 adapter unit tests — no network / no AutoDL.
 */
import { describe, expect, it } from 'vitest';
import {
  assertMinimaxH3SubmitTier,
  buildMinimaxH3SmokeJob,
  MINIMAX_H3_SMOKE_DEFAULTS,
} from '@/providers/comfy/minimax-h3-smoke-adapter';
import type { ShotSpec } from '@/schemas/shot-spec';

const NOW = '2026-09-12T11:00:00.000Z';
const shaA = 'a'.repeat(64);

function validShotSpec(): ShotSpec {
  return {
    id: 'shot-spec-h3-1',
    projectId: 'proj-1',
    episodeManifestId: 'ep-1',
    shotKey: 'S01',
    revisionNo: 1,
    tier: 'A',
    durationSec: 5,
    characterIds: ['char-1'],
    sceneBibleRevisionId: 'scene-rev-1',
    camera: { framing: 'MCU' },
    blocking: 'stand',
    continuityConstraints: ['x'],
    humanReviewRequired: false,
    contentSha256: shaA,
    createdAt: NOW,
  };
}

describe('minimax-h3-smoke-adapter', () => {
  it('accepts local.comfy.minimax_h3', () => {
    expect(assertMinimaxH3SubmitTier('local.comfy.minimax_h3')).toBeNull();
  });

  it('refuses wan22 / paid / 14b', () => {
    expect(assertMinimaxH3SubmitTier('local.comfy.wan22_5b')?.ok).toBe(false);
    expect(assertMinimaxH3SubmitTier('cn.ark.seedance_mini')?.ok).toBe(false);
    expect(assertMinimaxH3SubmitTier('local.comfy.wan22_14b')?.ok).toBe(false);
  });

  it('builds job with fixture-friendly missing ref', () => {
    const built = buildMinimaxH3SmokeJob({
      shotSpec: validShotSpec(),
      fixtureScenario: 'success',
      allowMissingRefForFixture: true,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(built.tierId).toBe(MINIMAX_H3_SMOKE_DEFAULTS.tierId);
    expect(built.job.prompt['10']).toBeTruthy();
    expect(built.job.prompt['20']).toBeTruthy();
  });

  it('fail-closed without reference on live-shaped call', () => {
    const built = buildMinimaxH3SmokeJob({
      shotSpec: validShotSpec(),
      // no fixtureScenario, no allowMissingRef
    });
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.code).toBe('COMFY_I2V_REF_MISSING');
  });

  it('patches reference image name when provided', () => {
    const built = buildMinimaxH3SmokeJob({
      shotSpec: validShotSpec(),
      referenceImageName: 'hero_frame.png',
    });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const load = built.job.prompt['40'] as { inputs: { image: string } };
    expect(load.inputs.image).toBe('hero_frame.png');
  });
});
