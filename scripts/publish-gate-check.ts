/** usage: publish-gate-check --episode ep01 --mp4 M --qc-dir Q --detectors D --g3 G3_SIGNOFF.json   (read-only; there is no publish action) */
import { evaluateCanPublish } from '@/agents/v15/publish-gate';
const a = process.argv.slice(2); const g = (k: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : ''; };
evaluateCanPublish({ episodeId: g('--episode'), episodeMp4: g('--mp4'), qcDir: g('--qc-dir'), detectorsReport: g('--detectors'), g3ReceiptPath: g('--g3') })
  .then(r => { console.log(JSON.stringify(r, null, 2)); process.exit(r.canPublish ? 0 : 60); });
