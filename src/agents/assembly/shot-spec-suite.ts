/**
 * V12 · Shot-Spec Suite (pre-gen visual/structure 旁路总入口),
 * offline, deterministic.
 *
 * Bundles ShotSpec / CutTimeline / contract gates beside story-ledger-suite:
 *   hookStructure · openingCascade · cutTimeline
 *   · shotContract · shotPrompt · storyRhythm · mvShotlist
 *   · keyframePlate · reactionBeat
 *   · dialogueExposition · seriesRhythm
 * shotContract mounts DEFAULT_SHOT_CONTRACT_RULESET when contractOpts.ruleset omitted.
 *
 * Absent sections → SKIP. Zero sections → EMPTY_SUITE FAIL.
 * Unknown keys → SCHEMA FAIL (strict).
 * Engineering suite only: PASS ≠ Final ≠ G3. $0.
 */
import { z } from 'zod';
import { ShotSpecDocSchema } from './beatplan-to-multishot';
import {
  evaluateHookStructure,
  type HookStructureOptions,
  type HookStructureReport,
} from './hook-structure-gate';
import {
  evaluateOpeningCascade,
  type OpeningCascadeOptions,
  type OpeningCascadeReport,
} from './opening-cascade-gate';
import {
  CutTimelineSchema,
  evaluateCutTimeline,
  type CutTimelineOptions,
  type CutTimelineReport,
} from './cut-timeline-gate';
import {
  ShotContractDocSchema,
  evaluateShotContract,
  type ShotContractOptions,
  type ShotContractReport,
} from './shot-contract-gate';
import {
  evaluateShotPrompts,
  type ShotPromptGateOptions,
  type ShotPromptReport,
} from './shot-prompt-gate';
import {
  evaluateStoryRhythm,
  type RhythmOptions,
  type RhythmReport,
} from './story-rhythm-gate';
import {
  MvShotlistDocSchema,
  evaluateMvShotlist,
  type MvShotlistReport,
} from './mv-shotlist-gate';
import {
  KeyframePlateDocSchema,
  evaluateKeyframePlate,
  type KeyframePlateOptions,
  type KeyframePlateReport,
} from './keyframe-plate-gate';
import {
  evaluateReactionBeats,
  type ReactionBeatOptions,
  type ReactionBeatReport,
} from './reaction-beat-gate';
import { DEFAULT_SHOT_CONTRACT_RULESET } from './shot-contract-gate';
import {
  evaluateDialogueExposition,
  type DialogueExpositionOptions,
  type DialogueExpositionReport,
} from './dialogue-exposition-gate';
import {
  evaluateSeriesRhythm,
  type SeriesRhythmOptions,
  type SeriesRhythmReport,
} from './series-rhythm-profile';

export const SHOT_SPEC_GATE_IDS = [
  'hookStructure',
  'openingCascade',
  'cutTimeline',
  'shotContract',
  'shotPrompt',
  'storyRhythm',
  'mvShotlist',
  'keyframePlate',
  'reactionBeat',
  'dialogueExposition',
  'seriesRhythm',
] as const;

export type ShotSpecGateId = (typeof SHOT_SPEC_GATE_IDS)[number];

const HookOptsSchema = z
  .object({
    hookWindowSec: z.number().positive().optional(),
    maxFirstShotSec: z.number().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    tailToleranceSec: z.number().positive().optional(),
    maxSetupRatio: z.number().positive().optional(),
    requireAllTagged: z.boolean().optional(),
    requireHookKind: z.boolean().optional(),
  })
  .strict();

const CascadeOptsSchema = z
  .object({
    cascadeWindowSec: z.number().positive().optional(),
    minCascadeBeats: z.number().int().positive().optional(),
  })
  .strict();

const CutOptsSchema = z
  .object({
    maxBeatSec: z.number().positive().optional(),
    minBeatSec: z.number().positive().optional(),
  })
  .strict();

