/**
 * QCReport — V11 permanent object #10. Scorecards subordinate; gateId = V11_G*.
 */
import { z } from 'zod';
import {
  identifierSchema,
  sha256Schema,
  utcIsoSchema,
  ProfileSchema,
  GateStatusSchema,
  SubjectRefSchema,
} from './_primitives';
import { QcGateScorecardSchema } from './qc-gate-scorecard';

export const QCReportSchema = z
  .object({
    id: identifierSchema,
    projectId: identifierSchema,
    episodeManifestId: identifierSchema.optional(),
    subject: SubjectRefSchema,
    profile: ProfileSchema,
    policyId: identifierSchema,
    policyVersion: identifierSchema,
    scorecards: z.array(QcGateScorecardSchema).min(1),
    diagnosisIds: z.array(identifierSchema),
    repairPlanIds: z.array(identifierSchema),
    status: GateStatusSchema,
    contentSha256: sha256Schema,
    createdAt: utcIsoSchema,
  })
  .superRefine((report, ctx) => {
    if (report.status === 'PASS' && report.scorecards.some((s) => s.status === 'ERROR')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'overall PASS cannot include ERROR scorecard',
      });
    }
    if (report.status === 'PASS' && report.scorecards.some((s) => s.status === 'NC')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'overall PASS cannot include NC scorecard',
      });
    }
  });

export type QCReport = z.infer<typeof QCReportSchema>;

export {
  QcGateScorecardSchema,
  DimensionScoreSchema,
  QcFindingSchema,
  QcProvenanceSchema,
} from './qc-gate-scorecard';
export type { QcGateScorecard } from './qc-gate-scorecard';
