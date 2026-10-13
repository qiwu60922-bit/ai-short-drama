import { describe, it, expect } from 'vitest';
import { createNamespaceRegistry, DEFAULT_DRAMA_ID } from '@/agents/v15/character-namespaces';
const reg = () => createNamespaceRegistry([
  { dramaId: DEFAULT_DRAMA_ID, characters: ['qi-ye', 'fei-yue-li', 'zhui-yu-shitu'], archived: ['ye-yuan'] },
  { dramaId: 'xinghe', characters: ['lin-che', 'qi-ye'] },
]);
describe('multi-drama character namespaces', () => {
  it('qualified ids resolve per drama', () => {
    const r = reg();
    expect(r.resolve('xinghe/lin-che')).toBe('xinghe/lin-che');
    expect(r.resolve('xinghe/Qi_Ye')).toBe('xinghe/qi-ye');
  });
  it('unqualified ids resolve within the given drama; legacy default drama works', () => {
    const r = reg();
    expect(r.resolve('fei-yue-li')).toBe(`${DEFAULT_DRAMA_ID}/fei-yue-li`);
    expect(r.resolve('qi-ye', { dramaId: 'xinghe' })).toBe('xinghe/qi-ye');
    expect(() => r.resolve('lin-che')).toThrow(/UNKNOWN/);
  });
  it('same short id in two dramas never cross-resolves', () => {
    const r = reg();
    expect(r.resolve('qi-ye')).not.toBe(r.resolve('qi-ye', { dramaId: 'xinghe' }));
    expect(() => r.resolve('fei-yue-li', { dramaId: 'xinghe' })).toThrow(/UNKNOWN/);
  });
  it('archived per drama stays read-only', () => {
    const r = reg();
    expect(() => r.resolve('ye-yuan')).toThrow(/ARCHIVED/);
    expect(r.resolve('ye-yuan', { allowArchived: true })).toBe(`${DEFAULT_DRAMA_ID}/ye-yuan`);
  });
  it('rejects bad drama ids, duplicate dramas, unknown drama', () => {
    expect(() => createNamespaceRegistry([{ dramaId: 'Bad Id', characters: [] }])).toThrow();
    expect(() => createNamespaceRegistry([{ dramaId: 'aa', characters: [] }, { dramaId: 'aa', characters: [] }])).toThrow(/duplicate/);
    expect(() => reg().resolve('nope/qi-ye')).toThrow(/drama/);
  });
  it('assertCast qualifies a whole cast list', () => {
    expect(reg().assertCast(['qi-ye', 'xinghe/lin-che'])).toEqual([`${DEFAULT_DRAMA_ID}/qi-ye`, 'xinghe/lin-che']);
  });
  it('default drama mirrors V12 registry', async () => {
    const { CHARACTER_IDS } = await import('@/agents/ledger/character-registry');
    expect(createNamespaceRegistry().list(DEFAULT_DRAMA_ID)).toEqual([...CHARACTER_IDS]);
  });
});
