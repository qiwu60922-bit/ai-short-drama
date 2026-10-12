/**
 * QC triptych summary page: one row per shot (first | mid | last) for human identity review.
 * Writes qc/index.html + qc/index.md with relative image paths. Status shown as recorded; never upgraded.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { ShotQcRecord } from './shot-qc-record';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function loadQcRecords(qcDir: string, order?: string[]): Promise<ShotQcRecord[]> {
  const dirs = (await readdir(qcDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  const recs: ShotQcRecord[] = [];
  for (const d of dirs) {
    try { recs.push(JSON.parse(await readFile(join(qcDir, d, 'qc-record.json'), 'utf8'))); } catch { /* no record */ }
  }
  const pos = (id: string) => { const i = order?.indexOf(id) ?? -1; return i < 0 ? Number.MAX_SAFE_INTEGER : i; };
  return recs.sort((a, b) => pos(a.shotId) - pos(b.shotId) || a.shotId.localeCompare(b.shotId));
}

export interface QcPageMeta { title: string; prompts?: Record<string, string>; review?: boolean; episodeId?: string; }

function reviewControls(r: ShotQcRecord): string {
  const id = esc(r.shotId);
  const sha = esc(JSON.stringify(r.stills.map((s) => s.contentSha256)));
  return `<div class="rv" data-shot="${id}" data-stills='${sha}'>
<label><input type="radio" name="verdict-${id}" value="HUMAN_PASS"> 通过</label>
<label><input type="radio" name="verdict-${id}" value="HUMAN_FAIL"> 不通过</label>
<label><input type="radio" name="verdict-${id}" value=""> 暂不判</label>
<input type="text" id="note-${id}" placeholder="备注（不通过必填）" size="60"></div>`;
}

const REVIEW_SCRIPT = `<script>
(function(){
  var BAD=/^(auto|bot|agent|system|ci|grok|grok ?bot|ai|machine)$/i;
  document.getElementById('export-review').addEventListener('click',function(){
    var reviewer=(document.getElementById('reviewer').value||'').trim();
    var msg=document.getElementById('review-msg');
    if(!reviewer||BAD.test(reviewer)){msg.textContent='请填写真实审核人姓名';return;}
    var verdicts=[],errs=[];
    document.querySelectorAll('.rv').forEach(function(el){
      var id=el.getAttribute('data-shot');
      var sel=el.querySelector('input[type=radio]:checked');
      if(!sel||!sel.value)return;
      var note=(document.getElementById('note-'+id).value||'').trim();
      if(sel.value==='HUMAN_FAIL'&&!note){errs.push(id);return;}
      verdicts.push({shotId:id,verdict:sel.value,note:note,stillsSha256:JSON.parse(el.getAttribute('data-stills'))});
    });
    if(errs.length){msg.textContent='不通过须填备注：'+errs.join(', ');return;}
    if(!verdicts.length){msg.textContent='至少判一个镜头';return;}
    var data={schemaVersion:1,reviewer:reviewer,reviewedAt:new Date().toISOString(),verdicts:verdicts};
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    a.download='qc-review-'+reviewer+'-'+Date.now()+'.json';a.click();
    msg.textContent='已导出 '+verdicts.length+' 条；用 qc:import-review 导回';
  });
})();
</script>`;

export function renderQcHtml(recs: ShotQcRecord[], baseDir: string, meta: QcPageMeta): string {
  const pending = recs.filter((r) => r.identity.status === 'PENDING_REVIEW').length;
  const rows = recs.map((r) => {
    const imgs = r.stills.map((s) => `<figure><img src="${esc(relative(baseDir, s.path))}" alt="${esc(r.shotId)} ${s.role}" loading="lazy"><figcaption>${s.role} @ ${s.timeSeconds}s</figcaption></figure>`).join('');
    const prompt = meta.prompts?.[r.shotId];
    return `<section><h2>${esc(r.shotId)} <span class="st ${esc(r.identity.status)}">${esc(r.identity.status)}</span></h2>
<p class="meta">${r.probe.width}×${r.probe.height}@${Math.round(r.probe.fps * 100) / 100} · ${r.probe.durationSeconds}s · take sha ${esc((r.takeSha256 ?? '').slice(0, 12))} · reviewer ${esc(r.identity.reviewer ?? '—')}</p>
${prompt ? `<pre>${esc(prompt)}</pre>` : ''}<div class="row">${imgs}</div>${meta.review ? reviewControls(r) : ''}</section>`;
  }).join('\n');
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>${esc(meta.title)}</title>
<style>body{font-family:sans-serif;margin:16px;background:#111;color:#eee}.row{display:flex;gap:8px}figure{margin:0;flex:1}img{width:100%;border:1px solid #444}
figcaption,.meta{font-size:12px;color:#aaa}.st{font-size:12px;padding:2px 6px;border-radius:4px;background:#664}.HUMAN_PASS{background:#264}.HUMAN_FAIL{background:#622}
pre{white-space:pre-wrap;font-size:12px;color:#ccc}.banner{background:#422;padding:8px;border-radius:4px}</style></head><body>
<h1>${esc(meta.title)}</h1><p class="banner">人工身份三帧复核用 · 待复核 ${pending}/${recs.length} · 无自动通过 · V11_G3 = NOT_EVALUATED · publish = FORBIDDEN</p>
${meta.review ? `<div class="banner">审核人：<input type="text" id="reviewer" placeholder="真实姓名"> <button id="export-review">导出复核结果 JSON</button> <span id="review-msg"></span><br><small>只在本机生成文件；导入后仅改身份栏，G3 仍未评估。</small></div>` : ''}
${rows}${meta.review ? REVIEW_SCRIPT : ''}</body></html>\n`;
}

export function renderQcMarkdown(recs: ShotQcRecord[], baseDir: string, meta: { title: string }): string {
  const lines = [`# ${meta.title}`, '', '> 人工身份三帧复核 · 无自动通过 · V11_G3 = NOT_EVALUATED · publish = FORBIDDEN', '',
    '| 镜头 | 状态 | 首帧 | 中帧 | 末帧 |', '|---|---|---|---|---|'];
  for (const r of recs) {
    const cell = (role: string) => { const s = r.stills.find((x) => x.role === role); return s ? `![](${relative(baseDir, s.path)})` : '—'; };
    lines.push(`| ${r.shotId} | ${r.identity.status} | ${cell('first')} | ${cell('mid')} | ${cell('last')} |`);
  }
  return lines.join('\n') + '\n';
}

export async function writeQcSummary(qcDir: string, meta: QcPageMeta & { order?: string[] }) {
  const recs = await loadQcRecords(qcDir, meta.order);
  const html = join(qcDir, 'index.html'), md = join(qcDir, 'index.md');
  await writeFile(html, renderQcHtml(recs, qcDir, meta));
  await writeFile(md, renderQcMarkdown(recs, qcDir, meta));
  return { html, md, count: recs.length, pending: recs.filter((r) => r.identity.status === 'PENDING_REVIEW').length };
}
