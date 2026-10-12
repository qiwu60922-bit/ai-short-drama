/** V12 Duration Budgeter — proposes ranked cut candidates to fit a max duration. Never auto-applies. */
export interface BudgetShot { shotId: string; durSec: number; dialogue?: unknown; vo?: string | null; cast?: unknown[] }
export interface BudgetOpts { maxSec: number; protectedShots?: string[]; stepSec?: number; floorSec?: number; allowDialogue?: boolean; charsPerSec?: number }
export interface CutProposal { shotId: string; fromSec: number; toSec: number; risk: number; riskNote: string }
export const voMinSec = (vo?: string | null, cps = 4) => (vo ? Math.ceil(vo.replace(/\s|[，。！？、…—]/g, '').length / cps) : 0);

function risk(s: BudgetShot, idx: number, all: BudgetShot[]): [number, string] {
  const notes: string[] = []; let r = 0;
  if (s.dialogue) { r += 5; notes.push('有对白，裁剪需重对口型'); }
  if (s.cast && s.cast.length) { r += 1; notes.push('含角色，影响表演节奏'); }
  if (/^S\d+[a-z]$/.test(s.shotId)) { r += 2; notes.push('连续分镜组成员，影响动作连贯'); }
  if (idx === all.length - 1) { r += 2; notes.push('结尾镜/钩子'); }
  if (!notes.length) notes.push('无对白空镜/氛围镜，连续性风险低');
  return [r, notes.join('；')];
}

export function proposeCuts(spec: { episode?: string; shots: BudgetShot[] }, o: BudgetOpts) {
  const step = o.stepSec ?? 2, floor = o.floorSec ?? 3, prot = new Set(o.protectedShots ?? []);
  const shots = spec.shots;
  const total = shots.reduce((a, s) => a + s.durSec, 0);
  const stamps = { identity: 'PENDING_REVIEW', V11_G3: 'NOT_EVALUATED', publish: 'FORBIDDEN' } as const;
  const base = { episode: spec.episode, maxSec: o.maxSec, totalSec: total, applied: false as const, stamps };
  if (total <= o.maxSec) return { ...base, status: 'NO_CUT_NEEDED' as const, cuts: [], newTotalSec: total, shortfallSec: 0 };
  const cand = shots.map((s, i) => ({ s, i, rn: risk(s, i, shots) }))
    .filter(c => !prot.has(c.s.shotId) && (o.allowDialogue || !c.s.dialogue))
    .sort((a, b) => a.rn[0] - b.rn[0] || a.i - b.i);
  const cur = new Map(shots.map(s => [s.shotId, s.durSec]));
  let need = total - o.maxSec;
  for (let pass = 0; need > 0 && pass < 10; pass++) {
    let progressed = false;
    for (const c of cand) {
      if (need <= 0) break;
      const min = Math.max(floor, voMinSec(c.s.vo, o.charsPerSec));
      const d = cur.get(c.s.shotId)!;
      const cut = Math.min(step, d - min, need);
      if (cut <= 0) continue;
      cur.set(c.s.shotId, d - cut); need -= cut; progressed = true;
    }
    if (!progressed) break;
  }
  const cuts: CutProposal[] = cand.filter(c => cur.get(c.s.shotId)! < c.s.durSec)
    .sort((a, b) => a.i - b.i)
    .map(c => ({ shotId: c.s.shotId, fromSec: c.s.durSec, toSec: cur.get(c.s.shotId)!, risk: c.rn[0], riskNote: c.rn[1] }));
  const newTotal = total - cuts.reduce((a, c) => a + c.fromSec - c.toSec, 0);
  return { ...base, status: need > 0 ? 'INFEASIBLE' as const : 'PROPOSED' as const, cuts, newTotalSec: newTotal, shortfallSec: Math.max(0, need) };
}
