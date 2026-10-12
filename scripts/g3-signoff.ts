/** HUMAN ONLY. usage: g3-signoff --episode ep01 --mp4 episode.mp4 --detectors detectors-report.json --out-dir DIR [--decision G3_PASS|G3_FAIL] [--ack identity,lipsync]
 *  Interactive: asks signer name + typed confirmation phrase. Refuses non-TTY and agent/CI environments. Agents must never run this. */
import { createInterface } from 'node:readline/promises';
import { createG3Signoff, writeG3Signoff, G3_CONFIRM_PHRASE } from '@/agents/v15/publish-gate';
const a = process.argv.slice(2); const g = (k: string) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const ep = g('--episode'), mp4 = g('--mp4'), det = g('--detectors'), out = g('--out-dir');
if (!ep || !mp4 || !det || !out) { console.error('usage: see header'); process.exit(2); }
if (!process.stdin.isTTY) { console.error('refused: G3 sign-off must be interactive (TTY)'); process.exit(3); }
(async () => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const signer = await rl.question('签署人姓名: ');
  const phrase = await rl.question(`请逐字输入「${G3_CONFIRM_PHRASE} ${ep}」: `); rl.close();
  try {
    const r = createG3Signoff({ episodeId: ep, signer, decision: (g('--decision') as 'G3_PASS' | 'G3_FAIL') ?? 'G3_PASS', episodeMp4: mp4, detectorsReport: det,
      acknowledgedIncomplete: (g('--ack') ?? '').split(',').filter(Boolean) }, { isTTY: !!process.stdin.isTTY, typedPhrase: phrase, env: process.env });
    console.log(writeG3Signoff(out, r));
  } catch (e) { console.error(`refused: ${(e as Error).message}`); process.exit(3); }
})();
