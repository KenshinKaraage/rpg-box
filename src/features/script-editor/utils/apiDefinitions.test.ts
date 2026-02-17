import '@/types/fields'; // register field types

import type { Monaco } from '@monaco-editor/react';

import type { Script } from '@/types/script';
import { createScript } from '@/types/script';

import {
  SCRIPT_API_DECLARATIONS,
  registerApiDefinitions,
  generateScriptDeclarations,
  generateArgDeclarations,
  generateDataDeclarations,
  updateScriptDeclarations,
  updateDataDeclarations,
} from './apiDefinitions';
import type { DataTypeInfo } from './apiDefinitions';

describe('apiDefinitions', () => {
  describe('SCRIPT_API_DECLARATIONS', () => {
    it('contains scriptAPI declaration', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('declare const scriptAPI');
    });

    it('contains showMessage method', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('showMessage');
    });

    it('contains showChoice method', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('showChoice');
    });

    it('contains getVar method', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('getVar');
    });

    it('contains setVar method', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('setVar');
    });

    it('contains showNumberInput method', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('showNumberInput');
    });

    it('contains showTextInput method', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('showTextInput');
    });

    it('contains Variable API declaration', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('declare const Variable');
    });

    it('does not contain static Data declaration (now dynamic)', () => {
      expect(SCRIPT_API_DECLARATIONS).not.toContain('declare const Data');
    });

    it('contains Sound API declaration', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('declare const Sound');
    });

    it('contains Camera API declaration', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('declare const Camera');
    });

    it('contains Save API declaration', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('declare const Save');
    });

    it('does not contain static Script declaration (now dynamic)', () => {
      expect(SCRIPT_API_DECLARATIONS).not.toContain('declare const Script');
    });

    it('contains JSDoc comments for hover documentation', () => {
      expect(SCRIPT_API_DECLARATIONS).toContain('/** メッセージを表示する */');
      expect(SCRIPT_API_DECLARATIONS).toContain('/** 変数の値を取得 */');
    });
  });

  describe('registerApiDefinitions', () => {
    it('registers extra lib with Monaco', () => {
      const addExtraLib = jest.fn();
      const mockMonaco = {
        languages: {
          typescript: {
            javascriptDefaults: {
              getExtraLibs: jest.fn().mockReturnValue({}),
              addExtraLib: addExtraLib,
            },
          },
        },
      };

      registerApiDefinitions(mockMonaco as unknown as Monaco);

      expect(addExtraLib).toHaveBeenCalledWith(
        SCRIPT_API_DECLARATIONS,
        'ts:filename/scriptAPI.d.ts'
      );
    });

    it('does not register duplicate libs', () => {
      const addExtraLib = jest.fn();
      const mockMonaco = {
        languages: {
          typescript: {
            javascriptDefaults: {
              getExtraLibs: jest.fn().mockReturnValue({
                'ts:filename/scriptAPI.d.ts': { content: '' },
              }),
              addExtraLib: addExtraLib,
            },
          },
        },
      };

      registerApiDefinitions(mockMonaco as unknown as Monaco);

      expect(addExtraLib).not.toHaveBeenCalled();
    });
  });

  describe('generateScriptDeclarations', () => {
    it('generates fallback index signature when no callable scripts', () => {
      const result = generateScriptDeclarations([]);
      expect(result).toContain('declare const Script');
      expect(result).toContain('[callId: string]');
    });

    it('generates sync method with no args and no returns as void', () => {
      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        callId: 'testFunc',
      };
      const result = generateScriptDeclarations([script]);
      expect(result).toContain('testFunc(): void');
    });

    it('generates async method as Promise<void>', () => {
      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        callId: 'testFunc',
        isAsync: true,
      };
      const result = generateScriptDeclarations([script]);
      expect(result).toContain('testFunc(): Promise<void>');
    });

    it('generates return type from single return definition', () => {
      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        callId: 'calc',
        returns: [{ id: 'damage', name: 'ダメージ', fieldType: 'number', isArray: false }],
      };
      const result = generateScriptDeclarations([script]);
      expect(result).toContain('calc(): number');
    });

    it('generates async return type wrapped in Promise', () => {
      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        callId: 'calc',
        isAsync: true,
        returns: [{ id: 'damage', name: 'ダメージ', fieldType: 'number', isArray: false }],
      };
      const result = generateScriptDeclarations([script]);
      expect(result).toContain('calc(): Promise<number>');
    });

    it('generates return type from multiple returns as object', () => {
      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        callId: 'calc',
        returns: [
          { id: 'damage', name: 'ダメージ', fieldType: 'number', isArray: false },
          { id: 'isCritical', name: 'クリティカル', fieldType: 'boolean', isArray: false },
        ],
      };
      const result = generateScriptDeclarations([script]);
      expect(result).toContain('{damage: number; isCritical: boolean}');
    });

    it('generates array return type', () => {
      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        callId: 'getIds',
        returns: [{ id: 'ids', name: 'ID一覧', fieldType: 'string', isArray: true }],
      };
      const result = generateScriptDeclarations([script]);
      expect(result).toContain('getIds(): string[]');
    });

    it('generates positional and object overloads for args', () => {
      const script: Script = {
        ...createScript('s1', 'ダメージ計算', 'component'),
        callId: 'calcDamage',
        args: [
          { id: 'attack', name: '攻撃力', fieldType: 'number', required: true },
          { id: 'defense', name: '防御力', fieldType: 'number', required: false },
        ],
      };
      const result = generateScriptDeclarations([script]);
      // 位置引数
      expect(result).toContain('calcDamage(attack: number, defense?: number): void');
      // オブジェクト引数
      expect(result).toContain('calcDamage(args: {attack: number; defense?: number}): void');
    });

    it('uses tsType from FieldType registry', () => {
      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        callId: 'test',
        args: [
          { id: 'name', name: '名前', fieldType: 'string', required: true },
          { id: 'flag', name: 'フラグ', fieldType: 'boolean', required: true },
          { id: 'ids', name: 'ID一覧', fieldType: 'dataList', required: false },
        ],
      };
      const result = generateScriptDeclarations([script]);
      expect(result).toContain('name: string');
      expect(result).toContain('flag: boolean');
      expect(result).toContain('ids?: string[]');
    });

    it('excludes internal scripts', () => {
      const script: Script = {
        ...createScript('s1', 'ヘルパー', 'internal'),
        callId: 'helper',
      };
      const result = generateScriptDeclarations([script]);
      expect(result).not.toContain('helper');
    });

    it('excludes scripts without callId', () => {
      const script = createScript('s1', 'テスト', 'event');
      const result = generateScriptDeclarations([script]);
      expect(result).not.toContain('テスト');
    });

    it('includes description as JSDoc', () => {
      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        callId: 'test',
        description: 'テスト用スクリプト',
      };
      const result = generateScriptDeclarations([script]);
      expect(result).toContain('/** テスト用スクリプト */');
    });

    it('always includes index signature fallback', () => {
      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        callId: 'test',
      };
      const result = generateScriptDeclarations([script]);
      expect(result).toContain('[callId: string]');
    });
  });

  describe('generateArgDeclarations', () => {
    it('returns empty string for null script', () => {
      expect(generateArgDeclarations(null)).toBe('');
    });

    it('returns empty string for script with no args', () => {
      const script = createScript('s1', 'テスト', 'event');
      expect(generateArgDeclarations(script)).toBe('');
    });

    it('generates declare const for each arg with tsType', () => {
      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        args: [
          { id: 'attack', name: '攻撃力', fieldType: 'number', required: true },
          { id: 'name', name: '名前', fieldType: 'string', required: true },
        ],
      };
      const result = generateArgDeclarations(script);
      expect(result).toContain('declare const attack: number;');
      expect(result).toContain('declare const name: string;');
      expect(result).toContain('/** 引数: 攻撃力 */');
      expect(result).toContain('/** 引数: 名前 */');
    });
  });

  describe('generateDataDeclarations', () => {
    it('generates fallback-only declaration when no dataTypes', () => {
      const result = generateDataDeclarations([]);
      expect(result).toContain('declare const Data');
      expect(result).toContain('[typeId: string]');
    });

    it('generates entry interface, collection interface, and typed property', () => {
      const dataTypes: DataTypeInfo[] = [
        {
          id: 'enemy',
          name: 'エネミー',
          fields: [
            { id: 'name', type: 'string' },
            { id: 'hp', type: 'number' },
          ],
        },
      ];
      const result = generateDataDeclarations(dataTypes);
      // Entry interface with id
      expect(result).toContain('interface DataEntry_enemy');
      expect(result).toContain('id: string;');
      expect(result).toContain('name: string;');
      expect(result).toContain('hp: number;');
      // Collection interface extending Array + string index
      expect(result).toContain('interface DataEntries_enemy extends Array<DataEntry_enemy>');
      expect(result).toContain('[id: string]: DataEntry_enemy;');
      // Property on Data
      expect(result).toContain('enemy: DataEntries_enemy;');
    });

    it('generates multiple interfaces for multiple DataTypes', () => {
      const dataTypes: DataTypeInfo[] = [
        {
          id: 'enemy',
          name: 'エネミー',
          fields: [{ id: 'name', type: 'string' }],
        },
        {
          id: 'item',
          name: 'アイテム',
          fields: [
            { id: 'name', type: 'string' },
            { id: 'price', type: 'number' },
          ],
        },
      ];
      const result = generateDataDeclarations(dataTypes);
      expect(result).toContain('interface DataEntry_enemy');
      expect(result).toContain('interface DataEntry_item');
      expect(result).toContain('interface DataEntries_enemy extends Array<DataEntry_enemy>');
      expect(result).toContain('interface DataEntries_item extends Array<DataEntry_item>');
      expect(result).toContain('enemy: DataEntries_enemy;');
      expect(result).toContain('item: DataEntries_item;');
      expect(result).toContain('price: number;');
    });

    it('maps field types correctly via tsType', () => {
      const dataTypes: DataTypeInfo[] = [
        {
          id: 'test',
          name: 'テスト',
          fields: [
            { id: 'flag', type: 'boolean' },
            { id: 'color', type: 'color' },
            { id: 'count', type: 'number' },
          ],
        },
      ];
      const result = generateDataDeclarations(dataTypes);
      expect(result).toContain('flag: boolean;');
      expect(result).toContain('color: string;');
      expect(result).toContain('count: number;');
    });

    it('includes JSDoc with DataType name', () => {
      const dataTypes: DataTypeInfo[] = [
        {
          id: 'enemy',
          name: 'エネミー',
          fields: [{ id: 'name', type: 'string' }],
        },
      ];
      const result = generateDataDeclarations(dataTypes);
      expect(result).toContain('/** エネミー のエントリ */');
      expect(result).toContain('/** エネミー のエントリ一覧');
    });
  });

  describe('updateDataDeclarations', () => {
    it('disposes previous declaration and registers new one', () => {
      const dispose = jest.fn();
      const addExtraLib = jest.fn().mockReturnValue({ dispose });
      const mockMonaco = {
        languages: {
          typescript: {
            javascriptDefaults: { addExtraLib },
          },
        },
      };

      const dataTypes: DataTypeInfo[] = [
        { id: 'enemy', name: 'エネミー', fields: [{ id: 'name', type: 'string' }] },
      ];

      // 初回
      updateDataDeclarations(mockMonaco as unknown as Monaco, dataTypes);
      expect(addExtraLib).toHaveBeenCalledTimes(1);
      expect(dispose).not.toHaveBeenCalled();

      // 2回目 — 前回を破棄
      updateDataDeclarations(mockMonaco as unknown as Monaco, dataTypes);
      expect(dispose).toHaveBeenCalledTimes(1);
      expect(addExtraLib).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateScriptDeclarations', () => {
    it('disposes previous declaration and registers new one', () => {
      const dispose = jest.fn();
      const addExtraLib = jest.fn().mockReturnValue({ dispose });
      const mockMonaco = {
        languages: {
          typescript: {
            javascriptDefaults: { addExtraLib },
          },
        },
      };

      const script: Script = {
        ...createScript('s1', 'テスト', 'event'),
        callId: 'test',
      };

      // 初回
      updateScriptDeclarations(mockMonaco as unknown as Monaco, [script]);
      expect(addExtraLib).toHaveBeenCalledTimes(1);
      expect(dispose).not.toHaveBeenCalled();

      // 2回目 — 前回を破棄
      updateScriptDeclarations(mockMonaco as unknown as Monaco, [script]);
      expect(dispose).toHaveBeenCalledTimes(1);
      expect(addExtraLib).toHaveBeenCalledTimes(2);
    });
  });
});
