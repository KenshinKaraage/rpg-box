import type {
  LiteralValueSource,
  VariableValueSource,
  ObjectVariableValueSource,
  DataValueSource,
  RandomValueSource,
  ValueSourceHandler,
} from './types';

export const literalHandler: ValueSourceHandler<LiteralValueSource> = {
  type: 'literal',
  label: '直値',
  defaultValue: () => ({ type: 'literal', value: 0 }),
  resolve(source) {
    return source.value;
  },
};

export const variableHandler: ValueSourceHandler<VariableValueSource> = {
  type: 'variable',
  label: '変数',
  defaultValue: () => ({ type: 'variable', variableId: '' }),
  resolve(source, context) {
    return context.variable.get(source.variableId);
  },
};

export const objectVariableHandler: ValueSourceHandler<ObjectVariableValueSource> = {
  type: 'objectVariable',
  label: 'OBJ変数',
  defaultValue: () => ({ type: 'objectVariable', objectName: '', variableName: '' }),
  resolve(source, context) {
    return context.getObjectVariable(source.objectName, source.variableName);
  },
};

export const dataHandler: ValueSourceHandler<DataValueSource> = {
  type: 'data',
  label: 'データ参照',
  defaultValue: () => ({ type: 'data', dataTypeId: '', entryId: '', fieldId: '' }),
  resolve(source, context) {
    const entries = context.data[source.dataTypeId] as
      | (Record<string, unknown>[] & Record<string, Record<string, unknown>>)
      | undefined;
    if (!entries) return undefined;
    const entry = entries[source.entryId];
    if (!entry) return undefined;
    const fieldValue = entry[source.fieldId];
    if (source.subFieldId && typeof fieldValue === 'object' && fieldValue !== null) {
      return (fieldValue as Record<string, unknown>)[source.subFieldId];
    }
    return fieldValue;
  },
};

export const randomHandler: ValueSourceHandler<RandomValueSource> = {
  type: 'random',
  label: 'ランダム',
  defaultValue: () => ({ type: 'random', min: 0, max: 100 }),
  resolve(source) {
    return Math.floor(Math.random() * (source.max - source.min + 1)) + source.min;
  },
};
