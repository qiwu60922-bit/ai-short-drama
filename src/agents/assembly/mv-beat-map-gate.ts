/**
 * V12 · MV Beat-Map Gate (MV 分镜拍点映射闸门), pre-generation, offline, deterministic.
 *
 * Builds on mv-shotlist-gate: every shot must carry a non-empty beat, and each
 * section must expose at least one distinct beat token (lyric/section→beat map).
 *
 * Reverse-engineered from public MV shotlist practice (structure only):
 *  - anime-mv-art-direction CSV `beat` column is not decorative — chorus/verse map.
 *  - Empty beat or single shared beat across all sections loses cut motive.
 *
 *  SCHEMA / CHILD_MV_FAIL
 *  BEAT_EMPTY (FAIL) — shot.beat blank
 *  SECTION_WITHOUT_BEAT (FAIL) — a section has no non-empty beat among its shots
 *  BEAT_MONOTONE (WARN) — all shots share the same beat token
 * Engineering gate only: PASS ≠ Final ≠ G3.
 */
import { z } from 'zod';
import {
  MvShotlistDocSchema,
  evaluateMvShotlist,
  type MvShotlistFinding,
  type MvShotlistReport,
} from './mv-shotlist-gate';

export const MvBeatMapDocSchema = MvShotlistDocSchema;
export type MvBeatMapDoc = z.infer<typeof MvBeatMapDocSchema>;

export type MvBeatMapFinding = {
  code:
    | 'SCHEMA'
    | 'CHILD_MV_FAIL'
    | 'BEAT_EMPTY'
    | 'SECTION_WITHOUT_BEAT'
    | 'BEAT_MONOTONE'
    | MvShotlistFinding['code'];
  severity: 'FAIL' | 'WARN';
  message: string;
  shotIds?: string[];
};

export interface MvBeatMapReport {
  verdict: 'PASS' | 'FAIL';
  metrics: MvShotlistReport['metrics'] & {
    shotsWithBeat: number;
    distinctBeats: number;
    sectionsMapped: number;
  };
  findings: MvBeatMapFinding[];
  gates: { Final: 'NOT_EVALUATED'; V11_G3: 'NOT_EVALUATED' };
}

const GATES = { Final: 'NOT_EVALUATED' as const, V11_G3: 'NOT_EVALUATED' as const };

const beatOf = (v: unknown): string => {
  if (v === undefined || v === null) return '';
  return String(v).trim();
};

export function evaluateMvBeatMap(input: unknown): MvBeatMapReport {
  const child = evaluateMvShotlist(input);
  const baseMetrics = {
    ...child.metrics,
    shotsWithBeat: 0,
    distinctBeats: 0,
    sectionsMapped: 0,
  };

  if (child.verdict === 'FAIL' && child.findings.some((f) => f.code === 'SCHEMA')) {
    return {
      verdict: 'FAIL',
      metrics: baseMetrics,
      findings: child.findings as MvBeatMapFinding[],
      gates: GATES,
    };
  }

  const findings: MvBeatMapFinding[] = [];
  if (child.verdict === 'FAIL') {
    const fails = child.findings.filter((f) => f.severity === 'FAIL');
    findings.push({
      code: 'CHILD_MV_FAIL',
      severity: 'FAIL',
      message: `内嵌 mv-shotlist FAIL：${fails.map((f) => f.code).join(',') || 'unknown'}`,
    });
  } else {
    for (const f of child.findings) findings.push(f as MvBeatMapFinding);
  }

  const parsed = MvBeatMapDocSchema.safeParse(input);
  if (!parsed.success) {
    findings.push({
      code: 'SCHEMA',
      severity: 'FAIL',
      message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    });
    return { verdict: 'FAIL', metrics: baseMetrics, findings, gates: GATES };
  }

  const shots = parsed.data.shots;
  const beats: string[] = [];
  const emptyIds: string[] = [];
  const bySection = new Map<string, string[]>();

  for (const s of shots) {
    const id = s.no !== undefined ? String(s.no) : undefined;
    const b = beatOf(s.beat);
    if (!b) {
      emptyIds.push(id ?? '?');
    } else {
      beats.push(b);
    }
    const sec = beatOf(s.section) || '_';
    const arr = bySection.get(sec) ?? [];
    arr.push(b);
    bySection.set(sec, arr);
  }

  if (emptyIds.length) {
    findings.push({
      code: 'BEAT_EMPTY',
      severity: 'FAIL',
      message: `${emptyIds.length} 镜 beat 为空`,
      shotIds: emptyIds,
    });
  }

  let sectionsMapped = 0;
  for (const [sec, bs] of bySection) {
    if (bs.some((b) => b.length > 0)) sectionsMapped += 1;
    else {
      findings.push({
        code: 'SECTION_WITHOUT_BEAT',
        severity: 'FAIL',
        message: `段落 ${sec} 无非空 beat`,
      });
    }
  }

  const distinct = new Set(beats);
  if (beats.length >= 2 && distinct.size === 1) {
    findings.push({
      code: 'BEAT_MONOTONE',
      severity: 'WARN',
      message: `全部 ${beats.length} 镜共用同一 beat「${[...distinct][0]}」，拍点映射过弱`,
    });
  }

  return {
    verdict: findings.some((f) => f.severity === 'FAIL') ? 'FAIL' : 'PASS',
    metrics: {
      ...child.metrics,
      shotsWithBeat: beats.length,
      distinctBeats: distinct.size,
      sectionsMapped,
    },
    findings,
    gates: GATES,
  };
}
