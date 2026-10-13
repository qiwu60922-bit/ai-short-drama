/** V12 unified Character ID registry. ye-yuan (叶远) is archived: read-only, never for new generations. */
export const CHARACTER_IDS = ['qi-ye', 'fei-yue-li', 'zhui-yu-shitu'] as const;
export const ARCHIVED_CHARACTER_IDS = ['ye-yuan'] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];
const norm = (s: string) => s.trim().toLowerCase().replace(/[\s_]+/g, '-');
const squash = (s: string) => norm(s).replace(/-/g, '');
export function resolveCharacterId(raw: string, o: { allowArchived?: boolean } = {}): string {
  const k = squash(raw);
  const hit = CHARACTER_IDS.find(id => squash(id) === k);
  if (hit) return hit;
  const arch = ARCHIVED_CHARACTER_IDS.find(id => squash(id) === k);
  if (arch) { if (o.allowArchived) return arch; throw new Error(`ARCHIVED character "${raw}" is read-only; not allowed in new generations`); }
  throw new Error(`UNKNOWN character id "${raw}"; expected one of ${CHARACTER_IDS.join(', ')}`);
}
export const assertCastWritable = (cast: string[]) => cast.map(c => resolveCharacterId(c));