const ContractOptsSchema = z
  .object({
    minDurationSec: z.number().positive().optional(),
    maxDurationSec: z.number().positive().optional(),
    maxRulesPerShot: z.number().int().positive().optional(),
    ruleset: z
      .object({
        rules: z.array(z.object({ id: z.string().optional() }).passthrough()).optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .strict();

const PromptOptsSchema = z
  .object({
    safeChars: z.number().positive().optional(),
    hardChars: z.number().positive().optional(),
    maxUnitsPerSec: z.number().positive().optional(),
    estUnitsPerSec: z.number().positive().optional(),
    pauseSec: z.number().nonnegative().optional(),
    strictFiveLines: z.boolean().optional(),
    hardBans: z.array(z.string()).optional(),
    processTerms: z.array(z.string()).optional(),
  })
  .strict();

const RhythmOptsSchema = z
  .object({
    minEventsPer90s: z.number().positive().optional(),
    maxShotSeconds: z.number().positive().optional(),
    maxSecondsPerEvent: z.number().positive().optional(),
    requireCutMotive: z.boolean().optional(),
  })
  .strict();

const KeyframeOptsSchema = z
  .object({
    minPlates: z.number().int().positive().optional(),
    minClips: z.number().int().positive().optional(),
  })
  .strict();

const ReactionOptsSchema = z
  .object({
    reactionWindowSec: z.number().positive().optional(),
    lookbackSec: z.number().positive().optional(),
    requireReaction: z.boolean().optional(),
  })
  .strict();

const DialogueOptsSchema = z
  .object({
    minActionChars: z.number().int().positive().optional(),
    midWindow: z.tuple([z.number(), z.number()]).optional(),
    unlabeledSpeechMin: z.number().int().positive().optional(),
  })
  .strict();

const SeriesRhythmOptsSchema = z
  .object({
    profile: z.enum(['dense', 'default', 'intrigue', 'slow_burn']).optional(),
    minEventsPer90s: z.number().positive().optional(),
    maxShotSeconds: z.number().positive().optional(),
    maxSecondsPerEvent: z.number().positive().optional(),
    requireCutMotive: z.boolean().optional(),
  })
  .strict();

export const ShotSpecSuiteSchema = z
  .object({
    episode: z.string().min(1),
    hookStructure: ShotSpecDocSchema.optional(),
    openingCascade: ShotSpecDocSchema.optional(),
    cutTimeline: CutTimelineSchema.optional(),
    shotContract: ShotContractDocSchema.optional(),
    shotPrompt: ShotSpecDocSchema.optional(),
    storyRhythm: ShotSpecDocSchema.optional(),
    mvShotlist: MvShotlistDocSchema.optional(),
    keyframePlate: KeyframePlateDocSchema.optional(),
    reactionBeat: ShotSpecDocSchema.optional(),
    dialogueExposition: ShotSpecDocSchema.optional(),
    seriesRhythm: ShotSpecDocSchema.optional(),
    hookOpts: HookOptsSchema.optional(),
    cascadeOpts: CascadeOptsSchema.optional(),
    cutOpts: CutOptsSchema.optional(),
    contractOpts: ContractOptsSchema.optional(),
    promptOpts: PromptOptsSchema.optional(),
    rhythmOpts: RhythmOptsSchema.optional(),
    keyframeOpts: KeyframeOptsSchema.optional(),
    reactionOpts: ReactionOptsSchema.optional(),
    dialogueOpts: DialogueOptsSchema.optional(),
    seriesRhythmOpts: SeriesRhythmOptsSchema.optional(),
  })
  .strict();

export type ShotSpecSuiteInput = z.infer<typeof ShotSpecSuiteSchema>;

export type ShotSpecChildReport =
  | HookStructureReport
  | OpeningCascadeReport
  | CutTimelineReport
  | ShotContractReport
  | ShotPromptReport
  | RhythmReport
  | MvShotlistReport
  | KeyframePlateReport
  | ReactionBeatReport
  | DialogueExpositionReport
  | SeriesRhythmReport;

export type ShotSpecGateResult = {
  status: 'PASS' | 'FAIL' | 'SKIP';
  report?: ShotSpecChildReport;
};

export type ShotSpecSuiteFinding = {
  code: 'SCHEMA' | 'EMPTY_SUITE' | 'GATE_FAIL';
  severity: 'FAIL' | 'WARN';
  message: string;
  fix?: string;
  ids?: string[];
};

export interface ShotSpecSuiteReport {
  schema: 'v12/ShotSpecSuite/v1';
  verdict: 'PASS' | 'FAIL';
  metrics: {
    ran: number;
    passed: number;
    failed: number;
    skipped: number;
    episode: string;
  };
  results: Record<ShotSpecGateId, ShotSpecGateResult>;
  findings: ShotSpecSuiteFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

function emptyResults(): Record<ShotSpecGateId, ShotSpecGateResult> {
  return Object.fromEntries(
    SHOT_SPEC_GATE_IDS.map((id) => [id, { status: 'SKIP' as const }]),
  ) as Record<ShotSpecGateId, ShotSpecGateResult>;
}

export function evaluateShotSpecSuite(input: unknown): ShotSpecSuiteReport {
  const results = emptyResults();
  const findings: ShotSpecSuiteFinding[] = [];

  const parsed = ShotSpecSuiteSchema.safeParse(input);
  if (!parsed.success) {
    findings.push({
      code: 'SCHEMA',
      severity: 'FAIL',
      message: `ShotSpecSuite schema: ${parsed.error.issues[0]?.message ?? 'invalid'}`,
      fix: `提供 episode，以及 0+ 已知 section（${SHOT_SPEC_GATE_IDS.join(' | ')}）`,
    });
    return {
      schema: 'v12/ShotSpecSuite/v1',
      verdict: 'FAIL',
      metrics: {
        ran: 0,
        passed: 0,
        failed: 0,
        skipped: SHOT_SPEC_GATE_IDS.length,
        episode: '',
      },
      results,
      findings,
      gates: GATES,
    };
  }

  const {
    episode,
    hookOpts,
    cascadeOpts,
    cutOpts,
    contractOpts,
    promptOpts,
    rhythmOpts,
    keyframeOpts,
    reactionOpts,
    dialogueOpts,
    seriesRhythmOpts,
    ...sections
  } = parsed.data;
  let ran = 0;
  let passed = 0;
  let failed = 0;

  const run = (id: ShotSpecGateId, report: ShotSpecChildReport) => {
    ran += 1;
    if (report.verdict === 'PASS') {
      passed += 1;
      results[id] = { status: 'PASS', report };
    } else {
      failed += 1;
      results[id] = { status: 'FAIL', report };
      findings.push({
        code: 'GATE_FAIL',
        severity: 'FAIL',
        ids: [id],
        message: `${id} verdict=FAIL (${report.findings.filter((f) => f.severity === 'FAIL').map((f) => f.code).join(',') || 'see report'})`,
        fix: `修复 ${id} 子闸门后重跑 shot-spec-suite`,
      });
    }
  };

  if (sections.hookStructure !== undefined) {
    run(
      'hookStructure',
      evaluateHookStructure(sections.hookStructure, (hookOpts ?? {}) as HookStructureOptions),
    );
  }
  if (sections.openingCascade !== undefined) {
    run(
      'openingCascade',
      evaluateOpeningCascade(
        sections.openingCascade,
        (cascadeOpts ?? {}) as OpeningCascadeOptions,
      ),
    );
  }
  if (sections.cutTimeline !== undefined) {
    run(
      'cutTimeline',
      evaluateCutTimeline(sections.cutTimeline, (cutOpts ?? {}) as CutTimelineOptions),
    );
  }
  if (sections.shotContract !== undefined) {
    const co = (contractOpts ?? {}) as ShotContractOptions;
    run(
      'shotContract',
      evaluateShotContract(sections.shotContract, {
        ...co,
        ruleset: co.ruleset === undefined ? DEFAULT_SHOT_CONTRACT_RULESET : co.ruleset,
      }),
    );
  }
  if (sections.shotPrompt !== undefined) {
    const po = promptOpts ?? {};
    run(
      'shotPrompt',
      evaluateShotPrompts(sections.shotPrompt, {
        ...po,
        processTerms: po.processTerms,
      } as ShotPromptGateOptions),
    );
  }
  if (sections.storyRhythm !== undefined) {
    run(
      'storyRhythm',
      evaluateStoryRhythm(sections.storyRhythm, (rhythmOpts ?? {}) as RhythmOptions),
    );
  }
  if (sections.mvShotlist !== undefined) {
    run('mvShotlist', evaluateMvShotlist(sections.mvShotlist));
  }
  if (sections.keyframePlate !== undefined) {
    run(
      'keyframePlate',
      evaluateKeyframePlate(sections.keyframePlate, (keyframeOpts ?? {}) as KeyframePlateOptions),
    );
  }
  if (sections.reactionBeat !== undefined) {
    run(
      'reactionBeat',
      evaluateReactionBeats(sections.reactionBeat, (reactionOpts ?? {}) as ReactionBeatOptions),
    );
  }
  if (sections.dialogueExposition !== undefined) {
    run(
      'dialogueExposition',
      evaluateDialogueExposition(
        sections.dialogueExposition,
        (dialogueOpts ?? {}) as DialogueExpositionOptions,
      ),
    );
  }
  if (sections.seriesRhythm !== undefined) {
    run(
      'seriesRhythm',
      evaluateSeriesRhythm(
        sections.seriesRhythm,
        (seriesRhythmOpts ?? {}) as SeriesRhythmOptions,
      ),
    );
  }

  const skipped = SHOT_SPEC_GATE_IDS.length - ran;
  if (ran === 0) {
    findings.push({
      code: 'EMPTY_SUITE',
      severity: 'FAIL',
      message: '未提供任何 shot-spec section',
      fix: `至少挂载一项：${SHOT_SPEC_GATE_IDS.join(' | ')}`,
    });
  }

  return {
    schema: 'v12/ShotSpecSuite/v1',
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: { ran, passed, failed, skipped, episode },
    results,
    findings,
    gates: GATES,
  };
}
