/** V14 · factory with real repo modules (fake H3 + fake TTS), real ffmpeg, small canvas. */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os'; import { join, resolve } from 'node:path';
import { runFactory, loadQueue, FACTORY_EXIT } from '@/agents/factory/factory-run';
import { repoHandlers } from '@/agents/factory/repo-handlers';
import { readLedger } from '@/agents/ledger/generation-ledger';
const fx = (n: string) => JSON.parse(readFileSync(resolve(__dirname, '../../fixtures/wave14-ep01', n), 'utf8'));
const SPEC = fx('SHOT_SPEC.json'), BEAT = fx('WAVE14_EP01_BEATPLAN.json'), REF = fx('REF_INDEX.json');
const small = { width: 160, height: 96, fps: 24 };
const tmp = () => mkdtempSync(join(tmpdir(), 'facr-'));
describe('factory with repo modules', () => {
  it('without rehearsal opt-in, LOCK_CANDIDATE pack stops at pack_lock (machine never locks)', async () => {
    const w = tmp();
    const r = await runFactory({ episodeId: 'ep01', workDir: w, providers: { h3: 'fake', dub: 'fake' } }, repoHandlers({ shotSpec: SPEC, beatPlan: BEAT, refIndex: REF, canvas: small }));
    expect(r.exitCode).toBe(FACTORY_EXIT.STEP_FAILED); expect(r.stoppedAt).toBe('pack_lock');
  });
  it('full EP01 fake run: mp4 with audio, reencode DTS ok, SRT, ledger (h3+tts), detectors, asset index; never PASS', async () => {
    const w = tmp();
    const r = await runFactory({ episodeId: 'ep01', workDir: w, providers: { h3: 'fake', dub: 'fake' } },
      repoHandlers({ shotSpec: SPEC, beatPlan: BEAT, refIndex: REF, canvas: small, allowCandidatesForRehearsal: true }));
    expect(r.exitCode).toBe(0); expect(r.status).toBe('DONE_AWAITING_HUMAN_REVIEW');
    const q = loadQueue(w); const out = (s: string) => q.tasks.find(t => t.step === s)!.output;
    expect(out('pack_lock').packStatus).toBe('CANDIDATES_REHEARSAL_ONLY');
    const st = out('stitch'); expect(st.dtsOk).toBe(true); expect(st.totalSec).toBeCloseTo(90, 0);
    const streams = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', st.episodeMp4]).toString();
    expect(streams).toMatch(/video/); expect(streams).toMatch(/audio/);
    expect(readFileSync(out('sub').srt, 'utf8')).toMatch(/00:00:00,000 --> 00:00:04,000/);
    const led = readLedger(join(w, 'LEDGER.jsonl')); expect(led.filter(e => e.provider === 'fake-h3')).toHaveLength(16); expect(led.some(e => e.provider === 'fake-tts')).toBe(true);
    expect(['INCOMPLETE', 'FAIL']).toContain(out('qc').detectors); expect(out('qc').review.status).toBe('PENDING_HUMAN');
    expect(out('qc').assets).toBeGreaterThan(16 * 4);
    expect(JSON.stringify(q)).not.toMatch(/"PASS"|"g3":\s*true/);
  }, 240_000);
  it('paid H3 without HUMAN_GO stops before generation even with repo handlers', async () => {
    const w = tmp();
    const r = await runFactory({ episodeId: 'ep01', workDir: w, providers: { h3: 'minimax_live', dub: 'fake' } },
      repoHandlers({ shotSpec: SPEC, beatPlan: BEAT, refIndex: REF, canvas: small, allowCandidatesForRehearsal: true }));
    expect(r.exitCode).toBe(FACTORY_EXIT.AWAITING_HUMAN_GO); expect(existsSync(join(w, 'h3', 'run'))).toBe(false);
  });
});
