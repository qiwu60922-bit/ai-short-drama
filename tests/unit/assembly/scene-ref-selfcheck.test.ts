/** Scene ref pre-lock self-check: exists/format/size/sha; person detection NOT_CHECKED; never auto-lock. */
import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { checkSceneRefFile, selfCheckSceneEntries, readPngSize } from '@/agents/assembly/scene-ref-selfcheck';

const tmp = () => mkdtempSync(join(tmpdir(), 'sc-'));
function crc32(buf: Buffer) { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); } return ~c >>> 0; }
function chunk(type: string, data: Buffer) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w: number, h: number) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const write = (d: string, name: string, buf: Buffer) => { const p = join(d, name); writeFileSync(p, buf); return { p, sha: createHash('sha256').update(buf).digest('hex') }; };

describe('png size', () => {
  it('reads IHDR; null for non-png', () => {
    expect(readPngSize(png(1344, 768))).toEqual({ width: 1344, height: 768 });
    expect(readPngSize(Buffer.from('GIF89a....'))).toBeNull();
  });
});

describe('checkSceneRefFile', () => {
  it('valid 1344x768 png with matching sha → READY_FOR_HUMAN_LOCK, person NOT_CHECKED, autoLock FORBIDDEN', () => {
    const d = tmp(); const { p, sha } = write(d, 'a.png', png(1344, 768));
    const r = checkSceneRefFile(p, { expectedSha256: sha });
    expect(r.checks).toMatchObject({ exists: 'PASS', format: 'PASS', size: 'PASS', sha256: 'PASS', noPerson: 'NOT_CHECKED' });
    expect(r.verdict).toBe('READY_FOR_HUMAN_LOCK');
    expect(r.autoLock).toBe('FORBIDDEN');
    expect(r.sha256).toBe(sha);
  });
  it('missing / wrong size / non-png / sha mismatch → BLOCKED with reasons', () => {
    const d = tmp();
    expect(checkSceneRefFile(join(d, 'nope.png')).verdict).toBe('BLOCKED');
    const s = write(d, 's.png', png(1280, 720));
    expect(checkSceneRefFile(s.p).checks.size).toBe('FAIL');
    const j = write(d, 'j.png', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]));
    expect(checkSceneRefFile(j.p).checks.format).toBe('FAIL');
    const ok = write(d, 'o.png', png(1344, 768));
    const r = checkSceneRefFile(ok.p, { expectedSha256: '0'.repeat(64) });
    expect(r.checks.sha256).toBe('FAIL');
    expect(r.verdict).toBe('BLOCKED');
  });
  it('no registered sha → sha256 NOT_REGISTERED and BLOCKED (must be recorded before lock)', () => {
    const d = tmp(); const { p } = write(d, 'a.png', png(1344, 768));
    const r = checkSceneRefFile(p);
    expect(r.checks.sha256).toBe('NOT_REGISTERED');
    expect(r.verdict).toBe('BLOCKED');
  });
});

describe('selfCheckSceneEntries', () => {
  it('checks only kind=scene entries; never mutates status', () => {
    const d = tmp(); const a = write(d, 'a.png', png(1344, 768)); const b = write(d, 'b.png', png(10, 10));
    const idx = {
      'qi-ye': { status: 'HUMAN_LOCK', files: [] },
      'scene-ep01-s01': { kind: 'scene', status: 'LOCK_CANDIDATE', shots: ['S01'], files: [{ path: a.p, sha256: a.sha }] },
      'scene-ep01-s14': { kind: 'scene', status: 'LOCK_CANDIDATE', shots: ['S14'], files: [{ path: b.p, sha256: b.sha }] },
      'scene-x': { kind: 'scene', status: 'SPEC_PENDING', shots: ['S99'], files: [] },
    };
    const before = JSON.stringify(idx);
    const r = selfCheckSceneEntries(idx);
    expect(r.map((x) => [x.sceneId, x.verdict])).toEqual([['scene-ep01-s01', 'READY_FOR_HUMAN_LOCK'], ['scene-ep01-s14', 'BLOCKED'], ['scene-x', 'BLOCKED']]);
    expect(r[2].reasons.join()).toMatch(/no files/);
    expect(JSON.stringify(idx)).toBe(before);
    expect(r.every((x) => x.autoLock === 'FORBIDDEN')).toBe(true);
  });
});

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const hasPil = (() => { try { execFileSync('python3', ['-c', 'import PIL'], { stdio: 'ignore' }); return true; } catch { return false; } })();
describe('schematic generator', () => {
  it.skipIf(!hasPil)('produces deterministic 1344x768 PNGs that pass self-check once sha registered', () => {
    const out = tmp(); const out2 = tmp();
    const gen = resolve(__dirname, '../../../scripts/scene-schematics/gen_ep01_scene_schematics.py');
    execFileSync('python3', [gen, out]); execFileSync('python3', [gen, out2]);
    for (const sid of ['scene-ep01-s01', 'scene-ep01-s14']) {
      const p = join(out, sid, 'SCHEMATIC_PLACEHOLDER_v1.png');
      const sha = createHash('sha256').update(readFileSync(p)).digest('hex');
      expect(createHash('sha256').update(readFileSync(join(out2, sid, 'SCHEMATIC_PLACEHOLDER_v1.png'))).digest('hex')).toBe(sha);
      const r = checkSceneRefFile(p, { expectedSha256: sha });
      expect(r.verdict).toBe('READY_FOR_HUMAN_LOCK');
      expect(r.checks.noPerson).toBe('NOT_CHECKED');
      expect(readFileSync(p).toString('latin1')).toContain('SCHEMATIC PLACEHOLDER');
    }
  }, 60_000);
});
