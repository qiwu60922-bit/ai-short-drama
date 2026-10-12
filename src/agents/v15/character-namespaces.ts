/** V15 multi-drama character namespaces: "<dramaId>/<characterId>". Unqualified ids resolve within one drama only (default: V11 drama). */
import { CHARACTER_IDS, ARCHIVED_CHARACTER_IDS } from '@/agents/ledger/character-registry';
export const DEFAULT_DRAMA_ID = 'v11-yelan';
export interface DramaDef { dramaId: string; characters: string[]; archived?: string[] }
const ID = /^[a-z0-9][a-z0-9-]{1,47}$/;
const squash = (s: string) => s.trim().toLowerCase().replace(/[\s_-]+/g, '');
export function createNamespaceRegistry(dramas: DramaDef[] = [{ dramaId: DEFAULT_DRAMA_ID, characters: [...CHARACTER_IDS], archived: [...ARCHIVED_CHARACTER_IDS] }]) {
  const m = new Map<string, DramaDef>();
  for (const d of dramas) {
    if (!ID.test(d.dramaId)) throw new Error(`invalid dramaId "${d.dramaId}"`);
    if (m.has(d.dramaId)) throw new Error(`duplicate dramaId ${d.dramaId}`);
    for (const c of [...d.characters, ...(d.archived ?? [])]) if (!ID.test(c)) throw new Error(`invalid characterId "${c}"`);
    m.set(d.dramaId, d);
  }
  function resolve(raw: string, o: { dramaId?: string; allowArchived?: boolean } = {}): string {
    const [dramaId, short] = raw.includes('/') ? raw.split('/', 2) : [o.dramaId ?? DEFAULT_DRAMA_ID, raw];
    const d = m.get(dramaId); if (!d) throw new Error(`unknown drama "${dramaId}"`);
    const hit = d.characters.find(c => squash(c) === squash(short)); if (hit) return `${dramaId}/${hit}`;
    const arch = (d.archived ?? []).find(c => squash(c) === squash(short));
    if (arch) { if (o.allowArchived) return `${dramaId}/${arch}`; throw new Error(`ARCHIVED character ${dramaId}/${arch} is read-only`); }
    throw new Error(`UNKNOWN character "${short}" in drama ${dramaId}`);
  }
  return { resolve, assertCast: (cast: string[], o: { dramaId?: string } = {}) => cast.map(c => resolve(c, o)), list: (dramaId: string) => [...(m.get(dramaId)?.characters ?? [])], dramas: () => [...m.keys()] };
}
