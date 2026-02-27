import type { ActionBlockDefinition } from './actionBlockRegistry';
import {
  registerActionBlock,
  getActionBlock,
  getAllActionBlocks,
  getActionBlocksByCategory,
  clearActionBlockRegistry,
} from './actionBlockRegistry';

const DummyBlock = () => null;

function makeDef(overrides: Partial<ActionBlockDefinition> = {}): ActionBlockDefinition {
  return {
    type: 'test',
    label: 'Test Block',
    category: 'basic',
    BlockComponent: DummyBlock,
    ...overrides,
  };
}

describe('actionBlockRegistry', () => {
  beforeEach(() => clearActionBlockRegistry());

  it('registers and retrieves an action block', () => {
    const def = makeDef();
    registerActionBlock(def);

    const result = getActionBlock('test');
    expect(result).toBe(def);
    expect(result?.type).toBe('test');
    expect(result?.label).toBe('Test Block');
    expect(result?.category).toBe('basic');
    expect(result?.BlockComponent).toBe(DummyBlock);
  });

  it('returns undefined for unknown type', () => {
    expect(getActionBlock('nonexistent')).toBeUndefined();
  });

  it('getAllActionBlocks returns all registered blocks', () => {
    const defA = makeDef({ type: 'a', label: 'Block A' });
    const defB = makeDef({ type: 'b', label: 'Block B', category: 'logic' });
    registerActionBlock(defA);
    registerActionBlock(defB);

    const all = getAllActionBlocks();
    expect(all).toHaveLength(2);
    expect(all).toContain(defA);
    expect(all).toContain(defB);
  });

  it('getActionBlocksByCategory groups by category correctly', () => {
    registerActionBlock(makeDef({ type: 'varOp', label: 'Variable Op', category: 'basic' }));
    registerActionBlock(makeDef({ type: 'cond', label: 'Conditional', category: 'logic' }));
    registerActionBlock(makeDef({ type: 'loop', label: 'Loop', category: 'logic' }));
    registerActionBlock(makeDef({ type: 'eval', label: 'Eval', category: 'script' }));

    const grouped = getActionBlocksByCategory();

    expect(Object.keys(grouped)).toHaveLength(3);
    expect(grouped['basic']).toHaveLength(1);
    expect(grouped['basic']![0]!.type).toBe('varOp');
    expect(grouped['logic']).toHaveLength(2);
    expect(grouped['logic']!.map((d) => d.type)).toEqual(['cond', 'loop']);
    expect(grouped['script']).toHaveLength(1);
    expect(grouped['script']![0]!.type).toBe('eval');
    expect(grouped['template']).toBeUndefined();
  });

  it('clearActionBlockRegistry clears all entries', () => {
    registerActionBlock(makeDef({ type: 'a' }));
    registerActionBlock(makeDef({ type: 'b' }));
    expect(getAllActionBlocks()).toHaveLength(2);

    clearActionBlockRegistry();

    expect(getAllActionBlocks()).toHaveLength(0);
    expect(getActionBlock('a')).toBeUndefined();
    expect(getActionBlock('b')).toBeUndefined();
  });

  it('warns and overwrites when registering a duplicate type', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const first = makeDef({ type: 'dup', label: 'First' });
    const second = makeDef({ type: 'dup', label: 'Second' });

    registerActionBlock(first);
    registerActionBlock(second);

    expect(warnSpy).toHaveBeenCalledWith('ActionBlock "dup" is already registered. Overwriting.');
    expect(getActionBlock('dup')).toBe(second);

    warnSpy.mockRestore();
  });
});
