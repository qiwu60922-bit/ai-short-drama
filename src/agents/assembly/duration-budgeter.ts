/**
 * V12 Duration Budgeter — proposes ranked cut candidates to fit a max duration. Never auto-applies.
 *
 * beatRole-aware (2026-10-15 爆款反推：《魔神人生：弃子问天》均 ≈46s/集、《天幕直播》≈63–71s/集、
 * 《灾年逆袭》开局即危机)：集越短越要裁，裁的必须是铺垫，不能是钩子/悬念。
 *  - beatRole = hook | cliffhanger → 自动保护（除非 protectBeats:false 由人显式放开）
 *  - 未知 beatRole（拼错）→ 保守保护并在 unknownBeatRoles 里报出，交给 hook-structure-gate 修
 *  - 裁剪分层：setup 先裁到底 → 未标注镜（原有行为，同层轮转）→ increment → reversal →（放开时）hook/cliffhanger
 * 未标 beatRole 的 SHOT_SPEC（如 EP01）结果与旧版完全一致。PASS ≠ Final ≠ G3。
 */
import { BEAT_ROLES } from './hook-structure-gate';

export interface BudgetShot { shotId: string; durSec: number; dialogue?: unknown; vo?: string | null; cast?: unknown[]; beatRole?: unknown }
export interface BudgetOpts { maxSec: number; protectedShots?: string[]; stepSec?: number; floorSec?: number; allowDialogue?: boolean; charsPerSec?: number; protectBeats?: boolean }
export interface CutProposal { shotId: string; fromSec: number; toSec: number; risk: number; riskNote: string }
export const voMinSec = (vo?: string | null, cps = 4) => (vo ? Math.ceil(vo.replace(/\s|[，。！？、…—]/g, '').length / cps) : 0);

const KEY_BEATS = new Set(['hook', 'cliffhanger']);
/** cut tier: lower is trimmed first; untagged = 1 keeps legacy round-robin behaviour */
const TIER: Record<string, number> = { setup: 0, increment: 2, reversal: 3, hook: 4, cliffhanger: 4 };
const BEAT_RISK: Record<string, [number, string]> = {
  setup: [0, '铺垫镜，优先裁'],
  increment: [2, '增量镜，砍多了中段没信息'],
  reversal: [4, '反转镜，砍了中段会塌'],
  hook: [6, '开场钩子，砍了前 3 秒抓不住人'],
  cliffhanger: [6, '结尾悬念，砍了下集没人点'],
};
const roleOf = (s: BudgetShot): string | undefined => (typeof s.beatRole === 'string' ? s.beatRole : undefined);
const isKnown = (r: string) => (BEAT_ROLES as readonly string[]).includes(r);

function risk(s: BudgetShot, idx: number, all: BudgetShot[]): [number, string] {
  const notes: string[] = []; let r = 0;
  const role = roleOf(s);
  if (role && isKnown(role)) { const [br, bn] = BEAT_RISK[role]; r += br; notes.push(bn); }
  if (s.dialogue) { r += 5; notes.push('有对白，裁剪需重对口型'); }
  if (s.cast && s.cast.length) { r += 1; notes.push('含角色，影响表演节奏'); }
  if (/^S\d+[a-z]$/.test(s.shotId)) { r += 2; notes.push('连续分镜组成员，影响动作连贯'); }
  if (idx === all.length - 1) { r += 2; notes.push('结尾镜/钩子'); }
  if (!notes.length) notes.push('无对白空镜/氛围镜，连续性风险低');
  return [r, notes.join('；')];
}

export function proposeCuts(spec: { episode?: string; shots: BudgetShot[] }, o: BudgetOpts) {
  const step = o.stepSec ?? 2, floor = o.floorSec ?? 3, prot = new Set(o.protectedShots ?? []);
  const protectBeats = o.protectBeats ?? true;
  const shots = spec.shots;
  const unknownBeatRoles = shots.filter(s => s.beatRole !== undefined && s.beatRole !== null && !(typeof s.beatRole === 'string' && isKnown(s.beatRole))).map(s => s.shotId);
  const beatProtected = protectBeats ? shots.filter(s => KEY_BEATS.has(roleOf(s) ?? '')).map(s => s.shotId) : [];
  const autoProt = new Set([...beatProtected, ...unknownBeatRoles]);
  const total = shots.reduce((a, s) => a + s.durSec, 0);
  const stamps = { identity: 'PENDING_REVIEW', V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN' } as const;
  const base = { episode: spec.episode, maxSec: o.maxSec, totalSec: total, applied: false as const, stamps, beatProtected, unknownBeatRoles };
  if (total <= o.maxSec) return { ...base, status: 'NO_CUT_NEEDED' as const, cuts: [], newTotalSec: total, shortfallSec: 0 };
  const tierOf = (s: BudgetShot) => { const r = roleOf(s); return r && r in TIER ? TIER[r] : 1; };
  const cand = shots.map((s, i) => ({ s, i, rn: risk(s, i, shots), t: tierOf(s) }))
    .filter(c => !prot.has(c.s.shotId) && !autoProt.has(c.s.shotId) && (o.allowDialogue || !c.s.dialogue))
    .sort((a, b) => a.t - b.t || a.rn[0] - b.rn[0] || a.i - b.i);
  const cur = new Map(shots.map(s => [s.shotId, s.durSec]));
  let need = total - o.maxSec;
  for (const tier of [...new Set(cand.map(c => c.t))]) {
    const group = cand.filter(c => c.t === tier);
    for (let pass = 0; need > 0 && pass < 10; pass++) {
      let progressed = false;
      for (const c of group) {
        if (need <= 0) break;
        const min = Math.max(floor, voMinSec(c.s.vo, o.charsPerSec));
        const d = cur.get(c.s.shotId)!;
        const cut = Math.min(step, d - min, need);
        if (cut <= 0) continue;
        cur.set(c.s.shotId, d - cut); need -= cut; progressed = true;
      }
      if (!progressed) break;
    }
    if (need <= 0) break;
  }
  const cuts: CutProposal[] = cand.filter(c => cur.get(c.s.shotId)! < c.s.durSec)
    .sort((a, b) => a.i - b.i)
    .map(c => ({ shotId: c.s.shotId, fromSec: c.s.durSec, toSec: cur.get(c.s.shotId)!, risk: c.rn[0], riskNote: c.rn[1] }));
  const newTotal = total - cuts.reduce((a, c) => a + c.fromSec - c.toSec, 0);
  return { ...base, status: need > 0 ? 'INFEASIBLE' as const : 'PROPOSED' as const, cuts, newTotalSec: newTotal, shortfallSec: Math.max(0, need) };
}
