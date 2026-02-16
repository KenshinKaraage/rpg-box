import type { Monaco } from '@monaco-editor/react';

import { SCRIPT_API_DECLARATIONS, registerApiDefinitions } from './apiDefinitions';

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
});
