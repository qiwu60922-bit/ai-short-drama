/**
 * V12 suite fixtures for factory/ep01 rehearsal (default warn). Offline ≠Final ≠G3.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateStoryLedgerSuite } from '@/agents/assembly/story-ledger-suite';
import { evaluateShotSpecSuite } from '@/agents/assembly/shot-spec-suite';

const fx = (name: string) =>
  JSON.parse(readFileSync(resolve(__dirname, `../../fixtures/v12/${name}`), 'utf8'));

describe('v12 suite fixtures', () => {
  it('story-ledger-suite.v12.json → PASS', () => {
    const r = evaluateStoryLedgerSuite(fx('story-ledger-suite.v12.json'));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.ran).toBeGreaterThan(0);
    expect(r.gates).toEqual({ Final: 'NOT_EVALUATED', V11_G3: 'NOT_EVALUATED' });
  });

  it('shot-spec-suite.v12.json → PASS', () => {
    const r = evaluateShotSpecSuite(fx('shot-spec-suite.v12.json'));
    expect(r.verdict).toBe('PASS');
    expect(r.metrics.ran).toBeGreaterThanOrEqual(4);
    expect(r.results.dialogueExposition.status).toBe('PASS');
    expect(r.results.seriesRhythm.status).toBe('PASS');
  });
});
