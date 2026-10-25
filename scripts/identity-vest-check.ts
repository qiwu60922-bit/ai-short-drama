/**
 * V12 Identity-Vest Gate CLI (offline).
 * npx tsx scripts/identity-vest-check.ts LEDGER.json
 * 马甲/隐藏真身份账本 · 延迟掉落. Exit 0 PASS · 36 FAIL · 2 usage.
 * PASS ≠ Final ≠ G3. Reverse-engineered from 2026-10-25 hits
 * 《机长先生，你的未婚妻嫁人了》《无敌贾二虎》《轻烟染日暮》.
 */
import { readFileSync } from 'node:fs';
import { evaluateIdentityVest } from '@/agents/assembly/identity-vest-gate';

const a = process.argv;
const file = a[2];
if (!file || file.startsWith('--')) {
  process.stderr.write('usage: identity-vest-check LEDGER.json\n');
  process.exit(2);
}
const r = evaluateIdentityVest(JSON.parse(readFileSync(file, 'utf8')));
process.stdout.write(JSON.stringify(r, null, 2) + '\n');
process.exit(r.verdict === 'PASS' ? 0 : 36);
