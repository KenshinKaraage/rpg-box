import { importDefaultDataTypes } from './importDefaultDataTypes';
import { defaultDataTypes } from './defaultDataTypes';
import { defaultClasses } from './defaultClasses';
import type { DataType } from '@/types/data';
import type { CustomClass } from '@/types/customClass';

describe('importDefaultDataTypes', () => {
  it('全デフォルトデータタイプとクラスをインポートする', () => {
    const addDataType = jest.fn();
    const addClass = jest.fn();

    const result = importDefaultDataTypes([], [], addDataType, addClass);

    expect(addClass).toHaveBeenCalledTimes(defaultClasses.length);
    expect(addDataType).toHaveBeenCalledTimes(defaultDataTypes.length);
    expect(result.importedClasses).toBe(defaultClasses.length);
    expect(result.skippedClasses).toBe(0);
    expect(result.importedTypes).toBe(defaultDataTypes.length);
    expect(result.skippedTypes).toBe(0);
  });

  it('既存のデータタイプはスキップする', () => {
    const addDataType = jest.fn();
    const addClass = jest.fn();
    const existingTypes: DataType[] = [{ id: 'character', name: 'キャラクター', fields: [] }];

    const result = importDefaultDataTypes(existingTypes, [], addDataType, addClass);

    expect(result.importedTypes).toBe(defaultDataTypes.length - 1);
    expect(result.skippedTypes).toBe(1);
  });

  it('既存のクラスはスキップする', () => {
    const addDataType = jest.fn();
    const addClass = jest.fn();
    const existingClasses: CustomClass[] = [{ id: 'class_status', name: 'ステータス', fields: [] }];

    const result = importDefaultDataTypes([], existingClasses, addDataType, addClass);

    expect(result.importedClasses).toBe(defaultClasses.length - 1);
    expect(result.skippedClasses).toBe(1);
  });

  it('全て既存の場合は何もインポートしない', () => {
    const addDataType = jest.fn();
    const addClass = jest.fn();

    const result = importDefaultDataTypes(defaultDataTypes, defaultClasses, addDataType, addClass);

    expect(addDataType).not.toHaveBeenCalled();
    expect(addClass).not.toHaveBeenCalled();
    expect(result.importedTypes).toBe(0);
    expect(result.skippedTypes).toBe(defaultDataTypes.length);
    expect(result.importedClasses).toBe(0);
    expect(result.skippedClasses).toBe(defaultClasses.length);
  });
});
