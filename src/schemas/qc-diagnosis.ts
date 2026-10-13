/**
 * QcDiagnosis — hangs under QCReport; feeds RepairPlan (not a top-level permanent object).
 * status: NC | ERROR only. gateId = V11_G1…V11_G8.
 * Prisma: V11QcDiagnosis.
 */
import { z } from 'zod';
import {
  identifierSchema,
  utcIsoSchema,
  GateIdSchema,
  RepairLayerSchema,
  SubjectRefSchema,
} from './_primitives';
import { RepairScopeSchema } from './repair-plan';

export const QcDiagnosisStatusSchema = z.enum(['NC', 'ERROR']);

export const QcDiagnosisSchema = z.object({
  id: identifierSchema,
  qcReportId: identifierSchema,
  gateId: GateIdSchema,
  subject: SubjectRefSchema,
  status: QcDiagnosisStatusSchema,
  primaryFailureCodes: z.array(identifierSchema).min(1),
  failedLayers: z.array(RepairLayerSchema).min(1),
  failedShotIds: z.array(identifierSchema).min(1),
  suggestedScope: RepairScopeSchema,
  escalate: z.boolean(),
  evidenceRefs: z.array(identifierSchema).default([]),
  createdAt: utcIsoSchema,
});

export type QcDiagnosis = z.infer<typeof QcDiagnosisSchema>;
export type QcDiagnosisStatus = z.infer<typeof QcDiagnosisStatusSchema>;
