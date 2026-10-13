/**
 * V13 character-pack reference images for identity / costume detectors. READ-ONLY: the detectors never write,
 * move or relabel refs or locks. Lock state mirrors character-pack/ye-qi-ep01/<id>/CharacterDNA.md (Director, 2026-09-17).
 * Root defaults to the wave14 refs folder; override with V13_REFS_ROOT.
 */
import { existsSync } from 'node:fs'; import { join } from 'node:path';
export const refsRoot = () => process.env.V13_REFS_ROOT ?? '/workspace/v11/wave14/ep01/refs';
export const LOCKED_REFS = Object.freeze({
  'qi-ye': Object.freeze({ lock: 'HUMAN_LOCK' as const, primary: 'qi-ye/SHEET_FULL_DAILY_AWAKENED.png', alts: [] as string[] }),
  'fei-yue-li': Object.freeze({ lock: 'LOCK_CANDIDATE' as const, primary: 'fei-yue-li/portrait_hero.png', alts: [] as string[] }),
  'zhui-yu-shitu': Object.freeze({ lock: 'HUMAN_LOCK' as const, primary: 'zhui-yu-shitu/rooftop_gothic.png',
    alts: ['zhui-yu-shitu/rooftop_modern.png', 'zhui-yu-shitu/bloodmoon_grasp.png', 'zhui-yu-shitu/portrait_feathers.png'] }),
});
export type PackId = keyof typeof LOCKED_REFS;
/** Absolute paths of existing ref files per character (primary first). Missing files are skipped, never invented. */
export function lockedPackFaces(root = refsRoot()): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [id, r] of Object.entries(LOCKED_REFS)) out[id] = [r.primary, ...r.alts].map(p => join(root, p)).filter(p => existsSync(p));
  return out;
}
