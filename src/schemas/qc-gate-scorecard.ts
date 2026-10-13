/**
 * QcGateScorecard — subordinate to QCReport (not a top-level permanent object).
 * gateId must be V11_G1…V11_G8 (never bare G1).
 */
import { z } from 'zod';
import {
  identifierSchema,
  utcIsoSchema,
  unitIntervalSchema,
  GateIdSchema,
  GateStatusSchema,
  ProfileSchema,
  SubjectRefSchema,
  RepairLayerSchema,
  TimeWindowSchema,
} from './_primitives';

export const DimensionScoreSchema = z.object({
  key: identifierSchema,
  value: unitIntervalSchema,
  weight: unitIntervalSchema,
  threshold: unitIntervalSchema,
  pass: z.boolean(),
});

export const QcFindingSchema = z.object({
  code: identifierSchema,
  severity: z.enum(['INFO', 'NC', 'ERROR']),
  layer: RepairLayerSchema,
  shotId: identifierSchema.optional(),
  timeWindow: TimeWindowSchema.optional(),
  message: z.string().min(1).max(2000),
  evidenceRefs: z.array(identifierSchema).default([]),
});

export const QcProvenanceSchema = z.object({
  evaluatorIds: z.array(identifierSchema).min(1),
  modelVersions: z.array(identifierSchema).default([]),
  evidenceArtifactIds: z.array(identifierSchema).default([]),
  calibrated: z.boolean(),
});

export const QcGateScorecardSchema = z
  .object({
    gateId: GateIdSchema,
    subject: SubjectRefSchema,
    policyId: identifierSchema,
    policyVersion: identifierSchema,
    profile: ProfileSchema,
    status: GateStatusSchema,
    score: unitIntervalSchema.nullable(),
    hardVeto: z.boolean(),
    dimensions: z.array(DimensionScoreSchema),
    findings: z.array(QcFindingSchema),
    provenance: QcProvenanceSchema,
    decidedAt: utcIsoSchema,
  })
  .superRefine((card, ctx) => {
    if (card.status === 'PASS' && card.hardVeto) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'PASS cannot set hardVeto' });
    }
    if (card.status === 'PASS' && card.findings.some((f) => f.severity === 'ERROR')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PASS cannot carry ERROR findings',
      });
    }
  });

export type QcGateScorecard = z.infer<typeof QcGateScorecardSchema>;
