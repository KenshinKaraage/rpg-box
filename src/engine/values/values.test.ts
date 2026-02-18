import type { GameContext } from '../runtime/GameContext';
import type { ValueSource } from './types';
import { resolveValue } from './registry';

// Import to trigger registration
import './register';

function createMockContext(
  vars: Record<string, unknown> = {},
  data: Record<string, unknown> = {}
): GameContext {
  return {
    variable: {
      get: jest.fn((name: string) => vars[name]),
      set: jest.fn(),
      getAll: jest.fn(() => ({ ...vars })),
    },
    data,
  } as unknown as GameContext;
}

describe('ValueSource', () => {
  describe('literal', () => {
    it('resolves number literal', () => {
      const source: ValueSource = { type: 'literal', value: 42 };
      expect(resolveValue(source, createMockContext())).toBe(42);
    });

    it('resolves string literal', () => {
      const source: ValueSource = { type: 'literal', value: 'hello' };
      expect(resolveValue(source, createMockContext())).toBe('hello');
    });

    it('resolves boolean literal', () => {
      const source: ValueSource = { type: 'literal', value: true };
      expect(resolveValue(source, createMockContext())).toBe(true);
    });
  });

  describe('variable', () => {
    it('resolves variable value from context', () => {
      const source: ValueSource = { type: 'variable', variableId: 'hp' };
      const ctx = createMockContext({ hp: 100 });
      expect(resolveValue(source, ctx)).toBe(100);
    });

    it('returns undefined for missing variable', () => {
      const source: ValueSource = { type: 'variable', variableId: 'missing' };
      expect(resolveValue(source, createMockContext())).toBeUndefined();
    });
  });

  describe('data', () => {
    it('resolves data entry field value', () => {
      const entries = [
        { id: 'slime', name: 'スライム', hp: 30 },
        { id: 'dragon', name: 'ドラゴン', hp: 500 },
      ] as unknown[];
      // Add ID-based access
      (entries as Record<string, unknown>)['slime'] = entries[0];
      (entries as Record<string, unknown>)['dragon'] = entries[1];

      const source: ValueSource = {
        type: 'data',
        dataTypeId: 'enemy',
        entryId: 'slime',
        fieldId: 'hp',
      };
      const ctx = createMockContext({}, { enemy: entries });
      expect(resolveValue(source, ctx)).toBe(30);
    });

    it('returns undefined for missing data type', () => {
      const source: ValueSource = {
        type: 'data',
        dataTypeId: 'nonexistent',
        entryId: 'x',
        fieldId: 'y',
      };
      expect(resolveValue(source, createMockContext())).toBeUndefined();
    });
  });

  describe('random', () => {
    it('resolves to number within range', () => {
      const source: ValueSource = { type: 'random', min: 1, max: 6 };
      const ctx = createMockContext();

      for (let i = 0; i < 100; i++) {
        const result = resolveValue(source, ctx) as number;
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it('returns exact value when min equals max', () => {
      const source: ValueSource = { type: 'random', min: 5, max: 5 };
      expect(resolveValue(source, createMockContext())).toBe(5);
    });
  });

  describe('unknown type', () => {
    it('throws for unregistered type', () => {
      const source = { type: 'nonexistent' } as unknown as ValueSource;
      expect(() => resolveValue(source, createMockContext())).toThrow(
        'Unknown ValueSource type: nonexistent'
      );
    });
  });
});
