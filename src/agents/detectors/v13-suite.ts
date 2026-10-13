/**
 * V13 detector suite: continuity + identity + costume + scene + lipsync → one report.
 * overall: FAIL (any FAIL/ERROR ⇒ G3 BLOCKED) | INCOMPLETE (something NOT_EVALUATED) | MACHINE_OK_AWAITING_HUMAN.
 * Never PASS: G3 is human-only.
 */
import { runContinuityCheck, type Which } from './continuity-detector';
import { runIdentityCheck, type Embed } from './identity-detector';
import { runAppearanceCheck } from './appearance-detector';
import { runLipsyncCheck, type Score } from './lipsync-detector';
import { lockedPackFaces } from './locked-refs';
import { runCharacterEmbedCheck, runDinoSceneCheck, CHARACTER_EMBED_CALIBRATION, type BatchEmbed } from './dino-embed';
import { runCoarseLipsync, type Measure } from './lipsync-coarse';
export interface SuiteShot { shotId: string; takePath: string; midStill?: string; cast: string[]; dialogue: boolean; audioPath?: string; continuousWithPrev?: boolean }
export function suiteShotsFromSpec(spec: { shots: { shotId: string; cast?: string[] | null; dialogue?: unknown; continuousWithPrev?: boolean }[] },
  takePath: (id: string) => string, midStill?: (id: string) => string | undefined): SuiteShot[] {
  return spec.shots.map(s => ({ shotId: s.shotId, takePath: takePath(s.shotId), midStill: midStill?.(s.shotId), cast: s.cast ?? [], dialogue: !!s.dialogue,
    continuousWithPrev: s.continuousWithPrev ?? /^S\d+[b-z]$/.test(s.shotId) }));
}
export interface SuiteDeps { grab?: (p: string, w: Which) => Promise<Uint8Array>; embed?: Embed; faceModelPath?: string; load?: (p: string) => Promise<Uint8Array>; score?: Score; lipsyncScorer?: string; charEmbed?: BatchEmbed; sceneEmbed?: BatchEmbed; coarseMeasure?: Measure }
export async function runV13Detectors(input: { episodeId: string; shots: SuiteShot[]; packFaces?: Record<string, string[]>; costumeRefs?: Record<string, string[]>; sceneRefs?: Record<string, string[]>; useLockedRefs?: boolean }, d: SuiteDeps = {}) {
  const packs = input.packFaces ?? (input.useLockedRefs ? lockedPackFaces() : {}); const costumeRefs = input.costumeRefs ?? (input.useLockedRefs ? packs : {});
  const continuity = await runContinuityCheck({ episodeId: input.episodeId, shots: input.shots }, { grab: d.grab });
  const chars = [...new Set(input.shots.flatMap(s => s.cast))];
  const framesOf = (c: string) => input.shots.filter(s => s.cast.includes(c) && s.midStill).map(s => ({ shotId: s.shotId, path: s.midStill! }));
  const identity = [], costume = [], scene = [];
  for (const c of chars) {
    const id = await runIdentityCheck({ characterId: c, packFaces: packs[c] ?? [], frames: framesOf(c), otherPacks: packs }, { embed: d.embed, modelPath: d.faceModelPath });
    identity.push(id);
    // face model can't separate this character → whole-character DINOv2 check (calibrated chars only); FAIL still FAILs
    if (id.gate === 'NOT_EVALUATED' && CHARACTER_EMBED_CALIBRATION[c] && (d.charEmbed || input.useLockedRefs))
      identity.push(await runCharacterEmbedCheck({ characterId: c, packs, frames: framesOf(c) }, { embed: d.charEmbed }));
    costume.push(await runAppearanceCheck({ kind: 'costume', refId: c, refImages: costumeRefs[c] ?? [], frames: framesOf(c) }, { load: d.load }));
  }
  for (const s of input.shots.filter(x => !x.cast.length && x.midStill))
    scene.push(d.sceneEmbed || input.useLockedRefs
      ? await runDinoSceneCheck({ refId: s.shotId, refImages: input.sceneRefs?.[s.shotId] ?? [], frames: [{ shotId: s.shotId, path: s.midStill! }] }, { embed: d.sceneEmbed })
      : await runAppearanceCheck({ kind: 'scene', refId: s.shotId, refImages: input.sceneRefs?.[s.shotId] ?? [], frames: [{ shotId: s.shotId, path: s.midStill! }] }, { load: d.load }));
  const lipsync = await runLipsyncCheck({ episodeId: input.episodeId, shots: input.shots.map(s => ({ shotId: s.shotId, takePath: s.takePath, audioPath: s.audioPath, hasDialogue: s.dialogue })) },
    { score: d.score, scorerCmd: d.lipsyncScorer });
  // no licensed SyncNet scorer → coarse FAIL-only fallback (never MACHINE_OK)
  const lipsyncCoarse = lipsync.gate === 'NOT_EVALUATED' && (d.coarseMeasure || input.useLockedRefs)
    ? await runCoarseLipsync({ episodeId: input.episodeId, shots: input.shots.map(s => ({ shotId: s.shotId, takePath: s.takePath, audioPath: s.audioPath, hasDialogue: s.dialogue })) }, { measure: d.coarseMeasure })
    : null;
  const gates: Record<string, string[]> = { continuity: [continuity.gate], identity: identity.map(i => i.gate), costume: costume.map(i => i.gate), scene: scene.map(i => i.gate), lipsync: [lipsync.gate, ...(lipsyncCoarse ? [lipsyncCoarse.gate] : [])] };
  const failing = Object.entries(gates).filter(([, v]) => v.some(x => x === 'FAIL' || x === 'ERROR')).map(([k]) => k);
  const incomplete = Object.entries(gates).filter(([, v]) => v.includes('NOT_EVALUATED')).map(([k]) => k);
  const overall = failing.length ? 'FAIL' : incomplete.length ? 'INCOMPLETE' : 'MACHINE_OK_AWAITING_HUMAN';
  return { schema: 'v13/DetectorSuite/v1' as const, episodeId: input.episodeId, continuity, identity, costume, scene, lipsync, lipsyncCoarse,
    summary: { overall, g3: failing.length ? 'BLOCKED' as const : 'NOT_EVALUATED' as const, failing, incomplete, gates, publish: 'FORBIDDEN' as const,
      note: 'machine detectors never PASS; G3 requires human review receipt' } };
}
