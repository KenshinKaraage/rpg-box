import type {
  LiteralValueSource,
  VariableValueSource,
  DataValueSource,
  RandomValueSource,
  ValueSourceHandler,
} from './types';

export const literalHandler: ValueSourceHandler<LiteralValueSource> = {
  type: 'literal',
  resolve(source) {
    return source.value;
  },
};

export const variableHandler: ValueSourceHandler<VariableValueSource> = {
  type: 'variable',
  resolve(source, context) {
    return context.variable.get(source.variableId);
  },
};

export const dataHandler: ValueSourceHandler<DataValueSource> = {
  type: 'data',
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
  resolve(source) {
    return Math.floor(Math.random() * (source.max - source.min + 1)) + source.min;
  },
};
